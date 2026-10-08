# SIRABA ORGANIC — VENDOR INVOICE & FINANCIAL GST REMEDIATION REPORT (PHASE B)

**Date**: 2026-10-03  
**Status**: COMPLETE  
**Primary Reviewer**: Senior Indian E-Commerce Financial-Systems Architect & GST-Aware Backend Engineer  
**Scope**: Product/Category-specific GST, Multi-vendor Tax & Shipping Allocation, Dual Jurisdiction (CGST+SGST vs IGST), Decimal Precision, Credit Note Architecture, Financial Reconciliation

---

## 1. LEGAL MODEL STATUS

```text
LEGAL MODEL STILL UNCONFIRMED
```

As detailed in `PHASE_B_LEGAL_MODEL_BLOCKER.md`, the platform faces an explicit divergence:
1. **Model 1 (Neutral Marketplace Facilitator)**: Mandated by Section 79 of the Information Technology Act and the executed Master Vendor Agreement. Vendors are sellers-of-record; Siraba issues separate commission service invoices to vendors with 18% GST under SAC 998311.
2. **Model 2 (Merchant of Record / Reseller)**: Historically reflected in legacy invoice generation where Siraba billed end consumers as the sole seller using its admin GSTIN.

**Remediation Rule Applied**: Neither model was arbitrarily selected or forced into production. The financial engine, tax calculation formulas, and data models have been architected in a strictly **model-neutral** manner, preserving supplier state and customer state independently, awaiting executive/accounting signoff.

---

## 2. FINANCIAL ARCHITECTURE

The end-to-end data flow operates through an immutable multi-tier pipeline:

```text
Order Placement (Checkout)
  │
  ├── 1. Product Catalog & Tax Classification Resolution (Product.gstRate, Product.hsn)
  │
  ├── 2. Dual Jurisdiction Determination (Supplier State vs Delivery Address State)
  │
  ├── 3. Line-Level Tax & Proportional Discount Snapshotting (Order.orderItems)
  │
  ├── 4. Vendor Isolation & Multi-Vendor Partitioning (VendorOrder.items & VendorOrder.taxBreakdown)
  │
  ├── 5. Payment Authorization & Settlement Isolation (Gross Subtotal vs Net Payout)
  │
  ├── 6. Persistent & Idempotent Invoice Snapshot Creation (Invoice model with sequence locking)
  │
  └── 7. Post-Issuance Adjustment / Cancellation (Immutable Original Invoice + Sequential CREDIT_NOTE)
```

### Data Traceability Matrix

| Financial Field | Data Origin | Calculation Mechanism | Storage Location | Snapshot Guarantee | Invoice Representation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Product Base Price** | `Product.price` / options | Variant-specific authoritative server lookup | `Product.price` | Snapshotted at order creation in `orderItems[].price` | `itemsSnapshot[].unitPrice` |
| **HSN Code** | `Product.hsn` | Catalog attribute (fallback to 0909) | `Product.hsn` | Snapshotted in `Order.orderItems[].hsn` | `itemsSnapshot[].hsn` |
| **GST Rate** | `Product.gstRate` / Settings | Evaluated: product override → category rate → global default | `Product.gstRate` | Snapshotted in `Order.orderItems[].taxRate` | `itemsSnapshot[].taxRate` |
| **Coupon Discount** | `Coupon.discount` / Checkout | Proportional allocation across line items: `(lineSubtotal / orderSubtotal) * discount` | `Order.discountAmount` | Allocated per line item in `orderItems[].discountAmount` | `discountSnapshot` & line `discountAmount` |
| **Taxable Amount** | Calculated | `Math.max(0, lineSubtotal - lineDiscount)` | `Order.orderItems[].taxableAmount` | Immutable per line | `itemsSnapshot[].taxableAmount` |
| **Tax Split (CGST/SGST/IGST)** | `gstEngine.js` | Intra-state: 50% CGST + 50% SGST<br>Inter-state: 100% IGST | `Order.taxBreakdown`<br>`VendorOrder.taxBreakdown` | Fully snapshotted in `taxBreakdown` | `taxSnapshot` (CGST/SGST/IGST amounts & rates) |
| **Vendor Commission** | `Vendor.commissionRate` | `(vendorSubtotal * commissionRate) / 100` | `VendorOrder.commission` | Stored in `commissionRateAtOrder` | `totalsSnapshot.commissionAmount` |
| **Vendor Net Payout** | Calculated | `vendorSubtotal - commission` | `VendorOrder.netAmount` | Pure item payout (Zero customer GST in payout) | `totalsSnapshot.netPayoutAmount` |
| **Credit Note / Refund** | Refund Controller / Service | Explicit sequential document `CN/{FY}/{000001}` | `Invoice` (`CREDIT_NOTE`) | References `originalInvoice` without mutation | Separate Credit Note Document |

---

## 3. GST ENGINE IMPLEMENTATION

The authoritative GST Engine is implemented in `backend/utils/gstEngine.js`:

1. **Product Tax Rate Resolution (`resolveProductTaxRate`)**:
   - Explicit `product.gstRate` or `product.taxRate` (supports 0%, 5%, 12%, 18%).
   - Category-based rate from `gstSettings.category_gst_rates`.
   - Global default from `gstSettings.default_gst_percentage` (18%).
2. **Jurisdiction Detection (`determineJurisdiction`)**:
   - Normalizes state names across common spelling variants, uppercase/lowercase, and abbreviations (e.g., "Jammu and Kashmir", "J&K", "JK").
   - Compares Supplier State against Customer Delivery Address State.
3. **Tax Allocation Rules**:
   - **Intra-State**: `cgstAmount = Math.round((totalTax / 2) * 100) / 100`, `sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100`. Guarantees `cgst + sgst === totalTax` without penny drift.
   - **Inter-State**: `igstAmount = totalTax`, `cgstAmount = 0`, `sgstAmount = 0`.
4. **Order-Level Tax Apportionment (`calculateOrderTaxBreakdown`)**:
   - Supports heterogeneous multi-rate baskets (e.g. 5% spice + 12% honey + 18% oil).
   - Proportional discount apportionment so taxable value per line is exact.

---

## 4. MULTI-VENDOR FINANCIAL RECONCILIATION

### Example: Multi-Vendor Order with Two Vendors

**Customer Order ORD-2026-9001**:
- Recipient: Customer in Bengaluru, Karnataka (Delivery State: `Karnataka`)
- Supplier State: Jammu and Kashmir (`Inter-State → IGST applies`)
- Discount Applied: ₹200 (Platform Coupon `SAVE200`)

```text
Vendor A (Organic Saffron Farm, J&K):
  └── Product A1 (Saffron 1g, HSN 0910, GST 5%): 2 units @ ₹500 = ₹1,000
      Proportional Discount: (1000 / 1600) * 200 = ₹125.00
      Taxable Amount: ₹875.00
      IGST @ 5%: ₹43.75
      Commission (10%): ₹100.00
      Vendor Net Payout: ₹1,000 - ₹100 = ₹900.00

Vendor B (Wild Forest Honey, J&K):
  └── Product B1 (Honey 500g, HSN 0409, GST 12%): 1 unit @ ₹600 = ₹600
      Proportional Discount: (600 / 1600) * 200 = ₹75.00
      Taxable Amount: ₹525.00
      IGST @ 12%: ₹63.00
      Commission (15%): ₹90.00
      Vendor Net Payout: ₹600 - ₹90 = ₹510.00
```

### Reconciliation Ledger

| Component | Parent Order | Vendor A Order | Vendor B Order | Reconciliation Check |
| :--- | :--- | :--- | :--- | :--- |
| **Gross Subtotal** | ₹1,600.00 | ₹1,000.00 | ₹600.00 | ₹1,000 + ₹600 = ₹1,600.00 (EXACT) |
| **Coupon Discount** | ₹200.00 | ₹125.00 | ₹75.00 | ₹125 + ₹75 = ₹200.00 (EXACT) |
| **Taxable Subtotal**| ₹1,400.00 | ₹875.00 | ₹525.00 | ₹875 + ₹525 = ₹1,400.00 (EXACT) |
| **IGST Tax** | ₹106.75 | ₹43.75 | ₹63.00 | ₹43.75 + ₹63.00 = ₹106.75 (EXACT) |
| **Customer Total** | ₹1,506.75 | N/A | N/A | Subtotal - Disc + Tax = ₹1,506.75 |
| **Platform Commission**| ₹190.00 | ₹100.00 | ₹90.00 | ₹100 + ₹90 = ₹190.00 (EXACT) |
| **Vendor Net Payout** | N/A | ₹900.00 | ₹510.00 | **100% Tax-Isolated** |

---

## 5. DISCOUNT ALLOCATION AUDIT

- **Current Implementation**: The platform absorbs 100% of coupon discounts.
- **Vendor Payout Preservation**: Vendor commission is deducted from gross catalog price (`subtotal - (subtotal * commissionRate)`). The customer's coupon does **not** diminish vendor payout.
- **Tax Law Compliance**: Taxable turnover for GST purposes is calculated on the actual price paid by the customer (`subtotal - discountAmount`), adhering strictly to GST Section 15(3).
- **Formal Record**: Detailed analysis and consequences filed in `PHASE_B_DISCOUNT_ALLOCATION_DECISION_REQUIRED.md`.

---

## 6. SHIPPING ALLOCATION AUDIT

- **Order-Level vs Vendor-Level**: Shipping charges to the customer are calculated via `shippingRoutes.js` with individual threshold evaluation (default ₹999 per vendor).
- **VendorOrder Snapshot**: Each `VendorOrder` records:
  - `shippingThresholdAtOrder` (e.g. ₹999)
  - `isFreeShippingEligible` (true/false)
  - `customerShippingCharge` (actual customer fee allocated)
  - `estimatedShippingCost` (courier logistics cost)
  - `shippingSubsidy` (difference absorbed by platform if free shipping)
- **Settlement Statement Isolation**: Customer shipping fee is never credited to the vendor as catalog merchandise value.

---

## 7. REFUND & CANCELLATION ARCHITECTURE

1. **Immutability of Original Invoices**: Issued `CUSTOMER_TAX_INVOICE` and `VENDOR_SETTLEMENT_STATEMENT` documents are **never** mutated, rewritten, or deleted when an order is cancelled or refunded.
2. **Credit Note Model (`CREDIT_NOTE`)**:
   - Generates sequential financial-year credit notes: `CN/26-27/000001`.
   - Records `originalInvoice` ObjectId foreign key.
   - Snapshots refund reason, refund amount, items refunded, and buyer/seller data.
   - Partial cancellation produces a partial Credit Note; remaining order items on the original transaction retain their original historical audit record.

---

## 8. INVOICE TYPES & TERMINOLOGY AUDIT

All ambiguity between customer tax invoices and vendor settlement statements has been eliminated:

| Document Type | Code Identifier | Prefix | Seller Entity | Recipient | Legal / Accounting Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Tax Invoice** | `CUSTOMER_TAX_INVOICE` | `SO/` | Siraba Organic / Vendor (per Model) | End Customer | GST Tax Invoice for consumer purchase |
| **Vendor Order Statement** | `VENDOR_SETTLEMENT_STATEMENT` | `VND-SETTLE/` | Vendor | Siraba Platform | Settlement voucher showing gross sales, commission, and net payout |
| **Vendor Commission Invoice** | `VENDOR_COMMISSION_INVOICE` | `SO-COMM/` | Siraba Organic (SAC 998311) | Vendor Partner | Marketplace facilitation service invoice with 18% GST (Model 1) |
| **Credit Note** | `CREDIT_NOTE` | `CN/` | Original Issuer | Original Recipient | Post-sale adjustment/cancellation under GST Section 34 |

---

## 9. TEST RESULTS & REGRESSION GATES

All test suites executed with 100% pass rates:

### 1. Invoice System Suite (`backend/tests/invoice_generation.test.js`)
- **Total Tests**: 27
- **Passed**: 27
- **Failed**: 0
- **Coverage**:
  - Invoice persistence & sequential numbering (`SO/26-27/000001`)
  - Vendor statement isolation & RBAC authorization
  - Financial arithmetic balance & settlement distinction
  - Idempotency & Indian FY calendar logic
  - Historical immutability under entity mutations
  - PDF template rendering & pure-JS fallback
  - Product-level GST rates (0%, 5%, 12%, 18%) & HSN preservation
  - Dual jurisdiction (Intra-state CGST/SGST vs Inter-state IGST)
  - Multi-vendor subtotal, tax, and net payout reconciliation
  - Credit Note generation & original invoice immutability
  - Exact decimal precision (₹100 @ 5%, ₹999 @ 5%, ₹1000 @ 18%)

### 2. Tax/GST Pricing Audit Suite (`backend/tests/tax_pricing_audit.test.js`)
- **Total Tests**: 37
- **Passed**: 37
- **Failed**: 0
- **Zero Checkout Regressions**: All 23 tax-exclusive pricing rules, coupon interactions, and payment gateway paise conversions remain completely intact.

### 3. Legal Agreements Foundation Suite (`backend/tests/legal_agreements.test.js`)
- **Total Tests**: 14
- **Passed**: 14
- **Failed**: 0
- **Coverage**: Cryptographic template hashing, legal snapshot minimization, preview generation, execution byte hashing, and Mongoose immutability.

---

## 10. REMAINING BUSINESS DECISIONS REQUIRED

The following items require formal signoff from Management, Tax Advisors, and Legal Counsel:

1. **Marketplace Model Signoff**: Formally execute the decision between Model 1 (IT Act neutral marketplace facilitator with separate commission invoices) and Model 2 (Merchant of record) as outlined in `PHASE_B_LEGAL_MODEL_BLOCKER.md`.
2. **Platform Coupon Funding Policy**: Formal confirmation whether the platform continues to absorb 100% of marketing discounts or if promotional co-funding agreements with vendors will be established (`PHASE_B_DISCOUNT_ALLOCATION_DECISION_REQUIRED.md`).
3. **TCS (Tax Collected at Source) Under GST Section 52**: Under Model 1, confirmation of whether Siraba Organic is registered for TCS deduction (1% net value of taxable supplies) on vendor monthly payouts.

---

# FINAL VERDICT

```text
PHASE B TECHNICAL REMEDIATION VERIFIED — LEGAL/ACCOUNTING DECISION REQUIRED
```
