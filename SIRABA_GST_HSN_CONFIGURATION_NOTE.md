# SIRABA ORGANIC — GST & HSN ARCHITECTURAL CONFIGURATION NOTE
**Document Version:** 1.0.0 (Phase D)  
**Date:** October 8, 2026  
**Target Audience:** Statutory Auditors, Chartered Accountants (CAs), Finance Directors, Engineering Stakeholders  

---

## 1. Executive Summary & Purpose

This configuration note details the technical implementation and legal-tax division of responsibility for **Siraba Organic (Phase D: Vendor HSN Management + Flat 18% GST Implementation)**.

Under the multi-vendor marketplace architecture governed by Section 79 of the Information Technology Act, 2000 and Section 9(5) / Section 52 of the Central Goods and Services Tax (CGST) Act, 2017:
1. **Vendors** are the independent sellers/suppliers of goods.
2. **Siraba Organic** operates strictly as the platform/marketplace facilitator (E-Commerce Operator).
3. The **Vendor** holds sole statutory responsibility for determining, providing, and maintaining the Harmonized System of Nomenclature (HSN) code for each listed product.
4. Per executive instruction from the client, a centralized **FLAT 18% GST RATE** has been enforced across all customer product transactions.
5. Siraba's marketplace facilitation commission is treated as an **independent B2B service transaction** and is strictly insulated from product tax configurations.

---

## 2. Product HSN Configuration

### 2.1 Statutory Division of Ownership
- **Statutory Responsibility:** **Vendor (Supplier of Goods)**.
- **Marketplace Role:** Platform facilitator. The platform does NOT classify goods, infer HSNs from categories, or assign default tax classifications.

### 2.2 Database Storage & Field Mapping
- **Primary Field:** `Product.hsnCode` (String, trimmed, alphanumeric, 2 to 8 characters).
- **Legacy Compatibility:** `Product.hsn` maintained in dual sync via Mongoose pre-save middleware.
- **Validation Gate:**
  - Product creation and editing mandate `hsnCode`.
  - Regex pattern: `/^[A-Za-z0-9]{2,8}$/`.
  - Missing or malformed HSN rejects product save with HTTP 400.
  - Zero runtime fallback: No default (such as `0909`, `N/A`, or empty string) is substituted.

### 2.3 Invoice Line Snapshot
- **Snapshot Location:** `Invoice.itemsSnapshot[].hsnCode` and `Invoice.itemsSnapshot[].hsn`.
- **Issuance Blocker Gate:**
  Before final customer tax invoice generation, the invoice engine verifies:
  ```javascript
  if (!item.hsnCode && !item.hsn) {
    const error = new Error('Product HSN code is required before a tax invoice can be issued.');
    error.statusCode = 400;
    throw error;
  }
  ```
  If any line item lacks an authentic HSN code, **invoice generation is strictly aborted**.
- **Historical Immutability:** Once an invoice is issued, the snapshot is permanent. Vendor edits to `Product.hsnCode` in the product master apply only to future orders; issued invoices remain immutable.

---

## 3. Customer Product Sale GST Architecture

### 3.1 Centralized Rate Configuration
Following client instruction, dynamic catalog GST rates (0%, 5%, 12%, 18%) for customer product sale flows are standardized to a centralized constant:
- **Location:** `backend/utils/gstEngine.js`
- **Constants:**
  ```javascript
  const CUSTOMER_PRODUCT_GST_RATE = 18; // Percentage
  const CUSTOMER_PRODUCT_GST_RATIO = 0.18; // Mathematical ratio
  ```
- **Rationale:** Prevents scattered `0.18` literals throughout the codebase. Allows future reconfiguration upon written Chartered Accountant determination without structural refactoring.

### 3.2 Place of Supply & Tax Distribution

| Supply Jurisdiction | Supplier State | Place of Supply | Statutory Tax Head | Effective Tax Rate |
| :--- | :--- | :--- | :--- | :--- |
| **Intra-State** | Vendor State (e.g., J&K - 01) | Customer State (e.g., J&K - 01) | **CGST + SGST** | **9% CGST + 9% SGST** (Total 18%) |
| **Inter-State** | Vendor State (e.g., J&K - 01) | Customer State (e.g., Karnataka - 29) | **IGST** | **18% IGST** |

### 3.3 Taxable Value & Discount Treatment
Per Section 15 of the CGST Act:
$$\text{Taxable Subtotal} = \text{Gross Product Subtotal} - \text{Approved Trade/Coupon Discount}$$
$$\text{Product GST (18\%)} = \text{Round}\Big(\text{Taxable Subtotal} \times 0.18\Big)$$

For Intra-State:
$$\text{CGST (9\%)} = \text{Round}\Big(\text{Taxable Subtotal} \times 0.09\Big)$$
$$\text{SGST (9\%)} = \text{Product GST} - \text{CGST}$$

For Inter-State:
$$\text{IGST (18\%)} = \text{Product GST}$$

Taxes are **never** calculated on pre-discount gross amounts when an approved discount has been apportioned to the item line.

---

## 4. Platform Commission Invoice Isolation

### 4.1 Transaction Boundary
| Attribute | Customer Product Tax Invoice | Siraba Commission Invoice |
| :--- | :--- | :--- |
| **Supplier (Seller)** | Vendor Partner (e.g., Pampore Gold) | Siraba Organic (Marketplace Facilitator) |
| **Recipient (Buyer)** | End Consumer | Vendor Partner |
| **Transaction Nature** | Sale of Goods | B2B Facilitation / Support Service |
| **Classification Scheme** | Product HSN (e.g., `091020`, `040900`) | Service Accounting Code (SAC) `998311` |
| **Statutory Tax Rate** | Flat 18% (Goods) | 18% (Marketplace Facilitation Service) |
| **Invoice Prefix** | `VND-[VENDOR_ID]/...` | `SO-COMM/...` |

### 4.2 SAC Classification Preservation
The platform commission invoice classifies commission charges under Services Accounting Code **`998311`** ("Other information technology services / web hosting / platform facilitation").
- **Critical Control:** This classification is stored as a service code and is **never** conflated with product HSNs.
- It does **not** inherit customer product tax configurations or discount subsidies.

---

## 5. Credit Note Architecture (Section 34 CGST Act)

When goods subject to the 18% GST regime are returned:
1. **Derivation of Base and Tax:**
   $$\text{Taxable Amount} = \text{Round}\left(\frac{\text{Gross Refund Amount}}{1 + 0.18}\right)$$
   $$\text{Tax Amount} = \text{Gross Refund Amount} - \text{Taxable Amount}$$
2. **Reconciliation:**
   $$\text{Taxable Subtotal} + \text{Tax Price} \equiv \text{Grand Total Refund}$$
3. **HSN & Linkage:**
   - Preserves original product `hsnCode` snapshot.
   - Preserves original supply jurisdiction (Inter-State IGST vs Intra-State CGST/SGST).
   - Authoritatively references original invoice ID and original invoice number.
   - Original invoice document remains completely immutable.

---

## 6. Outstanding Chartered Accountant (CA) Confirmations

The following tax and legal items require formal written review and sign-off by the client's retained Chartered Accountant:

1. **Product HSN Verification Responsibility:**
   - *Current Implementation:* System validates syntax (2 to 8 alphanumeric characters) and non-emptiness. Vendor holds sole legal responsibility.
   - *CA Action Required:* Confirm whether marketplace terms of service adequately indemnify Siraba from misclassification penalties under Section 122(1)(iv) of the CGST Act.

2. **Marketplace Commission SAC Code:**
   - *Current Implementation:* SAC `998311`.
   - *CA Action Required:* Confirm whether `998311` or `998599` ("Other support services") is the preferred SAC classification for platform commission invoices.

3. **Customer Shipping Fee Tax Treatment:**
   - *Current Implementation:* Customer shipping charge is captured and passed through without automatic addition of 18% tax.
   - *CA Action Required:* Clarify whether shipping should be treated as a composite supply (Section 8 CGST Act) adopting the principal product's 18% rate, or as an independent service transaction by the logistics partner.

4. **Tax Collected at Source (TCS) under Section 52:**
   - *Current Implementation:* E-commerce operator TCS (1% split as 0.5% CGST + 0.5% SGST or 1% IGST) is tracked at the platform ledger level but not printed on consumer tax invoices.
   - *CA Action Required:* Confirm whether monthly vendor payout statements must print TCS deduction lines.

5. **E-Invoicing Applicability (Rule 48(4)):**
   - *Current Implementation:* Standard compliant B2C/B2B tax invoice generation with QR code placeholder.
   - *CA Action Required:* Confirm whether Siraba or any onboarded vendors exceed the aggregate turnover threshold (currently ₹5 Crore) requiring mandatory IRN generation via the NIC e-Invoice Portal.

---

## 7. Configuration Summary Table

```
┌─────────────────────────────────┬───────────────────────────────────────────────┐
│ Parameter                       │ Current Configuration                         │
├─────────────────────────────────┼───────────────────────────────────────────────┤
│ Customer Product Sale GST Rate  │ Centralized Flat 18%                          │
│ Intra-State Product Tax Split   │ 9% CGST + 9% SGST                             │
│ Inter-State Product Tax Split   │ 18% IGST                                      │
│ Product HSN Field               │ Product.hsnCode (dual sync with Product.hsn)  │
│ HSN Source Authority            │ Vendor Partner (Mandatory input)              │
│ Missing HSN Policy              │ STRICT BLOCK (Throws HTTP 400; No 0909)       │
│ Invoice Snapshot Rule           │ Immutable copy into itemsSnapshot[].hsnCode   │
│ Commission Invoice Nature       │ B2B Service Invoice (SAC 998311, 18% GST)     │
│ Discount Tax Base               │ Post-discount taxable value (Sec 15)          │
│ Credit Note Ratio               │ Section 34 compliant 18% gross deconstruction │
└─────────────────────────────────┴───────────────────────────────────────────────┘
```
