# SIRABA ORGANIC — PHASE D
## VENDOR HSN MANAGEMENT & FLAT 18% GST IMPLEMENTATION REPORT

**Author:** Antigravity AI Engineering Assistant  
**Date:** October 8, 2026  
**Status:** Complete  
**Final Verdict:** `PHASE D TECHNICALLY VERIFIED — CA CONFIRMATION REQUIRED`  

---

## 1. Executive Summary

In accordance with explicit business directives from the client, Phase D remediates and standardizes the tax classification and Goods and Services Tax (GST) architecture for the **Siraba Organic multi-vendor marketplace**.

### Core Business Directives Executed:
1. **Vendor Ownership of Goods & HSN:** Vendors are the independent sellers and suppliers of products. Each vendor holds sole statutory responsibility for providing and maintaining the Harmonized System of Nomenclature (HSN) code for their products.
2. **Platform Facilitator Boundary:** Siraba Organic operates strictly as the platform/marketplace facilitator under Section 79 of the Information Technology Act, 2000 and Section 9(5) / Section 52 of the Central Goods and Services Tax (CGST) Act, 2017.
3. **Flat 18% GST Rate on Customer Product Sales:** A centralized flat **18% GST rate** is now applied across all customer product transactions (Intra-State: 9% CGST + 9% SGST; Inter-State: 18% IGST on post-discount taxable value).
4. **Strict Issuance Gate for Missing HSN:** If any product line lacks an authentic HSN code, the final tax invoice issuance is strictly blocked. No fallback (e.g., `0909`, `N/A`, or empty strings) is permitted in runtime code.
5. **Dedicated Vendor Dashboard HSN Management Tab:** Each vendor has a dedicated dashboard tab (`HSN Management`) to monitor, configure, and inline-edit HSN codes for their catalog under strict multi-tenant authorization boundaries.
6. **Platform Commission Isolation:** Siraba's marketplace facilitation invoice remains an isolated B2B service transaction under Services Accounting Code (SAC) `998311` and does not inherit customer product GST configurations.

---

## 2. Existing HSN Audit

A comprehensive codebase audit was conducted across backend models, routes, services, and frontend templates:
1. **Field Existence:** `Product.js` previously maintained an optional `hsn` field. Phase D introduced and standardized `Product.hsnCode` alongside `Product.hsn`, keeping both in bi-directional synchronization via a Mongoose pre-save hook.
2. **Nullable / Default Values:** No hardcoded schema default existed on `Product.js`, but legacy products in the database had empty strings or unstandardized casing.
3. **Audit of `0909` Fallbacks:**
   - **Zero runtime fallback** to `0909` was detected in runtime controllers or services.
   - Historical test fixtures and legacy sample scripts referenced `0909` as dummy data; all production routes and invoice issuance flows have zero fallback logic.
4. **Order and Snapshot Propagation:**
   - Previously, orders and invoices copied `hsn` but lacked `hsnCode`.
   - Phase D updated `Order.js`, `VendorOrder.js`, and `Invoice.js` to explicitly snapshot both `hsnCode` and `hsn`.
5. **Invoice Issuance Blocker:**
   - Previously, missing HSN allowed invoice generation with empty strings.
   - Phase D implemented a strict issuance blocker throwing HTTP 400 (`Product HSN code is required before a tax invoice can be issued.`).

---

## 3. Product HSN Implementation

### 3.1 Data Schema Standardization
- **Primary Field:** `hsnCode` (String, trimmed, 2 to 8 alphanumeric characters).
- **Secondary Field:** `hsn` (synchronized automatically for backward compatibility).
- **Pre-save Hook (`backend/models/Product.js`):**
  ```javascript
  productSchema.pre('save', function (next) {
    if (this.isModified('hsnCode') && this.hsnCode) {
      this.hsn = this.hsnCode.trim();
    } else if (this.isModified('hsn') && this.hsn && !this.hsnCode) {
      this.hsnCode = this.hsn.trim();
    }
    next();
  });
  ```

### 3.2 Anti-Inference Policy
- The platform does **not** infer HSN codes from product titles or categories.
- The platform does **not** assign default HSN codes.
- The platform rejects auto-generation; the vendor must explicitly provide the code.

---

## 4. Vendor Dashboard HSN Management

A dedicated UI module was developed in `frontend/src/pages/vendor/VendorDashboard.jsx`:

### 4.1 Navigation
- Added `HSN Management` navigation item with a `FileText` icon in the vendor sidebar.
- Positioned prominently next to Products and Orders.

### 4.2 Compliance Warning & Summary Cards
- **Summary Cards:**
  - `Total Products`
  - `Configured HSN` (Count with green check badge)
  - `Products Missing HSN` (Count with amber/red badge)
- **Critical Compliance Alert Banner:**
  When `missingCount > 0`, displays:
  > **Tax Compliance Alert: X product(s) missing HSN codes.**  
  > *These products cannot be used for final tax invoice issuance until an HSN code is provided. Please configure HSN codes below to avoid order processing delays.*

### 4.3 Management Table Features
- Columns: `Product`, `SKU`, `Category`, `Current HSN`, `HSN Status`, `Last Updated`, `Action`.
- Status Badges:
  - `Configured` (Green badge with checkmark)
  - `Missing` (Amber/red badge with alert icon)
- Inline Editing:
  - Vendors can click `Edit HSN`, type the code in an inline input, and click `Save` or `Cancel`.
  - Performs instant API mutation (`PATCH /api/vendors/products/:id/hsn`) and reloads summary counts.
- Search & Filter:
  - Filter by status (`All Statuses`, `Missing HSN Only`, `Configured Only`).
  - Search by product name or SKU.

### 4.4 Product Creation & Edit Forms
- Added `HSN Code *` input field positioned logically between Category and Price.
- Helper text: `Enter the HSN code applicable to this product. Please confirm the correct HSN with your tax/accounting advisor.`
- Badge indicating `Customer GST: Flat 18% Applicable`.

---

## 5. API Changes

### 5.1 Vendor Product Routes (`backend/routes/vendorRoutes.js`)
1. **`POST /api/vendors/products`**:
   - Mandates `hsnCode` in request body.
   - Validates regex `/^[A-Za-z0-9]{2,8}$/`.
   - Persists both `hsnCode` and `hsn`.
2. **`PUT /api/vendors/products/:productId`**:
   - Validates updated `hsnCode`.
   - Enforces strict vendor ownership (`vendor: req.vendor._id`).
3. **`GET /api/vendors/products/hsn-summary`**:
   - Returns `{ total, configuredCount, missingCount, missingProducts: [...] }` for the authenticated vendor only.
4. **`PATCH /api/vendors/products/:productId/hsn`**:
   - Dedicated endpoint for rapid inline HSN updates.
   - Validates format and checks ownership before persisting.

### 5.2 Order & Invoice Routes
1. **`backend/routes/orderRoutes.js`**: Snapshots `hsnCode` and `hsn` during checkout item verification and vendor order creation.
2. **`backend/routes/invoiceRoutes.js`**: Exposes both `hsnCode` and `hsn` to Handlebars invoice rendering data.

---

## 6. Database Changes & Migration

### 6.1 Schema Updates
- `Product`: Added `hsnCode` with index.
- `Order.orderItems`: Added `hsnCode` field.
- `VendorOrder.items`: Added `hsnCode` field.
- `Invoice.itemsSnapshot`: Added `hsnCode` field.

### 6.2 Migration Script (`backend/scripts/migrate_hsn_phase_d.js`)
- Executed against remote MongoDB Atlas cluster.
- Audited all existing catalog products:
  - Synchronized `hsnCode` from existing `hsn` values without overwriting authentic data.
  - Trimmed whitespace and uppercase-standardized codes.
  - Left unconfigured products as `HSN missing` without inventing false values.
  - Result: 8/8 products audited and synchronized successfully.

---

## 7. Centralized GST Configuration

### 7.1 Single Source of Truth
In `backend/utils/gstEngine.js`:
```javascript
const CUSTOMER_PRODUCT_GST_RATE = 18; // Flat 18%
const CUSTOMER_PRODUCT_GST_RATIO = 0.18;
```
All customer product tax calculations reference this constant. No scattered `0.18` magic numbers exist in the codebase.

### 7.2 Tax Breakdown Calculation
- **Intra-State:**
  $$\text{CGST} = \text{Round}(\text{Taxable Subtotal} \times 0.09)$$
  $$\text{SGST} = \text{Round}(\text{Taxable Subtotal} \times 0.09)$$
- **Inter-State:**
  $$\text{IGST} = \text{Round}(\text{Taxable Subtotal} \times 0.18)$$

---

## 8. Customer Tax Invoice Changes

In `backend/services/invoiceService.js` and `backend/templates/invoices/invoice-template.html`:
1. **Supplier / Seller:** Authoritatively displays Vendor legal name, trade name, address, and GSTIN.
2. **Platform Facilitator:** Displays Siraba Organic as Marketplace Facilitator under Section 79 IT Act.
3. **Item Columns:** Displays `PRODUCT DESCRIPTION`, `HSN`, `QTY`, `UNIT PRICE`, `DISCOUNT`, `TAXABLE VAL`, `GST%` (18%), `LINE TOTAL`.
4. **Strict Issuance Gate:** Throws HTTP 400 if any product item lacks HSN.

---

## 9. Credit Note Architecture (Section 34 CGST Act)

In `createCreditNote()`:
1. Calculates tax and base from gross refund amount:
   $$\text{Taxable Amount} = \text{Round}\left(\frac{\text{Refund Amount}}{1.18}\right)$$
   $$\text{Tax Amount} = \text{Refund Amount} - \text{Taxable Amount}$$
2. Reconciles: $\text{Taxable Subtotal} + \text{Tax Price} \equiv \text{Grand Total}$.
3. Preserves original HSN snapshot (`091020`, `040900`).
4. Original invoice remains completely immutable.

---

## 10. Siraba Commission Invoice Isolation

1. **Transaction Nature:** Independent B2B service invoice (`SO-COMM/...`).
2. **Classification:** Services Accounting Code (SAC) `998311` ("Platform facilitation / Web portal service").
3. **Isolation:** Completely separated from customer product GST rates.

---

## 11. Security & RBAC Enforcement

1. **Vendor Tenant Isolation:**
   - All product HSN updates (`PUT`, `PATCH`) enforce query criteria: `{ _id: productId, vendor: req.vendor._id }`.
   - Tested and verified: Vendor B cannot inspect or update Vendor A's product HSN codes.
2. **Admin Oversight:**
   - Administrators can view HSN codes and HSN status in the admin product management table.

---

## 12. Automated Verification Suite Results

### 12.1 Suite: `backend/tests/invoice_generation.test.js`
- **Total Tests:** 40
- **Passed:** 40
- **Failed:** 0
- **Coverage:**
  - Group A: Single-Vendor Customer Tax Invoice (3/3 Passed)
  - Group B: Multi-Vendor Order & Isolation (5/5 Passed)
  - Group C: GST Rates & Dynamic Supply Jurisdiction (3/3 Passed)
  - Group D: HSN Preservation & Anti-0909 Gate (3/3 Passed)
  - Group E: Discount Allocation & Totals Reconciliation (3/3 Passed)
  - Group F: Shipping Economics Snapshot (2/2 Passed)
  - Group G: Vendor-Owned Invoice Numbering (4/4 Passed)
  - Group H: Issuance Lifecycle Gate (2/2 Passed)
  - Group I: Authorization & Tenant Isolation (3/3 Passed)
  - Group J: Historical Immutability (1/1 Passed)
  - Group K: Credit Note Architecture (2/2 Passed)
  - Group L: Commission & Settlement Separation (3/3 Passed)
  - Group M: PDF Template & Pure-JS Fallback Rendering (3/3 Passed)
  - Group N: Phase D Vendor HSN Management & Security RBAC (3/3 Passed)

### 12.2 Suite: `backend/tests/tax_pricing_audit.test.js`
- **Total Tests:** 37
- **Passed:** 37
- **Failed:** 0

---

## 13. PDF & Scenario Verification (Phase 19)

Generated and verified via `backend/scripts/verify_phase_d_pdfs.js`:

| Scenario | Supply Type | Tax Rate & Breakdown | HSN Code | Status | Artifacts Generated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Single-Vendor Intra-State** | J&K $\to$ J&K | 9% CGST (₹90) + 9% SGST (₹90) | `091020` | **VERIFIED** | `scenario1_single_vendor_intrastate.html`, `.pdf` |
| **2. Single-Vendor Inter-State** | J&K $\to$ Karnataka | 18% IGST (₹180) | `091020` | **VERIFIED** | `scenario2_single_vendor_interstate.html`, `.pdf` |
| **3. Multi-Vendor Order** | Inter-State | Independent invoices (₹180 + ₹180) | `091020`, `040900` | **VERIFIED** | `scenario3_multivendor_invoiceA.html`, `scenario3_multivendor_invoiceB.html` |
| **4. Discounted Order** | Inter-State | 18% IGST on Taxable Value (₹144 on ₹800) | `091020` | **VERIFIED** | `scenario4_discounted_order.html` |
| **5. Shipping Order** | Intra-State | Product GST ₹90 + Shipping ₹83 = ₹673 | `040900` | **VERIFIED** | `scenario5_shipping_order.html` |
| **6. Credit Note** | Inter-State | Reverses ₹500 taxable + ₹90 IGST | `091020` | **VERIFIED** | Credit Note `CN/...` referencing original invoice |

---

## 14. Files Changed

| File Path | Description of Changes |
| :--- | :--- |
| [Product.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Product.js) | Standardized `hsnCode` field and bi-directional pre-save synchronization hook. |
| [Order.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Order.js) | Added `hsnCode` to `orderItems` schema. |
| [VendorOrder.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/VendorOrder.js) | Added `hsnCode` to `items` subdocument schema. |
| [Invoice.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js) | Added `hsnCode` to `itemsSnapshot` schema. |
| [gstEngine.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/gstEngine.js) | Centralized `CUSTOMER_PRODUCT_GST_RATE = 18` and updated tax breakdown logic. |
| [invoiceService.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js) | Implemented missing HSN blocker gate, 18% flat GST rate, and credit note reversal math. |
| [vendorRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/vendorRoutes.js) | Added HSN validation, `hsn-summary` endpoint, and inline `PATCH` endpoint with RBAC. |
| [orderRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/orderRoutes.js) | Snapshotted `hsnCode` and `hsn` into orders and vendor orders. |
| [invoiceRoutes.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/invoiceRoutes.js) | Mapped `hsnCode` and `hsn` into invoice Handlebars view model. |
| [migrate_hsn_phase_d.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/scripts/migrate_hsn_phase_d.js) | Database migration script for auditing and syncing product HSN fields. |
| [verify_phase_d_pdfs.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/scripts/verify_phase_d_pdfs.js) | Automated verification script generating the 6 Phase 19 test scenarios. |
| [invoice_generation.test.js](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/tests/invoice_generation.test.js) | Comprehensive 40-test Phase D verification suite. |
| [VendorDashboard.jsx](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/frontend/src/pages/vendor/VendorDashboard.jsx) | Added `HSN Management` tab, compliance alerts, and product creation/edit HSN inputs. |
| [Dashboard.jsx](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/frontend/src/pages/admin/Dashboard.jsx) | Added HSN, GST rate, and HSN status columns to admin product table. |
| [SIRABA_GST_HSN_CONFIGURATION_NOTE.md](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/SIRABA_GST_HSN_CONFIGURATION_NOTE.md) | Architectural documentation for Statutory Auditors and Chartered Accountants. |

---

## 15. Chartered Accountant (CA) Confirmation Items

The technical architecture is complete, but the following tax questions must be reviewed and signed off by the client's retained Chartered Accountant:
1. **Vendor Indemnification for Product HSN:** Confirmation that the marketplace agreement legally insulates Siraba from vendor misclassification under Section 122(1)(iv) CGST Act.
2. **Siraba Commission SAC:** Confirmation of SAC `998311` vs SAC `998599`.
3. **Shipping Charge GST Treatment:** Confirmation whether shipping is treated as composite supply adopting the 18% product GST rate or treated separately.
4. **TCS (Section 52 CGST Act):** Confirmation whether monthly payout statements require printed TCS lines.
5. **E-Invoicing Applicability:** Confirmation of turnover thresholds under Rule 48(4).

---

## 16. Known Limitations

1. **Vendor Self-Reporting:** The platform validates syntax (2 to 8 alphanumeric characters) but does not verify whether an HSN accurately matches the biological or chemical classification of the goods. This is by design, as the vendor owns legal responsibility.
2. **No Fallback Tolerated:** Products without HSN cannot generate tax invoices; vendor cooperation is strictly required before shipping orders for new products.

---

## 17. Final Verdict

```
============================================================
PHASE D TECHNICALLY VERIFIED — CA CONFIRMATION REQUIRED
============================================================
```
All technical, security, financial, and UI requirements have been implemented and validated against the live database and automated verification suites. Legal-tax confirmation remains pending CA sign-off.
