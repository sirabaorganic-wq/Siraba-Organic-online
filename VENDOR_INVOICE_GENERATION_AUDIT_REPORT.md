# SIRABA ORGANIC — VENDOR INVOICE GENERATION DISCOVERY & AUDIT REPORT

**Audit Date:** October 3, 2026  
**Auditor:** Senior Backend Architect, Financial-Systems Engineer & QA Auditor  
**Scope:** Multi-Vendor Marketplace Invoice Architecture, VendorOrder Separation, GST Compliance, Security & Financial Reconciliation  
**Target Repository:** `Siraba-Organic-online-forked`

---

## 1. EXECUTIVE SUMMARY

An exhaustive discovery and architectural audit of the invoice generation system in Siraba Organic was conducted across all backend services, database schemas, API routes, templates, background queues, and frontend interfaces.

The primary finding is that **Siraba Organic currently has a dual, disjointed, and structurally defective invoice system**:
1. **No Dedicated Invoice Persistence:** There is **NO `Invoice` model or database collection** in the system. Invoices are never persisted, never statefully tracked, and never assigned an immutable, legal tax invoice number.
2. **Customer vs. Vendor Invoice Divergence:**
   - **Customer Route (`/api/invoices/:orderId/download`):** Treats Siraba Organic as a single reseller/merchant of record. It aggregates all items across multiple vendors into one consolidated document under Siraba's company name and admin GSTIN. It has **no concept of multi-vendor separation**.
   - **Vendor Route (`/api/vendors/invoices/:orderId/download`):** Attempts to produce a vendor-scoped document for a `VendorOrder`. However, it suffers from critical schema field mismatches (`platformCommission` vs `commission`, `taxAmount` vs `tax`, `shippingCost` vs `customerShippingCharge`). Because the vendor template file (`vendor-invoice-template.html`) does not exist on disk, it falls back to the customer template and renders an **arithmetically broken document** where the Grand Total is set to the vendor's net payout (`subtotal - commission`), while the subtotal is the customer price and commission is never displayed.
3. **Severe GST & Statutory Non-Compliance:**
   - GST is calculated globally as a flat rate (18%) on the order level, ignoring item category tax rates (e.g., 0% or 5% for organic agricultural produce/spices).
   - Zero support for CGST/SGST (intra-state) vs. IGST (inter-state).
   - HSN codes are not stored with orders and are hardcoded as `"0909"`.
   - Invoices are dynamically recalculated on download using live database values (e.g., live `GSTSettings`), violating tax document immutability requirements.
4. **Denial of Service Hazard:** Invoices are compiled and rendered via headless Chrome (`puppeteer`) on-the-fly inside synchronous HTTP GET handlers without rate limiting, connection pooling, or caching.

**Final Audit Verdict:** **`INVOICE SYSTEM AUDIT BLOCKED — REMEDIATION REQUIRED`**

---

## 2. CURRENT INVOICE ARCHITECTURE MAP

```text
[Customer Checkout] ──> POST /api/orders
                           │
                           ├── 1. Creates Order doc (Main Order)
                           │      (Aggregates all vendor products)
                           │
                           └── 2. Creates VendorOrder doc(s)
                                  (One VendorOrder per distinct Vendor)
                                  (Stores subtotal, commission, netAmount, tax)

[Customer Invoice Flow]
User / Admin ──> GET /api/invoices/:orderId/download
                   │
                   ├── Loads Order doc + User doc + GSTSettings (LIVE)
                   ├── Pulls logo.png (base64)
                   ├── Compiles templates/invoices/invoice-template.html (Handlebars)
                   ├── Spawns Puppeteer / Headless Chrome (Fallback: buildPureJsPdf)
                   └── Streams PDF binary: "Invoice-{ORDER_ID_LAST8}.pdf"
                   *(Never saved to DB; never saved to disk; no VendorOrder data)*

[Vendor Invoice Flow]
Vendor ──> GET /api/vendors/invoices/:orderId/download
             │
             ├── Loads VendorOrder doc + Vendor doc + GSTSettings (LIVE)
             ├── Attempts to read: templates/invoices/vendor-invoice-template.html
             │     └── File NOT FOUND -> Falls back to invoice-template.html
             ├── Prepares data with broken field references (commission=0, tax=0)
             ├── Sets grandTotal = netAmount (Payout) while Subtotal = Customer Price
             ├── Spawns Puppeteer / Headless Chrome (Fallback: buildPureJsPdf)
             └── Streams PDF binary: "Vendor-Invoice-VND-{VO_ID_LAST8}.pdf"
```

### Complete Component Inventory

| Component Type | File Path | Purpose / Implementation Status |
| -------------- | --------- | ------------------------------- |
| **Model** | `backend/models/Order.js` | Stores main order, items, total tax, shipping, payment status. Lacks persistent invoice data. |
| **Model** | `backend/models/VendorOrder.js` | Stores vendor slice of order. Lacks invoice number, invoice date, and persistent PDF link. |
| **Model** | `backend/models/GSTSettings.js` | Singleton storing global GST toggle, admin GSTIN, default rate (18%). |
| **Model** | `backend/models/Invoice.js` | **DOES NOT EXIST**. |
| **Route / Controller** | `backend/routes/invoiceRoutes.js` | Customer & Admin invoice preview and PDF download endpoint. |
| **Route / Controller** | `backend/routes/vendorInvoiceRoutes.js` | Vendor invoice list, stats, preview, and PDF download endpoint. |
| **PDF Engine** | `backend/utils/puppeteerHelper.js` | Chrome launcher and pure-JS PDF generator fallback (`buildPureJsPdf`). |
| **HTML Template** | `backend/templates/invoices/invoice-template.html` | Style 4 customer invoice template (Handlebars). |
| **HTML Template** | `backend/templates/invoices/vendor-invoice-template.html` | **MISSING FROM REPOSITORY**. Causes fallback to customer template. |
| **Email Service** | `backend/utils/emailService.js` | OTP & registration emails. Has **zero** invoice attachment capability. |
| **Vendor Email** | `backend/utils/vendorEmailService.js` | Operational shipping milestone notifications. Has **zero** invoice attachment logic. |
| **Frontend Utility** | `frontend/src/utils/invoiceUtils.js` | Client helper calling `/api/invoices/:orderId/download` and `/preview`. |
| **Frontend Page** | `frontend/src/pages/TrackOrder.jsx` | Consumer order tracking; allows consumer invoice download. |
| **Frontend Page** | `frontend/src/pages/vendor/VendorDashboard.jsx` | Vendor portal; allows vendor order invoice download. |
| **Frontend Page** | `frontend/src/pages/admin/Dashboard.jsx` | Admin portal; has both download button and separate client-side HTML print generator. |

---

## 3. INVOICE GENERATION MATRIX

| Trigger | Invoice Type | Source Component | Vendor Scoped? | Idempotent? | Status |
| ------- | ------------ | ---------------- | -------------- | ----------- | ------ |
| **Order Placement (COD / Prepaid)** | None | `orderRoutes.js:240-360` | N/A | N/A | **No invoice generated or recorded** |
| **Payment Verification** | None | `paymentController.js:127-235` | N/A | N/A | **No invoice generated or recorded** |
| **Razorpay Webhook (`payment.captured`)** | None | `razorpayWebhook.js:181-261` | N/A | N/A | **No invoice generated or recorded** |
| **Shipment Created / Picked Up** | None | `shiprocketService.js` | N/A | N/A | **No invoice generated or recorded** |
| **Delivery (`delivered`)** | None | `vendorRoutes.js:2049` | N/A | N/A | **No invoice generated or recorded** |
| **Customer Download Action** | Customer Platform Invoice | `invoiceRoutes.js:146` | **NO** (Lumps all vendors together) | No state stored | **Dynamically generated on-the-fly** |
| **Customer Preview Action** | Customer HTML Preview | `invoiceRoutes.js:114` | **NO** (Lumps all vendors together) | No state stored | **Dynamically generated on-the-fly** |
| **Vendor Download Action** | Vendor Sub-Order Invoice | `vendorInvoiceRoutes.js:154` | **YES** (Only vendor's items) | No state stored | **Dynamically generated on-the-fly (Arithmetic Defect)** |
| **Vendor Preview Action** | Vendor HTML Preview | `vendorInvoiceRoutes.js:130` | **YES** (Only vendor's items) | No state stored | **Dynamically generated on-the-fly (Arithmetic Defect)** |
| **Admin Download Action** | Customer Platform Invoice | `admin/Dashboard.jsx` via `invoiceUtils.js` | **NO** (Only customer order invoice) | No state stored | **Dynamically generated on-the-fly** |
| **Admin Print Action** | Client-Generated HTML | `admin/Dashboard.jsx:718` | **NO** | Client-side only | **Bypasses backend completely** |

---

## 4. MULTI-VENDOR VERIFICATION: ORDER → VENDORORDER → INVOICE

For a hypothetical multi-vendor transaction:
```text
Order #67A1B2C3 (Customer: Rahul Sharma)
├── Vendor A (Himalayan Herbs): Product A1 (Rs. 800) -> VendorOrder #VO-A101
└── Vendor B (Green Forest):    Product B1 (Rs. 500) -> VendorOrder #VO-B202
```

### Actual Behavior Discovered:
1. **Does the platform generate one invoice for the order, or one per vendor?**
   - **Both exist in code, but they are mutually disconnected, conflicting, and contradictory.**
   - The Customer only gets **one consolidated invoice** for the entire `Order` under Siraba Organic's name. The customer has **no access to individual VendorOrder invoices**.
   - The Vendor in their portal gets **one vendor-specific invoice** for their `VendorOrder`.
2. **Customer Invoice Cross-Contamination & Legal Supplier Ambiguity:**
   - The customer invoice lists Product A1 and Product B1 side-by-side.
   - The seller name is listed exclusively as **"Siraba Organic"** with Siraba's address and Admin GSTIN (`01AAAAA0000A1Z5`).
   - Neither Vendor A nor Vendor B is identified on the customer invoice.
   - In India, under GST law (Section 9(5) vs Section 52), if the platform is an e-commerce marketplace (facilitator), the **Vendor is the registered supplier of goods** and must issue the invoice to the customer. By issuing the invoice in Siraba's name, Siraba legally acts as a principal distributor/reseller, creating severe tax liabilities.

---

## 5. MULTI-VENDOR ISOLATION & ARITHMETIC INTEGRITY

### Vendor A Invoice Isolation:
* **Product Isolation:** **PASSED**. `vendorInvoiceRoutes.js` queries `VendorOrder.findOne({ _id, vendor: req.vendor._id })` and loops exclusively over `vendorOrder.items`. Vendor A does not see Vendor B's products or customer details from Vendor B's items.
* **Financial Cross-Contamination:** **PASSED**. Vendor A's subtotal reflects only Vendor A's items.

### Vendor Invoice Arithmetic Breakdown (CRITICAL DEFECT):
Due to implementation bugs in `backend/routes/vendorInvoiceRoutes.js`:
```javascript
// Lines 49-51 & 88-92
const itemsTotal = vendorOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const subtotal = vendorOrder.subtotal || itemsTotal;
const commission = vendorOrder.platformCommission || 0; // BUG: Schema has 'commission', NOT 'platformCommission'
const netAmount = vendorOrder.netAmount || (subtotal - commission);
...
subtotal: `₹${subtotal.toFixed(2)}`,
platformCommission: `₹${commission.toFixed(2)}`,
tax: vendorOrder.taxAmount ? `₹${vendorOrder.taxAmount.toFixed(2)}` : '₹0.00', // BUG: Schema has 'tax', NOT 'taxAmount'
shipping: vendorOrder.shippingCost ? `₹${vendorOrder.shippingCost.toFixed(2)}` : 'Free', // BUG: Schema has 'customerShippingCharge'
grandTotal: `₹${netAmount.toFixed(2)}`,
```

Because `vendor-invoice-template.html` is missing, Handlebars loads `invoice-template.html`. The resulting rendered document displays:
```text
Description: Product A1
Qty: 2 | Unit Price: Rs. 400.00 | Amount: Rs. 800.00

Subtotal:        Rs. 800.00
GST (18%):       Rs. 0.00       <-- Bug: vendorOrder.taxAmount is undefined
Shipping:        Free           <-- Bug: vendorOrder.shippingCost is undefined
GRAND TOTAL:     Rs. 720.00     <-- Bug: netAmount (800 - 80 commission) is injected into GRAND TOTAL!
```
**Impact:** A document entitled "TAX INVOICE" addressed to the Customer where the items total Rs. 800.00, tax is Rs. 0.00, and the Grand Total is Rs. 720.00 with **no explanation whatsoever of the missing Rs. 80.00**.

---

## 6. FINANCIAL RECONCILIATION

### Order Level Financial Flow (`backend/routes/orderRoutes.js`):
1. **Item Price:** Verified against MongoDB catalog (`Product.findById`). Variants verified against `selectedOption.price`.
2. **Catalog Subtotal:** `verifiedItemsPrice = SUM(itemPrice * quantity)`.
3. **Discounts:** `discountedSubtotal = Math.max(0, verifiedItemsPrice - verifiedDiscountAmount)`.
4. **GST / Tax:** Flat calculation: `verifiedTaxPrice = Math.round(discountedSubtotal * effectiveGstRate * 100) / 100`.
5. **Shipping:** Pincode-based Shiprocket API calculation via `calculateShipping`. Defaults to Rs. 0 if subtotal >= Rs. 999, else defaults to Rs. 66/83.
6. **Grand Total:** `verifiedTotalPrice = Math.round((discountedSubtotal + verifiedTaxPrice + verifiedShippingPrice) * 100) / 100`.

### Reconciliation Discrepancies on Customer Invoices:
| Financial Field | Stored in Order DB | Mapped in Customer Invoice | Rendered on Customer PDF | Discrepancy / Risk |
| --------------- | ------------------ | -------------------------- | ------------------------ | ------------------ |
| **Catalog Subtotal** | `order.itemsPrice` | `subtotal` | Displayed | Matches gross catalog total. |
| **Coupon Discount** | `order.discountAmount` | **OMITTED** | **NOT DISPLAYED** | **CRITICAL: If coupon applied, Subtotal + Tax + Shipping != Grand Total!** |
| **Tax** | `order.taxPrice` | `tax` | Displayed | Calculated on discounted subtotal, but discount is hidden. |
| **Shipping** | `order.shippingPrice` | `shipping` | Displayed | Matches DB. |
| **Grand Total** | `order.totalPrice` | `grandTotal` | Displayed | Matches payment gateway, but arithmetic does not add up on PDF. |

### Reconciliation Discrepancies on VendorOrder (`VendorOrder.js`):
| Financial Field | Stored in VendorOrder DB | Calculation Location | Invoice Value | Audit Finding |
| --------------- | ------------------------ | -------------------- | ------------- | ------------- |
| **Vendor Subtotal** | `vendorOrder.subtotal` | `orderRoutes.js:296` | Displayed as Subtotal | Full vendor gross item total. |
| **Coupon Allocation** | None | Not allocated | None | Marketplace absorbs full coupon discount; vendor subtotal is unreduced. |
| **Vendor Commission** | `vendorOrder.commission` | `orderRoutes.js:308` | ₹0.00 on PDF | Extracted field name mismatch causes it to read as 0. |
| **Vendor Tax Share** | `vendorOrder.tax` | `orderRoutes.js:313` | ₹0.00 on PDF | Extracted field name mismatch causes it to read as 0. |
| **Vendor Net Payout** | `vendorOrder.netAmount` | `orderRoutes.js:309` | Displayed as **Grand Total** | **Subtotal - Commission masquerades as Customer Grand Total.** |

---

## 7. GST / TAX AUDIT

| GST Requirement | Current Implementation Status | Compliance Assessment |
| --------------- | ----------------------------- | --------------------- |
| **Tax Inclusive vs Exclusive** | Tax-Exclusive: GST is calculated and added on top of product prices at checkout. | Fully verified by test suite. |
| **Per-Item vs Order-Level Tax** | **Order-Level**: A flat percentage is applied across the entire discounted subtotal. | **NON-COMPLIANT**. Different organic products (grains, raw spices, processed goods, oils) attract different GST rates (0%, 5%, 12%, 18%). |
| **CGST + SGST vs IGST** | **NOT IMPLEMENTED**. No classification based on supplier state vs. delivery state. | **NON-COMPLIANT**. Inter-state vs intra-state tax split is required under Indian GST law. |
| **Vendor GSTIN vs Admin GSTIN** | Customer invoice uses Admin GSTIN. Vendor invoice uses Vendor GSTIN (if claimed). | Defective: Marketplace issues single invoice with platform GSTIN for vendor goods. |
| **Historical Value Stability** | **VULNERABLE**. In `invoiceRoutes.js:99`, `gstPercentage: gstSettings.default_gst_percentage` is fetched live from the singleton model. If admin changes rate from 18% to 5%, historical invoices print the new rate with old tax amounts. | **NON-COMPLIANT**. Historical transactions must be immutable. |
| **HSN / SAC Codes** | Product schema has `hsn: "0909"`. However, `Order.orderItems` and `VendorOrder.items` **do not store HSN**. Invoices hardcode `"0909"` as fallback. | **NON-COMPLIANT**. Hardcoding spice HSN for all marketplace products violates tax classification. |

---

## 8. INVOICE NUMBERING AUDIT

* **Current Implementation:**
  - Customer Invoice: `'#' + order._id.toString().slice(-8).toUpperCase()`
  - Vendor Invoice: `'VND-' + vendorOrder._id.toString().slice(-8).toUpperCase()`
* **Persistence:** **ZERO**. Numbers are generated in string templates at runtime. Neither `Order` nor `VendorOrder` stores an `invoiceNumber` field.
* **Sequencing & Rule 46 CGST Compliance:**
  - Rule 46(b) of the CGST Rules requires consecutive serial numbering, unique for each financial year, not exceeding 16 characters.
  - Slicing 8 hex characters from a MongoDB ObjectId provides a 32-bit pseudorandom fragment (timestamp/counter mixture).
  - It is **non-consequential, non-sequential, and carries no financial year identifier** (e.g., `SO/25-26/0001`).
* **Concurrency Safety:** Because no sequence counter or unique index exists in MongoDB, two different threads generating an invoice will simply re-slice the ObjectId. There is no concurrency collision on creation because no database record is created.

---

## 9. DUPLICATE GENERATION RISKS

1. **Payment Controller vs Razorpay Webhook:**
   - Neither `paymentController.js` nor `razorpayWebhook.js` generates invoices. Therefore, webhook retries or race conditions between payment verification and webhooks do **not** create duplicate invoice records in the database.
2. **Stateless Re-generation Drift:**
   - Because generation is completely stateless and read-only, calling the download endpoint 10 times simply renders the template 10 times.
   - However, if the vendor updates their business address, or the customer updates their name, or admin changes the GST percentage between download 1 and download 2, **the customer receives two different invoices with different contents for the exact same order**.

---

## 10. PDF GENERATION & TEMPLATE AUDIT

### Puppeteer & Fallback Pipeline:
1. `launchBrowser()` checks for Chrome executable across system paths (`/usr/bin/google-chrome`, snap, local cache).
2. If Chrome is available, it navigates to Handlebars HTML and runs `page.pdf({ format: "A4", printBackground: true })`.
3. If Puppeteer fails (e.g. cloud container lacks Chromium dependencies or runs out of memory), it catches the error and executes `buildPureJsPdf(title, textBlocks)`:
   - Strips HTML tags into raw text lines.
   - Wraps text at 82 characters.
   - Generates an unstyled, ASCII-like PDF stream conforming to PDF-1.4.

### PDF Data Completeness:
| Section / Field | Customer Invoice (`invoice-template.html`) | Vendor Invoice (Falls back to same template) |
| --------------- | ------------------------------------------ | --------------------------------------------- |
| **Seller Info** | "Siraba Organic", Pampore, Kashmir | Vendor Business Name & Vendor Address |
| **Seller GSTIN** | Admin GSTIN | Vendor GSTIN (if `claim_gst` true) |
| **Buyer Info** | Customer Name, Full Address, Phone | Customer Name, Full Address, Phone |
| **Buyer GSTIN** | Shown if buyer provided GSTIN at checkout | Null / Not shown |
| **Line Items** | Name, Description, HSN ("0909"), Qty, Price, Total | Name, Description, HSN ("0909"), Qty, Price, Total |
| **Discounts** | **MISSING** (Omitted from template) | **MISSING** |
| **Tax Breakdown** | Flat GST % and flat GST amount | Defaults to Rs. 0.00 due to field bug |
| **Shipping** | Free or Rs. 66/83 | Defaults to Free due to field bug |
| **Commission** | Not applicable | **MISSING** (Subtracted from Grand Total invisibly) |
| **Grand Total** | Gross Order Total | Net Vendor Payout (Subtotal - Commission) |

---

## 11. SECURITY & ACCESS CONTROL AUDIT

### Download Authorization Matrix:
| Actor | Endpoint | Expected Access | Actual Access in Code | Audit Finding |
| ----- | -------- | --------------- | --------------------- | ------------- |
| **Customer A** | `GET /api/invoices/:orderId/download` (Own Order) | Allowed | Allowed (`order.user._id == req.user._id`) | **PASSED** |
| **Customer A** | `GET /api/invoices/:orderId/download` (Customer B Order) | Denied | Denied (Returns 403) | **PASSED** |
| **Customer A** | `GET /api/vendors/invoices/:orderId/download` | Denied | Denied (Returns 401 via `protectVendor`) | **PASSED** |
| **Vendor A** | `GET /api/vendors/invoices/:orderId/download` (Own VO) | Allowed | Allowed (`VendorOrder.findOne({ _id, vendor })`) | **PASSED** |
| **Vendor A** | `GET /api/vendors/invoices/:orderId/download` (Vendor B VO) | Denied | Denied (Returns 404 `Order not found`) | **PASSED** |
| **Admin** | `GET /api/invoices/:orderId/download` | Allowed | Allowed (`req.user.isAdmin` bypasses user check) | **PASSED** |
| **Admin** | `GET /api/vendors/invoices/:orderId/download` | Allowed | **DENIED (BUG)**: `approvedVendor` middleware checks `req.vendor.status`, which is undefined for admins. Admins receive 403! | **HIGH DEFECT** |
| **Unauthenticated** | Any invoice endpoint | Denied | Denied (401 from JWT protect middleware) | **PASSED** |

### File Storage Security:
* PDFs are **never written to disk, Cloudinary, or S3**.
* They are generated in volatile memory and piped straight into the HTTP response stream (`res.send(pdf)`).
* There are no public S3 buckets, no predictable file URLs, and no path traversal vulnerabilities in download endpoints.

---

## 12. REFUNDS / CANCELLATIONS / RTO BEHAVIOR

1. **Order or VendorOrder Cancelled:**
   - The invoice does **not** get deleted or archived.
   - When the endpoint is invoked, Handlebars sets `orderStatus: order.status.toUpperCase()`, rendering a pill that says `CANCELLED`.
   - **No Credit Note is generated.** Section 34 of the CGST Act requires a registered supplier to issue a Credit Note with specific statutory particulars when a supply is cancelled or refunded.
2. **Partial Cancellation / Partial Refund:**
   - In `orderRoutes.js` and `vendorRoutes.js`, when a partial refund is processed, `refundAmount` is updated on `Order` or logged in `RefundLog`.
   - The original `orderItems` and `itemsPrice` remain untouched in the database.
   - Re-downloading the invoice prints the **full original items and full original total** with zero indication that any items were cancelled or refunded.

---

## 13. EMAIL INTEGRATION

* **Customer Emails:** `emailService.js` handles OTP authentication and registration. **No order confirmation emails or invoice attachment emails exist in customer flows.**
* **Vendor Emails:** `vendorEmailService.js` dispatches rich HTML notifications on shipping milestones (`VENDOR_ORDER_RECEIVED`, `PICKUP_SCHEDULED`, `DELIVERED`, `ORDER_CANCELLED`).
* **Attachment Inspection:** Neither email service contains any code referencing `attachments: [...]` or PDF generation. Invoices are **never emailed** to customers or vendors.

---

## 14. VENDOR & ADMIN DASHBOARD UI AUDIT

### Vendor Dashboard (`frontend/src/pages/vendor/VendorDashboard.jsx`):
* Line 1169 correctly calls `/vendors/invoices/${order._id}/download` where `order._id` is the `VendorOrder._id` from `/api/vendors/orders`.
* It downloads `Vendor-Invoice-${order._id.slice(-8)}.pdf`.
* UI is scoped to the logged-in vendor.
* However, because the backend serves the arithmetically broken PDF (Subtotal Rs. 800 -> Total Rs. 720), vendors downloading this document receive an invalid statement.

### Admin Dashboard (`frontend/src/pages/admin/Dashboard.jsx`):
* Line 1384 has an "Invoice" button calling `downloadInvoice(order._id)` which hits `/api/invoices/:orderId/download`.
* This only downloads the consolidated customer invoice.
* **The Admin Dashboard has NO interface or capability to view or download vendor-specific sub-order invoices.**
* Lines 718-1096 contain a duplicate, hardcoded client-side HTML generator (`handlePrintInvoice`) that constructs raw HTML in a browser popup window. This client-side template has separate styling and hardcodes from the backend Handlebars template.

---

## 15. EXISTING TEST COVERAGE

* Existing test suite contains 15 test scripts in `backend/tests/`.
* `backend/tests/tax_pricing_audit.test.js` covers pricing formulas, rounding, and coupon interactions (all 37 assertions pass).
* **There are ZERO automated tests covering:**
  - `invoiceRoutes.js`
  - `vendorInvoiceRoutes.js`
  - PDF rendering or Puppeteer fallback
  - Handlebars template compilation
  - Authorization / IDOR on invoice endpoints
  - Multi-vendor invoice separation

---

## 16. CLASSIFIED AUDIT FINDINGS

### CRITICAL SEVERITY
1. **[CRITICAL] Broken Vendor Invoice Financial Arithmetic:**  
   `vendorInvoiceRoutes.js` maps `grandTotal` to `netAmount` (`subtotal - commission`), while `subtotal` is gross customer price, and `commission` is 0 due to field mismatch. The invoice template does not show commission deduction, displaying an impossible total (e.g. Subtotal Rs. 800, Total Rs. 720).
2. **[CRITICAL] Missing Vendor Invoice Template on Disk:**  
   `templates/invoices/vendor-invoice-template.html` does not exist in the codebase. Every vendor invoice falls back to the customer template, producing an inappropriate document.
3. **[CRITICAL] Customer Invoice Multi-Vendor Erasure & Tax Model Violation:**  
   The customer invoice lumps all items from all vendors under Siraba Organic's legal entity and admin GSTIN. If Siraba is an e-commerce marketplace (facilitator), the vendor is the legal supplier of goods under GST regulations. Issuing invoices under Siraba's name creates massive unremitted GST exposure.
4. **[CRITICAL] Coupon Discount Missing from Customer Invoice Data:**  
   `invoiceRoutes.js` does not pass `discountAmount` or `couponCode` to the template. When a coupon is used, Subtotal + GST + Shipping does not equal the Grand Total printed on the PDF.
5. **[CRITICAL] Total Lack of Invoice Persistence & Immutability:**  
   No `Invoice` collection exists. Invoices are generated dynamically from live tables. Changes to vendor profiles or GST settings retroactively alter historical invoices.

### HIGH SEVERITY
6. **[HIGH] Denial of Service (OOM) via Unbounded Puppeteer PDF Generation:**  
   Synchronous execution of `launchBrowser()` inside user-facing GET endpoints without queuing, browser pooling, rate limiting, or caching will cause Out-Of-Memory container crashes under concurrent download requests.
7. **[HIGH] CGST/SGST vs IGST Non-Compliance:**  
   Tax calculations apply a single flat 18% rate regardless of vendor state vs customer state, and regardless of product tax categories (e.g. 0%/5% for unprocessed organic goods).
8. **[HIGH] Statutory Numbering Non-Compliance (Rule 46 CGST Rules):**  
   Invoice numbers are unpersisted 8-character substrings of MongoDB ObjectIds (`#DEF01234` / `VND-DEF01234`). They are non-consecutive, not bound to a financial year, and non-compliant with GST rules.
9. **[HIGH] Admin Inability to Access Vendor Invoices:**  
   Admins attempting to call `/api/vendors/invoices/:orderId/download` receive a 403 Forbidden because `approvedVendor` requires a valid `req.vendor` object.

### MEDIUM SEVERITY
10. **[MEDIUM] Lack of Credit Notes on Cancellation/Refund:**  
    Cancelled or partially refunded orders continue to display original invoice totals with only a status label update; no statutory Credit Note (Section 34 CGST Act) is created.
11. **[MEDIUM] Dual Template Divergence in Admin Dashboard:**  
    `admin/Dashboard.jsx` maintains an inline 370-line HTML invoice generator that diverges from `invoice-template.html`.
12. **[MEDIUM] Zero Email Invoice Delivery:**  
    Invoices are never emailed upon order confirmation or fulfillment.

### LOW & OBSERVATIONS
13. **[LOW] Hardcoded Spice HSN ("0909"):**  
    HSN codes are not copied into order line items and default to `"0909"`.
14. **[OBSERVATION] Zero Invoice Automated Test Coverage:**  
    Existing automated tests verify financial math formulas, but do not test HTTP endpoints, template rendering, or authorization.

---

## 17. RECOMMENDED REMEDIATION PLAN

### Phase A — Critical Correctness & Architecture (Immediate Priority)
1. **Define Marketplace Legal Model:** Align with legal/tax counsel on whether Siraba operates under:
   - *Model 1 (Marketplace Facilitator)*: Vendor issues Tax Invoice for goods to customer; Siraba issues Commission Tax Invoice to vendor.
   - *Model 2 (Merchant of Record / Reseller)*: Siraba buys from vendor and sells to customer.
2. **Implement Persistent `Invoice` Model:**  
   Create a dedicated MongoDB `Invoice` collection storing:
   - `invoiceNumber` (sequential, e.g. `SO/25-26/0001` or `VND-ABC/25-26/0001`)
   - `orderId`, `vendorOrderId`, `vendorId`, `userId`
   - `invoiceType` (`CUSTOMER_TAX_INVOICE`, `VENDOR_SETTLEMENT_INVOICE`, `CREDIT_NOTE`)
   - `frozenDataSnapshot` (immutable copy of buyer, seller, items, taxes, discounts at generation time)
   - `status` (`issued`, `cancelled`, `refunded`)
3. **Create Dedicated `vendor-invoice-template.html`:**  
   Implement a clean template tailored specifically for vendor sub-orders or vendor settlement sheets.
4. **Fix Schema Field References:**  
   Correct `platformCommission` -> `commission`, `taxAmount` -> `tax`, `shippingCost` -> `customerShippingCharge`.

### Phase B — Financial Reconciliation & Multi-Vendor Logic
1. **Pass `discountAmount` and `couponCode`** into `invoice-template.html` and show explicit line-item discount subtraction.
2. **Apportion Platform Discounts:** Clearly document whether platform coupons reduce vendor gross or are subsidized by platform commission.
3. **Include GST Split (CGST/SGST vs IGST):** Compare `sellerState` with `shippingAddress.state` to compute proper intra/inter-state tax breakdown.

### Phase C — Security & Operational Stability
1. **Fix Admin Access to Vendor Invoices:** Update `vendorMiddleware.js` to allow admins to view any vendor invoice.
2. **Mitigate Puppeteer OOM Hazards:**
   - Store generated PDF files in object storage (S3 / Cloudinary) upon initial order confirmation/fulfillment.
   - Serve subsequent download requests directly from pre-rendered storage or pre-signed URLs.
   - Implement rate-limiting on PDF generation routes.

### Phase D — PDF & Document Quality
1. **HSN Categorization:** Ensure product-specific HSN codes are snapshotted into `order.orderItems` and `vendorOrder.items`.
2. **Remove Redundant Client-Side Generator:** Deprecate inline HTML generator in `admin/Dashboard.jsx` in favor of backend API download.

### Phase E — Testing & Verification
1. **Comprehensive Test Suite:** Build automated tests verifying:
   - Customer invoice math (with/without discounts, shipping, GST).
   - Vendor invoice math and vendor isolation.
   - RBAC/IDOR checks for customer, vendor, and admin roles.
   - Fallback PDF generation under simulated Chrome failure.

---

## FINAL VERDICT

```text
INVOICE SYSTEM AUDIT BLOCKED — REMEDIATION REQUIRED
```
