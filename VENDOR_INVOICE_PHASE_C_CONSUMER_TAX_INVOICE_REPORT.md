# SIRABA ORGANIC — PHASE C CONSUMER TAX INVOICE REPORT
## VENDOR-AS-SELLER MARKETPLACE MODEL: IMPLEMENTATION, HARDENING & VERIFICATION

---

## 1. EXECUTIVE SUMMARY

In Phase C of the financial document remediation, Siraba Organic's consumer tax invoice system was transitioned from the legacy Merchant-of-Record / Reseller model (where Siraba Organic was erroneously represented as the seller of vendor products) to the confirmed **Vendor-as-Seller Marketplace Model**.

Under this model:
- **Vendors are the statutory sellers-of-record and suppliers of goods** for all customer product purchases.
- **Siraba Organic acts strictly as a neutral e-commerce marketplace facilitator / platform operator** under Section 79 of the Information Technology Act and Section 9(5) / Section 52 of the Central Goods and Services Tax Act.
- Customer-facing product tax invoices represent the **relevant Vendor as the Supplier/Seller** (capturing Vendor Legal Name, Trade Name, Registered Address, 2-digit GST State Code, and Vendor GSTIN).
- Multi-vendor orders generate **separate, vendor-isolated customer tax invoices**, preventing any cross-vendor item, GST, commission, or shipping leakage.
- Independent vendor-owned invoice numbering sequences (e.g., `VND-2F34D3/26-27/000001`) ensure each vendor possesses their own financial-year aware sequence.
- An issuance lifecycle gate blocks final tax invoice creation while vendor orders remain pending approval, eliminating sequence burn and unearned invoice allocation.
- Hardcoded legacy fallbacks (including the universal `"0909"` HSN and flat `"GST / Tax"` display) were eliminated in favor of authoritative product HSN codes and dynamic CGST+SGST (intra-state) or IGST (inter-state) presentation.
- All 36 Phase C automated tests, 37 Tax/GST pricing audit tests, and 14 Legal agreement tests pass with zero failures. Real Puppeteer PDF generation and programmatic text extractions were verified across all 6 production scenarios.

---

## 2. CONFIRMED MARKETPLACE MODEL

The executive business and legal decision confirms the following operational and tax architecture:

| Attribute | Statutory Treatment | Document Manifestation |
| :--- | :--- | :--- |
| **Seller of Goods** | Relevant Vendor Partner | Customer Tax Invoice (`CUSTOMER_TAX_INVOICE`) Header |
| **Seller of Record** | Vendor Partner (Vendor GSTIN) | Displayed as `SUPPLIER / SELLER` with Vendor GSTIN |
| **Platform Role** | E-Commerce Marketplace Facilitator | Displayed as `Marketplace Facilitator: Siraba Organic` |
| **Customer Product Invoice** | Vendor-to-Customer Tax Invoice | Billed to Customer; No Siraba commission displayed |
| **Marketplace Service** | Siraba-to-Vendor Commission | Distinct `VENDOR_COMMISSION_INVOICE` (SAC 998311, 18% GST) |
| **Vendor Settlement** | Internal Merchandise Payout Statement | Distinct `VENDOR_SETTLEMENT_STATEMENT` (Subtotal - Commission) |
| **Refunds / Cancellations** | Vendor-specific Credit Note | Distinct `CREDIT_NOTE` referencing original invoice |

---

## 3. BEFORE ARCHITECTURE VS. AFTER ARCHITECTURE

```text
BEFORE PHASE C (Merchant-of-Record / Reseller Anomaly):
Customer Order
      │
      ▼
Combined Single Invoice [SO/26-27/XXXXXX]
      ├── Seller: Siraba Organic (123 Saffron Valley, Pampore, J&K)
      ├── Seller GSTIN: Siraba's GSTIN (01AABCS1429B1Z1)
      ├── Items: Vendor A + Vendor B mixed together
      ├── HSN: Hardcoded fallback "0909" across diverse goods
      ├── Tax: Flat "GST / Tax ₹XX" without jurisdiction split
      └── Status Anomaly: Issued while order was "PENDING VENDOR APPROVAL"

AFTER PHASE C (Statutory Vendor-as-Seller Marketplace Architecture):
Customer Order
      │
      ├── VendorOrder A (Vendor A goods only)
      │         │
      │         ▼ [Issuance Lifecycle Gate: Requires Confirmed Status]
      │   Customer Tax Invoice A [VND-VNDRA/26-27/000001]
      │         ├── Seller: Vendor A Legal Name & Registered Address
      │         ├── Seller GSTIN: Vendor A GSTIN (e.g. 01AAACN1234F1Z9)
      │         ├── Facilitator: Siraba Organic (Platform Operator)
      │         ├── Items: Vendor A items only (GI Saffron, HSN 09102010)
      │         ├── Tax: Dynamic IGST (Inter-state) or CGST+SGST (Intra-state)
      │         └── Financials: Subtotal - Discount + Tax + Shipping = Total
      │
      └── VendorOrder B (Vendor B goods only)
                │
                ▼ [Issuance Lifecycle Gate: Requires Confirmed Status]
          Customer Tax Invoice B [VND-VNDRB/26-27/000001]
                ├── Seller: Vendor B Legal Name & Registered Address
                ├── Seller GSTIN: Vendor B GSTIN (e.g. 01BBBCV5678G1Z2)
                ├── Facilitator: Siraba Organic (Platform Operator)
                ├── Items: Vendor B items only (Acacia Honey, HSN 04090000)
                ├── Tax: Dynamic IGST (Inter-state) or CGST+SGST (Intra-state)
                └── Financials: Subtotal - Discount + Tax + Shipping = Total
```

---

## 4. INVOICE LIFECYCLE & ISSUANCE GATING

Prior to Phase C, requesting an invoice preview or PDF download on an order with status `"Pending"` consumed an invoice sequence number and stamped `"STATUS: PENDING VENDOR APPROVAL"` onto a finalized tax invoice.

### Remediated Lifecycle:
1. **Order Creation:** Parent `Order` created; child `VendorOrder`(s) created with `status: 'pending'`.
2. **Invoice Request Attempt Before Approval:**
   - Any attempt to issue a customer tax invoice while `vendorOrder.status === 'pending'` is **BLOCKED**.
   - Service throws an explicit `400 Bad Request`: `"Tax invoice cannot be issued while vendor order is pending approval"`.
   - Zero sequence numbers are consumed; zero documents are created in MongoDB.
3. **Vendor Acceptance & Confirmation:**
   - Vendor accepts order; status transitions to `'confirmed'` (or `'processing'` / `'shipped'`).
4. **Authoritative Issuance Event:**
   - `getOrCreateCustomerInvoiceForVendorOrder(vendorOrderId)` executes.
   - Validates seller identity completeness (`businessName`, `state`, `city`).
   - Atomically allocates next sequential vendor invoice number.
   - Captures immutable snapshots: Seller, Buyer, Items, Pricing, Discounts, Taxes, Totals.
   - Persists `CUSTOMER_TAX_INVOICE` with status `'issued'` (or `'paid'`).
5. **Post-Issuance Retrieval:**
   - All subsequent previews, PDF downloads, and customer/admin views return the existing immutable document idempotently without modifying values or consuming numbers.

---

## 5. SELLER IDENTITY & PLATFORM FACILITATOR BRANDING

### Seller Snapshot Schema & Ingestion:
Every customer tax invoice persists an immutable `sellerSnapshot`:
- `vendorId`: Unique Vendor ObjectId
- `legalName`: Statutory business name registered by vendor
- `tradeName`: Brand / trade name (from `shopSettings.shopName` or brand name)
- `address`: Registered street address
- `city`, `state`, `stateCode`: Registered jurisdiction and 2-digit GST state code (e.g., `'01'` for J&K, `'29'` for Karnataka, `'27'` for Maharashtra)
- `postalCode`, `country`: Postal PIN and `'India'`
- `gstin`: Vendor's verified GSTIN (e.g., `01AAACN1234F1Z9`)
- `isMarketplaceFacilitator`: `true`
- `facilitatorName`: `'Siraba Organic'`

### Platform Branding Representation:
- Siraba Organic appears in the invoice header and metadata as:
  `Marketplace Facilitator: Siraba Organic`
  `Platform Operator — Under Sec 79 IT Act`
- The invoice footer explicitly states:
  > *"Goods sold by [Vendor Legal Name] through the Siraba Organic e-commerce marketplace platform. Siraba Organic acts solely as an e-commerce facilitator / marketplace operator under Section 79 of the Information Technology Act and applicable GST laws. Tax invoice issued on behalf of the supplier of goods."*

---

## 6. MULTI-VENDOR INVOICE ARCHITECTURE & ISOLATION

In a multi-vendor order, customer purchases are split across distinct vendor tax documents:

| Field / Dimension | Customer Invoice A (Vendor A) | Customer Invoice B (Vendor B) |
| :--- | :--- | :--- |
| **Seller** | Vendor A Organics Pvt Ltd | Vendor B Honey Farms |
| **Seller GSTIN** | `01AAAAA1111A1Z1` | `01BBBBB2222B2Z2` |
| **Invoice Number** | `VND-2F34D3/26-27/000001` | `VND-6F4A12/26-27/000001` |
| **Items Contained** | Saffron 2g (HSN 09102010) | Raw Honey 500g (HSN 04090000) |
| **Subtotal** | ₹1,000.00 | ₹600.00 |
| **Allocated Discount** | ₹125.00 | ₹75.00 |
| **Taxable Value** | ₹875.00 | ₹525.00 |
| **GST (5% IGST)** | ₹43.75 | ₹26.25 |
| **Grand Total** | ₹918.75 | ₹551.25 |
| **Reconciliation** | ₹918.75 + ₹551.25 = ₹1,470.00 (Customer Total Paid) |

### Isolation Guarantees:
- **No Item Leakage:** Vendor A's items never appear in Vendor B's itemsSnapshot.
- **No Tax Leakage:** Vendor A's tax breakdown is calculated solely from Vendor A's taxable subtotal.
- **No Sequence Collisions:** Separate MongoDB unique compound index `{ invoiceType: 1, order: 1, vendorOrder: 1 }` guarantees atomic uniqueness.

---

## 7. INVOICE NUMBERING ARCHITECTURE

Vendor-owned numbering replaces the monolithic platform prefix:

1. **Vendor Prefix Resolution:**
   - Vendor code if explicitly configured, or standard vendor prefix:
     `VND-[Last 6 Hex of VendorId]` (e.g., `VND-2F34D3`)
2. **Fiscal Year Format:**
   - Indian financial calendar aware (`April 1 – March 31`), formatting as `YY-(YY+1)` (e.g., `26-27`).
3. **Atomic Sequence Generation:**
   - Mongo `$inc` on sequence key:
     `CUSTOMER_TAX_INVOICE_[VendorId]_[FinancialYear]`
   - Number format:
     `[VENDOR-PREFIX]/[FINANCIAL-YEAR]/[000001]` (e.g., `VND-2F34D3/26-27/000001`).
4. **Idempotency:**
   - Re-requesting an invoice returns the existing document; no sequence increment occurs.
   - PDF download routes stream the pre-existing document without touching the sequence generator.

---

## 8. AUTHORITATIVE GST ENGINE INTEGRATION

All invoice calculations consume the authoritative `backend/utils/gstEngine.js` module without code duplication:

- **Supply Jurisdiction Engine:**
  - Evaluates Vendor State (dispatch origin) vs. Delivery Address State (Place of Supply).
  - Intra-State: Allocates 50% to CGST and 50% to SGST; IGST is strictly `0.00`.
  - Inter-State: Allocates 100% to IGST; CGST and SGST are strictly `0.00`.
- **Dynamic Presentation:**
  - Intra-State invoices render:
    - `Central GST (CGST @ 2.5%): ₹22.50`
    - `State GST (SGST @ 2.5%): ₹22.50`
  - Inter-State invoices render:
    - `Integrated GST (IGST @ 5%): ₹45.00`
  - Flat, non-statutory `"GST / Tax"` rows have been completely removed.
- **State Code Authority:**
  - Integrated `getStateCode(stateName)` maps Indian states and union territories to their official 2-digit GST state codes (J&K: `'01'`, Delhi: `'07'`, Maharashtra: `'27'`, Karnataka: `'29'`, etc.).

---

## 9. HSN CODE AUDIT & REMOVAL OF 0909 FALLBACKS

### Repository Audit & Classification of "0909":
Every occurrence of `"0909"` was audited across the repository:

| File Location | Context | Previous State | Remediation |
| :--- | :--- | :--- | :--- |
| `backend/models/Product.js:77` | Product schema | `default: "0909"` | Removed default; authentic HSN mandatory |
| `backend/models/Order.js:18` | Order item schema | `default: "0909"` | Removed default |
| `backend/models/VendorOrder.js:26` | Vendor order items | `default: "0909"` | Removed default |
| `backend/models/Invoice.js:78` | Items snapshot | `default: "0909"` | Removed default |
| `backend/routes/orderRoutes.js:133` | Order creation | `dbProduct.hsn || "0909"` | Replaced with `dbProduct.hsn || ""` |
| `backend/routes/orderRoutes.js:359` | Vendor order creation | `product.hsn || "0909"` | Replaced with `product.hsn || ""` |
| `backend/routes/vendorRoutes.js:1531` | Product onboarding | `hsn || "0909"` | Replaced with `hsn ? String(hsn).trim() : ""` |
| `backend/routes/vendorInvoiceRoutes.js:79` | Settlement statement | `item.hsn || '0909'` | Replaced with `item.hsn || ''` |
| `backend/utils/gstEngine.js:261` | Items tax mapping | `item.hsn ... || '0909'` | Replaced with `item.hsn ... || ''` |
| `backend/templates/invoices/invoice-template.html` | Consumer template | Inline `"0909"` fallback | Replaced with dynamic `{{this.hsn}}` / `"N/A"` |
| `frontend/src/pages/admin/Dashboard.jsx:992` | Client duplicate | Hardcoded `"0909"` | Removed duplicate generator completely |

---

## 10. DISCOUNT ALLOCATION PRESENTATION

In accordance with Phase B rules:
- Platform absorbs promotional coupon discounts while vendor payout remains based on gross catalog merchandise value.
- The customer tax invoice clearly displays the mathematical reconciliation:
  ```text
  Gross Subtotal:                 ₹1,000.00
  Less: Discount (SAVE200):        -₹125.00
  Taxable Value:                    ₹875.00
  Integrated GST (IGST @ 5%):        ₹43.75
  Shipping Charge:                    Free
  -----------------------------------------
  GRAND TOTAL:                      ₹918.75
  ```
- Tax is calculated strictly on the post-discount taxable amount (₹875.00 * 5% = ₹43.75), adhering to Section 15(3) of the CGST Act.

---

## 11. SHIPPING HANDLING

- Customer shipping charges are sourced authoritatively from `vendorOrder.customerShippingCharge` and snapshotted in `shippingSnapshot`.
- Free shipping orders (`>= ₹999` threshold or subsidized) display `"Free"` on the customer tax invoice.
- Paid shipping charges display the exact customer amount charged (e.g., `₹60.00`).
- No internal vendor logistics costs or carrier settlement fees are leaked onto the customer invoice.

---

## 12. COMMISSION INVOICE SEPARATION

The system enforces strict document separation between Customer Product Invoices and Platform Commission Invoices:

| Dimension | Customer Tax Invoice | Platform Commission Invoice |
| :--- | :--- | :--- |
| **Type** | `CUSTOMER_TAX_INVOICE` | `VENDOR_COMMISSION_INVOICE` |
| **Seller** | Vendor Partner | Siraba Organic |
| **Buyer / Recipient** | Retail Customer | Vendor Partner |
| **Goods / Service** | Organic Products (Spices, Honey) | Marketplace Facilitation (SAC 998311) |
| **Tax Rate** | Product GST Rate (0%, 5%, 12%, 18%) | 18% GST (Standard Service Rate) |
| **Invoice Number** | `VND-[VendorCode]/26-27/000001` | `SO-COMM/26-27/000001` |

---

## 13. CREDIT NOTE ARCHITECTURE

When refunds or cancellations occur:
- An immutable `CREDIT_NOTE` document is generated (`CN/26-27/000001`).
- The credit note links to `originalInvoice: originalInvoice._id` and records the refund reason, reference, and refunded line items.
- The original `CUSTOMER_TAX_INVOICE` remains **100% immutable**; it is never updated in-place or deleted.
- In multi-vendor orders, credit notes are vendor-isolated to the specific `VendorOrder`.

---

## 14. AUTHORIZATION & TENANT ISOLATION

Every invoice route enforces strict role-based access control:
- **Customer:** Authenticated user can preview and download invoices for orders where `order.user._id === req.user._id`. Requests for another user's order return `403 Forbidden`.
- **Vendor:** Can view settlements and customer invoices only for their own `VendorOrder`s (`vendorOrder.vendor === req.vendor._id`). Cross-vendor queries return `403 Forbidden`.
- **Admin:** Authenticated admins (`req.user.isAdmin`) have system-wide access to view and download all customer and vendor invoices.

---

## 15. DUPLICATE GENERATOR AUDIT & DEPRECATION

The audit detected an unsafe client-side generator in `frontend/src/pages/admin/Dashboard.jsx:718-1098` (`handlePrintInvoice`), which synthesized raw HTML in the browser using hardcoded Siraba Organic seller details and HSN `0909`.

**Remediation:**
- Removed the 380-line client-side HTML builder.
- Replaced `handlePrintInvoice(order)` with an authoritative call to `previewInvoice(order._id)` from `frontend/src/utils/invoiceUtils.js`.
- All views now consume backend-generated HTML/PDF derived from immutable snapshots.

---

## 16. HISTORICAL IMMUTABILITY VERIFICATION

A dedicated immutability test verified that after a customer tax invoice is issued:
1. Product price in the database was mutated from `₹500` to `₹9,999`.
2. Product name was changed to `'Mutated Saffron Name'`.
3. Product HSN was changed to `'9999'`.
4. Vendor business name was mutated to `'Mutated Vendor Name LLC'`.
5. Vendor GSTIN was mutated to `'99MUTATED9999Z9'`.
6. Re-fetching the issued invoice confirmed that **100% of the invoice's fields remained unchanged**:
   - `itemsSnapshot[0].unitPrice === 500`
   - `itemsSnapshot[0].hsn === '0910'`
   - `sellerSnapshot.legalName === 'Vendor A Organics Pvt Ltd'`
   - `sellerSnapshot.gstin === '01AAAAA1111A1Z1'`

---

## 17. AUTOMATED TEST SUITE RESULTS

### Suite 1: `backend/tests/invoice_generation.test.js` (Phase C Expansion)
```text
============================================================
🧾  SIRABA ORGANIC — PHASE C VENDOR-AS-SELLER VERIFICATION SUITE
============================================================

── Group A: Single-Vendor Customer Tax Invoice (Vendor as Seller) ──
  [ PASS ]  Single-Vendor: Seller represents Vendor A, NOT Siraba Organic
  [ PASS ]  Single-Vendor: Vendor GSTIN and Address are accurately snapshotted
  [ PASS ]  Single-Vendor: Siraba GSTIN does not appear as Seller GSTIN

── Group B: Multi-Vendor Order & Isolation ──
  [ PASS ]  Multi-Vendor: Separate invoices generated for each VendorOrder
  [ PASS ]  Multi-Vendor Isolation: Invoice A contains ONLY Vendor A products
  [ PASS ]  Multi-Vendor Isolation: Invoice B contains ONLY Vendor B products
  [ PASS ]  Multi-Vendor Isolation: Zero cross-vendor GST leakage
  [ PASS ]  Multi-Vendor: getOrCreateCustomerInvoicesForOrder returns all vendor invoices

── Group C: GST Rates & Dynamic Supply Jurisdiction ──
  [ PASS ]  GST Jurisdiction: Intra-State allocates equal CGST and SGST (IGST is 0)
  [ PASS ]  GST Jurisdiction: Inter-State allocates 100% to IGST (CGST and SGST are 0)
  [ PASS ]  GST Rates: 0%, 5%, 12%, 18% support without floating-point drift

── Group D: HSN Preservation & Anti-0909 Gate ──
  [ PASS ]  HSN Preservation: Authentic product HSN codes 0910 and 0409 preserved
  [ PASS ]  HSN Anti-0909 Gate: Product without HSN does NOT silently become 0909

── Group E: Discount Allocation & Totals Reconciliation ──
  [ PASS ]  Discount: Allocated coupon discount displayed and reduces taxable value
  [ PASS ]  Financial Gate: Gross - Discount + Tax + Shipping === Grand Total exactly
  [ PASS ]  Financial Gate: Intra-state invoice reconciles: 500 + 25 + 60 = 585

── Group F: Shipping Economics Snapshot ──
  [ PASS ]  Shipping: Free shipping eligible order preserves ₹0.00 charge
  [ PASS ]  Shipping: Paid shipping charge matches VendorOrder snapshot (₹60.00)

── Group G: Vendor-Owned Invoice Numbering ──
  [ PASS ]  Numbering: Vendor-specific sequence prefix used (e.g. VND-XXXX)
  [ PASS ]  Numbering: FY format conforms to Indian calendar (e.g. 26-27)
  [ PASS ]  Numbering Idempotency: Repeated call returns EXACT same invoice without incrementing sequence
  [ PASS ]  Numbering Concurrency: Atomic sequence guarantees no collisions

── Group H: Issuance Lifecycle Gate ──
  [ PASS ]  Lifecycle Gate: Pending approval VendorOrder blocks customer invoice issuance
  [ PASS ]  Lifecycle Gate: Incomplete vendor seller identity blocks issuance

── Group I: Authorization & Tenant Isolation ──
  [ PASS ]  Authorization: Customer can access their own invoice
  [ PASS ]  Authorization: Vendor A owns their invoice record
  [ PASS ]  Authorization: Vendor B cannot claim Vendor A customer invoice

── Group J: Historical Immutability ──
  [ PASS ]  Immutability: Mutating Product and Vendor live data does NOT alter issued invoice

── Group K: Credit Note Architecture ──
  [ PASS ]  Credit Note: Persistent sequential CN linked to original invoice
  [ PASS ]  Credit Note: Original Customer Tax Invoice remains completely immutable

── Group L: Commission & Settlement Separation ──
  [ PASS ]  Commission Separation: Customer Tax Invoice contains NO vendor commission fields
  [ PASS ]  Commission Separation: Vendor Settlement Statement correctly reflects net payout
  [ PASS ]  Commission Separation: Siraba Commission Invoice bills Vendor under SAC 998311

── Group M: PDF Template & Rendering ──
  [ PASS ]  PDF Template: HTML renders Vendor as Seller and Siraba as Facilitator
  [ PASS ]  PDF Template: Amount in Words correctly formatted in Indian English
  [ PASS ]  PDF Fallback: Pure-JS PDF builds valid PDF buffer without Puppeteer

============================================================
TEST EXECUTION SUMMARY:
  Total:  36 | Passed: 36 | Failed: 0
============================================================
All Phase C Invoice Verification Tests Passed Successfully!
```

### Suite 2: `backend/tests/tax_pricing_audit.test.js`
- **Result:** **37 / 37 PASS** (Customer tax-exclusive pricing, threshold shipping, coupon discounts, settlement isolation, Razorpay paise reconciliation).

### Suite 3: `backend/tests/legal_agreements.test.js`
- **Result:** **14 / 14 PASS** (Cryptographic SHA-256 byte hashing, agreement execution, immutability enforcement, audit trail).

---

## 18. REAL PDF PRODUCTION VERIFICATION

Real PDF documents were rendered via Puppeteer and programmatically audited using Python `pypdf`:

| Verification Case | Output PDF File | File Size | Seller Verified | GST Type | Grand Total | HSN Verified | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Case 1: Single Vendor Intra-State** | `case1_single_vendor_intra_state.pdf` | 437,888 B | Noor Saffron & Spice Guild | CGST (₹22.50) + SGST (₹22.50) | ₹995.00 | `09102010` | **VERIFIED** |
| **Case 2: Single Vendor Inter-State** | `case2_single_vendor_inter_state.pdf` | 437,679 B | Noor Saffron & Spice Guild | IGST (₹90.00) | ₹1,890.00 | `09102010` | **VERIFIED** |
| **Case 3A: Multi-Vendor (Vendor A)** | `case3_multivendor_vendorA_saffron.pdf` | 437,477 B | Noor Saffron & Spice Guild | IGST (₹45.00) | ₹945.00 | `09102010` | **VERIFIED** |
| **Case 3B: Multi-Vendor (Vendor B)** | `case3_multivendor_vendorB_honey.pdf` | 442,098 B | Chenab Valley Honey Coop | IGST (₹32.50) | ₹682.50 | `04090000` | **VERIFIED** |
| **Case 4: Discounted Order** | `case4_discounted_order.pdf` | 452,063 B | Noor Saffron & Spice Guild | IGST (₹80.00 on post-discount) | ₹1,680.00 | `09102010` | **VERIFIED** |
| **Case 5: Order with Shipping** | `case5_order_with_shipping.pdf` | 441,020 B | Chenab Valley Honey Coop | IGST (₹32.50) + Shipping (₹75) | ₹757.50 | `04090000` | **VERIFIED** |
| **Case 6: Pending Vendor Approval** | N/A (Blocked) | N/A | Issuance Gate Active | N/A | N/A | N/A | **BLOCKED (VERIFIED)** |

### Programmatic PDF Audit Output:
```text
============================================================
PROGRAMMATIC PDF TEXT EXTRACTION & VERIFICATION
============================================================
--- Verifying case1_single_vendor_intra_state.pdf (437888 bytes) ---
  [PASS] Intra-state CGST+SGST verified, Vendor seller verified, authentic HSN verified
--- Verifying case2_single_vendor_inter_state.pdf (437679 bytes) ---
  [PASS] Inter-state IGST verified, Vendor seller verified
--- Verifying case3_multivendor_vendorA_saffron.pdf (437477 bytes) ---
  [PASS] Multi-vendor Vendor A isolation verified, no item leakage
--- Verifying case3_multivendor_vendorB_honey.pdf (442098 bytes) ---
  [PASS] Multi-vendor Vendor B isolation verified, no item leakage
--- Verifying case4_discounted_order.pdf (452063 bytes) ---
  [PASS] Discount allocation and taxable value verified
--- Verifying case5_order_with_shipping.pdf (441020 bytes) ---
  [PASS] Shipping charge and grand total reconciliation verified
============================================================
ALL 6 PDF VERIFICATION CASES PROGRAMMATICALLY VALIDATED!
============================================================
```

---

## 19. FINANCIAL RECONCILIATION AUDIT GATE

Every generated customer tax invoice adheres strictly to the statutory reconciliation formula:

$$\text{Gross Subtotal} - \text{Coupon Discount} = \text{Taxable Subtotal}$$
$$\text{Taxable Subtotal} + \text{Applicable GST} + \text{Customer Shipping} = \text{Grand Total}$$

Multi-vendor parent orders reconcile across child invoices:
$$\text{Parent Order Subtotal} = \sum \text{VendorOrder Subtotals}$$
$$\text{Parent Order Tax} = \sum \text{VendorOrder Taxes}$$
$$\text{Parent Order Total} = \sum \text{Vendor Customer Invoices}$$

Vendor payouts remain isolated from consumer tax obligations:
$$\text{Vendor Net Payout} = \text{Gross Merchandise} - \text{Platform Commission}$$

---

## 20. REMAINING ACCOUNTING & LEGAL DECISIONS (NON-BLOCKING)

In accordance with strict boundary guidelines, the following forward-looking policy items were left model-neutral without guessing:
1. **Tax Collected at Source (TCS) under Sec 52 CGST Act:** Currently disabled pending explicit accounting team activation of the platform TCS filing schedule.
2. **Shipping GST Composition:** Shipping is billed directly as customer freight. Whether shipping attracts 18% standalone GST or inherits the principal product GST rate under composite supply rules is flagged for final accounting sign-off.
3. **E-Invoicing (IRN / QR Code):** Applicable to vendors with annual turnover exceeding ₹5 Crore. QR code rendering hooks are provisioned in the invoice schema for future integration.

---

## 21. FILES CHANGED & IMPACT ANALYSIS

| File Path | Description of Changes | Financial / Tax Impact |
| :--- | :--- | :--- |
| `backend/models/Invoice.js` | Added `vendorId`, `isMarketplaceFacilitator`, `facilitatorName`, `stateCode` to seller and buyer snapshots; removed `0909` default. | Guarantees immutable snapshot of Vendor as seller with platform facilitator attribution. |
| `backend/models/Product.js` | Removed `default: "0909"` from `hsn`. | Prevents unclassified products from inheriting spice HSN code. |
| `backend/models/Order.js` | Removed `default: "0909"` from `orderItems.hsn`. | Eliminates fallback corruption during checkout ingestion. |
| `backend/models/VendorOrder.js` | Removed `default: "0909"` from `items.hsn`. | Ensures vendor order items preserve authentic product classification. |
| `backend/utils/gstEngine.js` | Added authoritative `getStateCode` mapping; removed `'0909'` fallback. | Accurately derives 2-digit Indian GST state codes for all states and UTs. |
| `backend/utils/invoiceNumberGenerator.js` | Added vendor-specific sequence numbering (`CUSTOMER_TAX_INVOICE_[VendorId]_[FY]`). | Isolates customer tax invoice sequences per vendor without platform prefix conflation. |
| `backend/services/invoiceService.js` | Overhauled customer invoice creation with Vendor-as-Seller architecture, issuance gating, and commission invoice generation. | Authoritative financial service enforcing vendor isolation and approval gating. |
| `backend/routes/invoiceRoutes.js` | Updated preview/download routes to handle multi-vendor orders and vendor snapshots; added `numberToWordsINR`. | Secures multi-vendor endpoints and provides Indian Rupee words on invoices. |
| `backend/routes/vendorInvoiceRoutes.js` | Removed `'0909'` fallback from settlement statement item mapping. | Prevents legacy fallback in vendor portal statements. |
| `backend/routes/orderRoutes.js` | Removed `|| "0909"` fallbacks during order item verification. | Guarantees orders store genuine product HSN codes. |
| `backend/routes/vendorRoutes.js` | Removed `|| "0909"` fallback during vendor product creation. | Forces products to store authentic HSN or empty string. |
| `backend/templates/invoices/invoice-template.html` | Redesigned template to display Vendor as Seller, Siraba as Facilitator, dynamic CGST/SGST vs IGST, clean HSN, and amount in words. | Eliminates visual and statutory ambiguity on final customer documents. |
| `frontend/src/pages/admin/Dashboard.jsx` | Removed 380-line client-side duplicate generator; routed to `previewInvoice`. | Prevents client-side fabrication of non-statutory invoices. |
| `backend/tests/invoice_generation.test.js` | Expanded test suite to 36 tests covering Groups A through M. | Automated regression and correctness gate for continuous deployment. |

---

## 22. FINAL VERDICT

------------------------------------------------------------
PHASE C CONSUMER TAX INVOICE REMEDIATION VERIFIED
------------------------------------------------------------
