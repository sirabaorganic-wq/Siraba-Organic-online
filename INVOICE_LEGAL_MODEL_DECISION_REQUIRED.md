# SIRABA ORGANIC — INVOICE LEGAL & TAX MODEL DECISION DOCUMENT

**Document Status:** PENDING BUSINESS & TAX COUNSEL CONFIRMATION  
**Date:** October 3, 2026  
**Author:** Senior Backend Architect & Financial-Systems Engineer  
**Objective:** Document existing contradictory legal and technical patterns in the codebase and establish the necessary business decisions required before finalizing seller tax identity on customer invoices.

---

## 1. EXECUTIVE SUMMARY & CONFLICT IDENTIFICATION

Siraba Organic's repository currently contains two mutually conflicting operating models:

1. **The Legal Framework (`backend/templates/agreements/master-vendor-agreement-template.html`):**
   - Explicitly designates Siraba Organic as a **Marketplace Platform and Neutral Facilitator** under the Information Technology Act, 2000.
   - States: *"the Company ... does not take title to the Vendor's products unless expressly agreed in an authorized enterprise agreement."*
   - States: *"The Vendor retains sole ownership and title to its products until customer delivery."*
   - States: *"Prices must be inclusive of all applicable GST, duties, and packaging costs."*
   - **Conclusion from Legal Agreement:** The platform operates under **MODEL 1 (Marketplace / Facilitator)** where the Vendor is the legal supplier of goods to the consumer.

2. **The Checkout & Customer Invoice Implementation (`backend/routes/orderRoutes.js` & `backend/routes/invoiceRoutes.js`):**
   - The checkout calculates GST on the entire order subtotal and assigns `sellerGstNumber = admin_gst_number || null`.
   - The customer invoice endpoint (`GET /api/invoices/:orderId/download`) generates a single invoice with:
     - Seller Name: **"Siraba Organic"**
     - Seller Address: **"123 Saffron Valley, Pampore, Kashmir"**
     - Seller GSTIN: **Admin GSTIN (`gstSettings.admin_gst_number`)**
     - Line items: All items from all vendors combined on a single document.
   - **Conclusion from Code Implementation:** The platform operates under **MODEL 2 (Merchant of Record / Reseller)** where Siraba sells goods directly to the customer as principal.

Because of this direct contradiction, **technical remediation in Phase A must remain neutral to the legal model** by implementing persistent, snapshot-based infrastructure while formally requesting a business and accounting determination.

---

## 2. COMPARISON OF THE TWO MODELS

### MODEL 1: MARKETPLACE / FACILITATOR (Platform Model)

```text
Customer
   ▲
   │ Tax Invoice for Goods (Issued by Vendor A)
Vendor A ──(supplies goods)──> Customer

Customer
   ▲
   │ Tax Invoice for Goods (Issued by Vendor B)
Vendor B ──(supplies goods)──> Customer

Vendor A ──(Marketplace Commission Fee)──> Siraba Organic
   ▲
   │ Tax Invoice for Services (Issued by Siraba Organic, SAC 998371)
Siraba Organic
```

* **Legal Role:** Siraba Organic is an Electronic Commerce Operator (ECO) facilitating supplies between third-party sellers and consumers under Section 9(5) and Section 52 of the Central Goods and Services Tax (CGST) Act, 2017.
* **Customer Invoicing:**
  - For a multi-vendor order, the customer receives **distinct Tax Invoices per VendorOrder** (Vendor A Tax Invoice for Vendor A's items; Vendor B Tax Invoice for Vendor B's items).
  - Each invoice shows the respective Vendor's registered legal name, warehouse address, and Vendor GSTIN.
  - Siraba Organic's name appears only as the marketplace facilitator.
* **Platform Invoicing:**
  - Siraba Organic issues a B2B Tax Invoice to the Vendor for the **Platform Commission + 18% GST (SAC code 998311/998371)** and deducts Tax Collected at Source (TCS under Section 52) where applicable.
* **Tax Liability:** The Vendor reports and deposits the GST collected from the consumer on their GSTR-1 / GSTR-3B. Siraba deposits TCS and reports commission service GST.

---

### MODEL 2: MERCHANT OF RECORD / RESELLER (Buy-Sell Model)

```text
Vendor A ──(B2B Supply of Goods)──> Siraba Organic (Marketplace absorbs inventory/title)
Vendor B ──(B2B Supply of Goods)──> Siraba Organic

Siraba Organic ──(B2C/B2B Retail Sale)──> Customer (Single Consolidated Tax Invoice)
```

* **Legal Role:** Siraba Organic purchases goods from vendors (or operates a consignment agreement where title passes upon sale) and sells them directly to the consumer as the merchant of record.
* **Customer Invoicing:**
  - The customer receives **one single Tax Invoice from Siraba Organic** for the full order, regardless of how many vendors supplied the products.
  - The seller is Siraba Organic, using Siraba Organic's GSTIN.
* **Vendor Invoicing:**
  - The Vendor issues a B2B Tax Invoice to Siraba Organic for the products supplied at the wholesale/payout rate.
* **Tax Liability:** Siraba Organic is directly liable to collect and remit the full GST on the consumer price to the government, claiming Input Tax Credit (ITC) on the vendor's wholesale invoice.

---

## 3. IMPLICATIONS FOR INVOICE SEMANTICS & FIELDS

| Attribute / Field | Model 1 (Marketplace Facilitator) | Model 2 (Merchant of Record / Reseller) |
| ----------------- | --------------------------------- | --------------------------------------- |
| **Customer Order with 2 Vendors** | 2 distinct Tax Invoices (1 per VendorOrder) | 1 consolidated Tax Invoice for entire Order |
| **Customer Invoice Seller Name** | Vendor Legal Business Name | "Siraba Organic" |
| **Customer Invoice Seller GSTIN** | Vendor GSTIN | Siraba Admin GSTIN |
| **Customer Invoice Seller Address**| Vendor Registered Warehouse Address | Siraba Corporate Address (Pampore) |
| **Vendor Document in Portal** | Vendor Settlement / Payout Sheet (Subtotal, Commission, Net) + Platform Commission Invoice | Vendor Wholesale / Purchase Bill to Siraba |
| **Order Numbering Scope** | Per-Vendor Invoice Series (`VND-ABC/26-27/0001`) | Platform-wide Invoice Series (`SO/26-27/0001`) |
| **GST Return Reconciliation** | Vendor files GSTR-1 on product value; Siraba files GSTR-8 (TCS) | Siraba files GSTR-1 on full consumer retail price |

---

## 4. PHASE A ARCHITECTURAL RESOLUTION (MODEL-NEUTRAL DESIGN)

To avoid blocking technical progress while preserving complete flexibility for either decision, the Phase A architecture implements a **universal, model-agnostic schema**:

1. **Generic `Invoice` Model:**  
   The model links to both `order` and `vendorOrder` (optional) and supports explicit `invoiceType` enums:
   - `CUSTOMER_TAX_INVOICE`: Used for consumer goods. In Model 1, one is generated per `VendorOrder` (with Vendor as sellerSnapshot). In Model 2, one is generated per `Order` (with Siraba as sellerSnapshot).
   - `VENDOR_SETTLEMENT_STATEMENT`: Used for the vendor portal to show gross sales, commission deductions, shipping economics, and net payout.
   - `VENDOR_COMMISSION_INVOICE`: Reserved for platform fees billed by Siraba to the Vendor.
   - `CREDIT_NOTE`: Reserved for refunds and cancellations.
2. **Snapshot Immutability:**  
   The `sellerSnapshot`, `buyerSnapshot`, `itemsSnapshot`, and `totalsSnapshot` capture the exact legal entities determined at issuance time. Switching models or issuing vendor-specific invoices does not require changing database schemas.
3. **Frontend / API Separation:**  
   - Consumer downloads continue serving customer-facing tax invoices.
   - Vendor downloads serve the dedicated vendor statement/invoice via the newly implemented `vendor-invoice-template.html`.

---

## 5. REQUIRED BUSINESS & ACCOUNTING ACTIONS

Before transitioning to Phase B, the Siraba Organic executive team and statutory tax auditor must confirm:

1. **Contractual Alignment:** Should `backend/templates/agreements/master-vendor-agreement-template.html` (Section 2.2) remain as a Facilitator agreement, or is Siraba operating as a Merchant of Record?
2. **GST Filing Practice:** What GST return is Siraba currently filing for e-commerce sales? (GSTR-8 for TCS as an operator, or GSTR-1 for outward retail supplies as a seller?)
3. **Customer Invoicing Preference:** Does the management want customers buying from 2 vendors to download 2 separate vendor invoices, or 1 consolidated invoice under Siraba's brand?
