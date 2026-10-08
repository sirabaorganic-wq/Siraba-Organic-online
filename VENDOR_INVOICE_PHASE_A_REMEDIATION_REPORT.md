# SIRABA ORGANIC — VENDOR INVOICE PHASE A REMEDIATION REPORT

**Remediation Phase:** Phase A — Critical Correctness & Architecture Foundation  
**Date:** October 3, 2026  
**Auditor & Systems Engineer:** Senior E-Commerce Backend Architect & Financial-Systems Engineer  
**Status:** COMPLETE & VERIFIED  

---

## 1. LEGAL MODEL STATUS

```text
NOT CONFIRMED — BUSINESS/TAX DECISION REQUIRED
```

During discovery and implementation, an irreconcilable conflict was identified between the legal agreements and the technical checkout code:
1. **Legal Framework (`master-vendor-agreement-template.html`):** Designates Siraba as a **Marketplace Platform and Neutral Facilitator** under IT Act 2000; vendors retain product title until delivery; vendor prices are inclusive of GST (**MODEL 1**).
2. **Checkout & Legacy Invoice Code (`orderRoutes.js` & `invoiceRoutes.js`):** Invoiced all products under Siraba Organic's legal entity and admin GSTIN, acting as the principal **Merchant of Record / Reseller** (**MODEL 2**).

In strict accordance with the project directives, **we did not make an arbitrary assumption or silently change seller identity on existing customer invoices**. Instead:
* We created a formal decision document: [`INVOICE_LEGAL_MODEL_DECISION_REQUIRED.md`](./INVOICE_LEGAL_MODEL_DECISION_REQUIRED.md).
* We implemented model-neutral, persistent invoice infrastructure in Phase A capable of supporting either Model 1 or Model 2 seamlessly once confirmed by executive and accounting counsel.

---

## 2. ARCHITECTURE BEFORE VS AFTER

### BEFORE (Stateless & Vulnerable)
```text
Customer / Vendor / Admin
          │
          ▼
   HTTP Download Request
          │
          ├── Reads live Order / VendorOrder (No persisted Invoice document)
          ├── Reads live GSTSettings (Retroactively mutates historical invoices)
          ├── Formats runtime ObjectId slice: '#' + order._id.slice(-8)
          ├── vendor-invoice-template.html MISSING on disk -> Falls back to consumer template
          ├── Mismatched field names (platformCommission, taxAmount, shippingCost) -> Defaults to ₹0.00
          ├── Grand Total overwritten with vendor net payout (Arithmetic mismatch)
          ├── Discounts completely omitted from PDF
          ├── Synchronous unthrottled Puppeteer launch (High OOM / DoS hazard)
          └── Admin blocked from vendor invoices (403 Forbidden)
```

### AFTER (Persistent, Immutable & Secure)
```text
Customer / Vendor / Admin
          │
          ▼
   HTTP Download / Preview Request
          │
          ▼
   invoiceService (Idempotent Gateway)
          │
          ├── 1. Checks MongoDB `Invoice` collection for existing issued document
          │      (Indexed uniquely: invoiceType + order + vendorOrder)
          │
          ├── 2. If exists: Loads immutable snapshots (Zero recalculation drift)
          │
          └── 3. If new:
                 ├── Generates atomic sequential number: SO/26-27/000001 or VND-SETTLE/26-27/000001
                 ├── Snapshots seller, buyer, line items, taxes, discounts, and totals at issuance
                 └── Persists to MongoDB `Invoice` collection
          │
          ▼
   Dedicated Handlebars Templates
          ├── Customer Tax Invoice: `templates/invoices/invoice-template.html`
          │     (Includes explicit Coupon Discount & Taxable Subtotal rows; arithmetically balances)
          └── Vendor Statement: `templates/invoices/vendor-invoice-template.html` (CREATED)
                (Clearly separates Gross Subtotal, Commission deduction, and Net Payout)
          │
          ▼
   Guarded PDF Rendering Engine (`puppeteerHelper.js`)
          ├── In-process concurrency limiter (Max 2 concurrent renders)
          ├── Strict 25s timeout & guaranteed browser/page closure in `finally` blocks
          └── Graceful fallback to `buildPureJsPdf` on headless Chrome failure
```

---

## 3. PERSISTENT INVOICE MODEL (`backend/models/Invoice.js`)

A dedicated Mongoose model was created implementing full audit-grade snapshots:

| Field Group | Key Fields | Purpose |
| ----------- | ---------- | ------- |
| **Identity & Indexing** | `invoiceNumber`, `invoiceType`, `financialYear`, `sequenceNumber`, `status`, `issuedAt` | Unique, concurrency-safe document tracking. |
| **Relationships** | `order`, `vendorOrder`, `vendor`, `customer` | Explicit entity linkage with compound idempotency indexes. |
| **Seller Snapshot** | `legalName`, `tradeName`, `address`, `city`, `state`, `postalCode`, `country`, `gstin`, `email`, `phone` | Preserves seller identity permanently, immune to subsequent vendor profile edits. |
| **Buyer Snapshot** | `name`, `email`, `phone`, `gstin`, `gstClaimed`, `shippingAddress`, `billingAddress` | Preserves customer tax and destination information at transaction time. |
| **Items Snapshot** | Array of `{ product, name, sku, hsn, quantity, unitPrice, lineTotal, taxRate, taxAmount, taxableAmount }` | Preserves line-level pricing, SKU, and HSN codes. |
| **Discount Snapshot** | `couponCode`, `discountAmount`, `discountedSubtotal` | Restores visibility of applied promotional codes and coupon deductions. |
| **Tax Snapshot** | `gstEnabled`, `gstPercentage`, `taxPrice`, `isInterState` | Freezes the tax percentage and amounts applied during checkout. |
| **Shipping Snapshot**| `shippingPrice`, `isFreeShipping`, `carrier`, `trackingNumber` | Preserves shipping charges and logistics assignment. |
| **Totals Snapshot** | `subtotal`, `discountAmount`, `taxableSubtotal`, `taxPrice`, `shippingPrice`, `grandTotal`, `commissionAmount`, `commissionRate`, `netPayoutAmount` | Complete financial reconciliation snapshot. |

---

## 4. INVOICE NUMBERING INFRASTRUCTURE

* **Counter Model:** [`backend/models/InvoiceSequence.js`](./backend/models/InvoiceSequence.js)
* **Generator Utility:** [`backend/utils/invoiceNumberGenerator.js`](./backend/utils/invoiceNumberGenerator.js)
* **Financial Year Handling:** Dynamically calculates Indian Fiscal Year (April 1 to March 31):
  - April 2026 – March 2027 = `26-27`
  - April 2027 – March 2028 = `27-28`
* **Concurrency Safety:** Uses atomic `findOneAndUpdate` with `$inc: { sequence: 1 }` and `upsert: true`. Multiple concurrent requests cannot generate duplicate numbers.
* **Format:**
  - Customer Tax Invoice: `SO/{FY}/{000001}` (e.g. `SO/26-27/000001`)
  - Vendor Order & Settlement Statement: `VND-SETTLE/{FY}/{000001}` (e.g. `VND-SETTLE/26-27/000001`)
  - Vendor Commission Invoice: `SO-COMM/{FY}/{000001}`
  - Credit Note: `CN/{FY}/{000001}`

---

## 5. FINANCIAL RECONCILIATION & ARITHMETIC CORRECTIONS

### Customer Invoice Reconciliation
* **Defect Fixed:** When a coupon discount was applied, the PDF previously omitted the discount, causing `Subtotal + Tax + Shipping != Grand Total`.
* **Formula Implemented in Template:**
  $$\text{Subtotal} - \text{Coupon Discount} = \text{Taxable Subtotal}$$
  $$\text{Taxable Subtotal} + \text{GST} + \text{Shipping} = \text{Grand Total}$$
* **Verification:** Tested with Subtotal ₹1600, Coupon ₹200, Taxable ₹1400, GST ₹252, Shipping ₹0 $\rightarrow$ Grand Total ₹1652. Balances to the cent.

### Vendor Invoice Reconciliation
* **Defects Fixed:**
  - Field references corrected: `platformCommission` $\rightarrow$ `commission`, `taxAmount` $\rightarrow$ `tax`, `shippingCost` $\rightarrow$ `customerShippingCharge`.
  - Disguised payout eliminated: Net Payout (`subtotal - commission`) is no longer labeled as customer "Grand Total".
* **New Structure in Dedicated Template:**
  - **Gross Items Subtotal:** Vendor product sales value (`vendorOrder.subtotal`)
  - **Allocated GST Share:** Proportionate GST share (`vendorOrder.tax`)
  - **Customer Shipping Share:** Customer shipping paid for vendor consignment (`vendorOrder.customerShippingCharge`)
  - **Platform Commission:** Itemized platform deduction (`-vendorOrder.commission` @ `commissionRate%`)
  - **NET VENDOR PAYOUT:** The net settlement disbursement payable to the vendor (`vendorOrder.netAmount`)

---

## 6. MULTI-VENDOR ISOLATION

* **Vendor Isolation:** Confirmed via automated tests. Vendor A's statement contains **only Vendor A's products**, quantities, and totals. Vendor B's statement contains **only Vendor B's products**.
* **Tenant Security:** Vendor A attempting to access Vendor B's sub-order via `/api/vendors/invoices/:orderId/download` receives a `403 Forbidden` / `404 Not Found`.
* **Cross-Contamination:** Zero cross-vendor contamination in snapshots or rendered PDFs.

---

## 7. AUTHORIZATION MATRIX

| Actor | Endpoint | Behavior | Audit Status |
| ----- | -------- | -------- | ------------ |
| **Customer A** | `GET /api/invoices/:orderId/download` | Allowed for own orders; 403 for other customers. | **VERIFIED** |
| **Vendor A** | `GET /api/vendors/invoices/:orderId/download` | Allowed for own sub-orders; 403/404 for other vendors. | **VERIFIED** |
| **Admin** | `GET /api/invoices/:orderId/download` | Permitted access to any customer invoice. | **VERIFIED** |
| **Admin** | `GET /api/vendors/invoices/:orderId/download` | **FIXED**: Admins bypass vendor ID checks and can inspect any vendor invoice. | **VERIFIED** |
| **Unauthenticated**| Any invoice endpoint | Denied with 401 Unauthorized. | **VERIFIED** |

---

## 8. PDF GENERATION SAFETY & RELIABILITY

* **Concurrency Throttling:** Added in-process semaphore (`acquirePdfRenderSlot` / `releasePdfRenderSlot` in `puppeteerHelper.js`) limiting active Puppeteer rendering instances to a maximum of 2. Excessive concurrent requests queue cleanly.
* **Execution Timeout:** Enforced a strict 25-second timeout on Chrome page rendering.
* **Leak Prevention:** Guaranteed browser and page disposal within `finally` blocks, preventing orphaned zombie Chromium processes on Linux/Render.
* **Pure-JS Fallback:** Maintained `buildPureJsPdf` as an unkillable fallback in the event of headless Chrome crashes or container memory ceilings.

---

## 9. TEST RESULTS

### Dedicated Phase A Invoice Suite (`backend/tests/invoice_generation.test.js`)
* **Total Tests:** 15
* **Passed:** 15
* **Failed:** 0
* **Coverage:**
  1. Customer Tax Invoice generation and persistence
  2. Snapshot completeness across all financial sections
  3. Vendor Settlement Statement generation and persistence
  4. Vendor A item isolation
  5. Vendor B item isolation
  6. Cross-vendor unauthorized access denial
  7. Customer invoice arithmetic balance (Subtotal - Discount + Tax + Shipping = GrandTotal)
  8. Vendor settlement breakdown clarity (Subtotal, Commission, Net Payout)
  9. Invoice generation idempotency (identical ID and number on repeat calls)
  10. Concurrency-safe atomic sequential numbering
  11. Indian Financial Year fiscal calendar boundary formatting
  12. Historical immutability under live vendor, product, and tax configuration mutations
  13. Template file existence on disk (`vendor-invoice-template.html`)
  14. Handlebars template compilation and rendering
  15. Pure-JS PDF fallback buffer generation

### Regression Testing: Tax Pricing Audit Suite (`backend/tests/tax_pricing_audit.test.js`)
* **Total Tests:** 37
* **Passed:** 37
* **Failed:** 0
* **Status:** 100% Green. Zero changes made to core checkout or pricing formulas.

### Regression Testing: Legal Agreements Suite (`backend/tests/legal_agreements.test.js`)
* **Total Tests:** 14
* **Passed:** 14
* **Failed:** 0
* **Status:** 100% Green. Electronic execution and legal snapshots intact.

---

## 10. REMAINING TAX & LEGAL WORK

### Fixed in Phase A
* [x] Persistent `Invoice` and `InvoiceSequence` models in MongoDB.
* [x] Immutable transaction snapshots (seller, buyer, items, discounts, taxes, totals).
* [x] Sequential, concurrency-safe Indian Financial Year numbering (`SO/26-27/000001`, `VND-SETTLE/26-27/000001`).
* [x] Dedicated, branded `vendor-invoice-template.html` created on disk.
* [x] Vendor invoice arithmetic fixed (gross subtotal vs platform commission vs net payout).
* [x] Schema field mismatches resolved (`commission`, `tax`, `customerShippingCharge`).
* [x] Coupon discount and taxable subtotal rows added to customer template.
* [x] Admin access to vendor invoices unblocked.
* [x] Puppeteer concurrency limiting and resource leak prevention implemented.
* [x] Comprehensive 15-test automated verification suite created.

### Deferred to Phase B (Financial & GST Engine Remediation)
* [ ] Multi-tier category GST calculation engine (0%, 5%, 12%, 18%).
* [ ] Intra-state vs. inter-state tax engine (CGST + SGST vs. IGST determination).
* [ ] Line-level HSN tax mapping from product catalog during checkout.
* [ ] Statutory Credit Note workflow for cancellations and returns (Section 34 CGST Act).
* [ ] Asynchronous pre-generation and persistent S3/Cloudinary object storage for PDF blobs.

### Requires Executive & Legal Confirmation
* [ ] Final determination of Operating Model: **Model 1 (Marketplace Facilitator)** vs. **Model 2 (Merchant of Record)** as detailed in [`INVOICE_LEGAL_MODEL_DECISION_REQUIRED.md`](./INVOICE_LEGAL_MODEL_DECISION_REQUIRED.md).

---

## FINAL VERDICT

```text
PHASE A TECHNICAL REMEDIATION VERIFIED — LEGAL MODEL DECISION REQUIRED
```
