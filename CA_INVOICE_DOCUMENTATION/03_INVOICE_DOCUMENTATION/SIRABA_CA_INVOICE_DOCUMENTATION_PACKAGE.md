# SIRABA ORGANIC — CA INVOICE & MARKETPLACE DOCUMENTATION PACKAGE

**Document Reference:** `SIRABA-CA-PKG-2026-V1`  
**Prepared For:** Statutory Auditor, Chartered Accountant (CA) & Legal Counsel  
**Repository:** `Siraba-Organic-online-forked`  
**Date of Technical Audit:** October 7, 2026  
**Operating Architecture:** Vendor-as-Seller Multi-Vendor Marketplace (Phase C Confirmed)  

---

## 1. BUSINESS MODEL & STATUTORY RELATIONSHIPS

The technical implementation of the Siraba Organic platform operates strictly under the **Vendor-as-Seller Marketplace Facilitator Model** (mandated under Section 79 of the Information Technology Act, 2000, and Section 9(5) / Section 52 of the Central Goods and Services Tax Act, 2017).

```
                            ┌────────────────────────────────────────┐
                            │            CUSTOMER (BUYER)            │
                            └────────────────────────────────────────┘
                                    ▲                        ▲
         Product Purchase & Supply  │                        │  Product Purchase & Supply
         Invoice: VND-VNDRA/...     │                        │  Invoice: VND-VNDRB/...
                                    │                        │
        ┌───────────────────────────────────┐        ┌───────────────────────────────────┐
        │      VENDOR A (SUPPLIER/SELLER)   │        │     VENDOR B (SUPPLIER/SELLER)    │
        │   GI Saffron / Spices (HSN 0910)  │        │     Raw Acacia Honey (HSN 0409)   │
        └───────────────────────────────────┘        └───────────────────────────────────┘
                 │            ▲                               ▲            │
     Settlement  │            │ Commission Service Invoice    │            │ Settlement
     Statement   │            │ (SAC 998311, 18% GST)         │            │ Statement
     VND-SETTLE  │            │ SO-COMM/...                   │            │ VND-SETTLE
                 ▼            │                               │            ▼
        ┌────────────────────────────────────────────────────────────────────────┐
        │                 SIRABA ORGANIC PRIVATE LIMITED                         │
        │       (Neutral Marketplace Facilitator & E-Commerce Platform Operator) │
        │               GSTIN: 01AABCS1429B1Z1 • Pampore, J&K                    │
        └────────────────────────────────────────────────────────────────────────┘
```

### Statutory Roles & Document Matrix

| Transaction Flow | Legal Seller / Supplier | Legal Buyer / Recipient | Statutory Nature | Implemented Document Type | Numbering Pattern |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Product Sale** | **Vendor Partner** (e.g., Noor Saffron Guild) | **Retail Customer** (e.g., Bashir Ahmad Dar) | Sale of physical organic goods | `CUSTOMER_TAX_INVOICE` | `[VENDOR-PREFIX]/[FY]/[000001]` |
| **Platform Service** | **Siraba Organic** | **Vendor Partner** | Marketplace facilitation service | `VENDOR_COMMISSION_INVOICE` | `SO-COMM/[FY]/[000001]` |
| **Product Return / Adjustment** | **Vendor Partner** | **Retail Customer** | Statutory credit adjustment (Sec 34 CGST) | `CREDIT_NOTE` | `CN/[FY]/[000001]` |
| **Payout & Settlement** | **Siraba Organic (Platform)** | **Vendor Partner** | Operational order payout reconciliation | `VENDOR_SETTLEMENT_STATEMENT` | `VND-SETTLE/[FY]/[000001]` |

---

## 2. MARKETPLACE AGREEMENTS

The repository maintains an authoritative, cryptographically verified legal framework for vendor onboarding and marketplace operation.

### 2.1 Primary Agreement: Master Vendor Marketplace Agreement
- **Registry Identifier:** `SIRABA_VMA_MASTER` (Configured in [`backend/config/legalTemplates.js:12-23`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/config/legalTemplates.js#L12-L23))
- **Template File on Disk:** [`backend/templates/agreements/master-vendor-agreement-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/agreements/master-vendor-agreement-template.html)
- **Active Version:** `1.0` (Active and Mandatory for all vendor onboarding)
- **Integrity Enforcement:** Dynamic SHA-256 byte hashing guarantees zero template drift (`templateHash` enforced in [`backend/services/agreementService.js:166`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/agreementService.js#L166)).
- **Parties:**
  1. *First Part:* **SIRABA ORGANIC PRIVATE LIMITED** (Marketplace Operator)
  2. *Second Part:* **The Registered Vendor** (Merchant / Supplier of Goods)
- **Core Commercial & Statutory Clauses:**
  - **Clause 2.2 (Facilitator Role):** Declares Siraba Organic operates as a marketplace platform and neutral facilitator under the Information Technology Act, 2000, and does not take title to the Vendor's products.
  - **Clause 2.3 (Product Title):** Vendor retains sole ownership and legal title to its products until customer delivery.
  - **Clause 3 (Quality & Compliance):** Vendor warrants valid FSSAI licences, authentic organic certifications (NPOP / India Organic, USDA, or EU Organic), batch traceability, and full compliance with Legal Metrology and Food Safety standards.
  - **Clause 4.1 (Platform Commission):** Siraba deducts the agreed platform commission (exclusive of applicable taxes) on the net merchandise sales value of each completed customer order.
  - **Clause 4.2 (Pricing & GST):** Maximum Retail Price (MRP) and Selling Price set by Vendor must be inclusive of all applicable GST, duties, and packaging.
  - **Clause 4.3 (Settlement Cycle):** Payouts disbursed within T+7 business days following closure of the customer return window.
  - **Clause 7 (Indemnification):** Vendor defends and indemnifies Siraba against product liability, consumer claims, regulatory penalties, and trademark infringement.
  - **Clause 9 (Governing Law):** Laws of the Republic of India; exclusive jurisdiction in New Delhi; arbitration under the Arbitration and Conciliation Act, 1996.

### 2.2 Secondary Agreement: Mutual Non-Disclosure & Confidentiality Agreement
- **Registry Identifier:** `SIRABA_MNDA_MASTER` ([`backend/config/legalTemplates.js:24-36`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/config/legalTemplates.js#L24-L36))
- **Template File on Disk:** [`backend/templates/agreements/mutual-nda-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/agreements/mutual-nda-template.html)
- **Active Version:** `1.0` (Mandated conditionally for enterprise vendors, custom formulations, and institutional accounts).
- **Purpose:** Protects proprietary formulations, organic farm-to-fork batch traceability data, wholesale pricing schedules, and farmer networks.
- **Term & Survival:** 2-year term; confidentiality survives for 3 years post-termination (trade secrets survive indefinitely).

---

## 3. INVOICE TYPE 1: CUSTOMER PRODUCT TAX INVOICE

### 3.1 Statutory Identification
- **Document Model:** `CUSTOMER_TAX_INVOICE` ([`backend/models/Invoice.js:19`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L19))
- **Statutory Purpose:** Tax Invoice under Section 31 of the CGST Act, 2017, for the B2C/B2B supply of organic goods.
- **Issuing Entity (Seller):** Relevant Vendor Partner (Vendor Legal Name, Trade Name, Registered Address, Vendor GSTIN, 2-digit State Code).
- **Recipient (Buyer):** Retail / Institutional Customer (Name, Delivery Address, Contact, Buyer GSTIN if claimed).
- **Facilitator Notation:** Prominently displays: `"Marketplace Facilitator: Siraba Organic"` / `"Platform Operator — Under Sec 79 IT Act"`.

### 3.2 Implemented Field Structure & Snapshot Schema

| Section / Group | Implemented Fields in PDF & Database | Source in Codebase |
| :--- | :--- | :--- |
| **Seller Identity** | `legalName`, `tradeName`, `address`, `city`, `state`, `stateCode`, `postalCode`, `gstin`, `email`, `phone` | `invoiceDoc.sellerSnapshot` ([`Invoice.js:72-89`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L72-L89)) |
| **Buyer Identity** | `customerName`, `customerAddress`, `customerCityState`, `customerCountry`, `customerPhone`, `buyerGST` | `invoiceDoc.buyerSnapshot` ([`Invoice.js:91-117`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L91-L117)) |
| **Supply Jurisdiction** | `placeOfSupply` (Destination State + State Code), `supplyType` (Intra-State vs. Inter-State) | `determineJurisdiction()` ([`gstEngine.js:145`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/gstEngine.js#L145)) |
| **Line Items** | `name`, `sku`, `hsn` (authentic catalog code, no fallback), `quantity`, `unitPrice`, `discount`, `taxableAmount`, `taxRate`, `lineTotal` | `invoiceDoc.itemsSnapshot` ([`Invoice.js:120-137`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L120-L137)) |
| **Taxes** | Intra-State: `Central GST (CGST @ X%)` + `State GST (SGST @ X%)`<br>Inter-State: `Integrated GST (IGST @ X%)` | `invoiceDoc.totalsSnapshot` ([`Invoice.js:198-200`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L198-L200)) |
| **Shipping** | `customerShippingCharge` (e.g. ₹50.00 or "Free" if `>= ₹999`) | `invoiceDoc.totalsSnapshot.shippingPrice` |
| **Totals Reconciliation**| `Gross Subtotal` − `Discount` = `Taxable Subtotal` + `GST` + `Shipping` = `Grand Total` | Mathematical balance enforced in [`gstEngine.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/gstEngine.js) |
| **Amount in Words** | Dynamic Indian numbering format (e.g. *"Nine Hundred and Ninety Five Rupees Only"*) | `numberToWordsINR()` ([`invoiceRoutes.js:26`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/invoiceRoutes.js#L26)) |
| **Signatory Block** | `"Authorized Signatory — For [Vendor Legal Name]"` | Template footer |

### 3.3 Visual Sample Location
- **Sample PDF:** [`CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/01_CUSTOMER_TAX_INVOICE.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/01_CUSTOMER_TAX_INVOICE.pdf)
- **Active HTML Template:** [`backend/templates/invoices/invoice-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/invoices/invoice-template.html)

---

## 4. INVOICE TYPE 2: SIRABA MARKETPLACE / COMMISSION INVOICE

### 4.1 Statutory Identification
- **Document Model:** `VENDOR_COMMISSION_INVOICE` ([`backend/models/Invoice.js:21`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L21))
- **Statutory Purpose:** B2B Tax Invoice for Services rendered by the marketplace operator to the seller under Section 31 of the CGST Act.
- **Issuing Entity (Seller/Provider):** **SIRABA ORGANIC PRIVATE LIMITED** (GSTIN: `01AABCS1429B1Z1`, Pampore, J&K).
- **Recipient (Buyer/Client):** Relevant Vendor Partner (Vendor Business Name, Registered Address, Vendor GSTIN).
- **Transaction Nature:** Platform facilitation fee / marketplace commission on orders completed through the portal.

### 4.2 Implemented Field Structure & Snapshot Schema

| Parameter | Implemented Specification | Code Location |
| :--- | :--- | :--- |
| **Document Number** | `SO-COMM/[YY-(YY+1)]/[000001]` (e.g. `SO-COMM/26-27/000001`) | [`invoiceNumberGenerator.js:68`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/invoiceNumberGenerator.js#L68) |
| **Service Description** | *"Marketplace Facilitation & Commission Services"* | [`invoiceService.js:777`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L777) |
| **Classification Code** | **SAC `998311`** (Services Accounting Code) | [`invoiceService.js:779`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L779) |
| **Commission Base** | Applicable percentage (e.g., 10%) on gross merchandise sales value | `vendorOrder.commission` ([`invoiceService.js:736`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L736)) |
| **Applicable Tax** | **18% GST** (Standard Rate for IT / Marketplace Intermediation) | [`invoiceService.js:771`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L771) |
| **Tax Split** | Intra-State (J&K Vendor): CGST 9% + SGST 9%<br>Inter-State: IGST 18% | [`invoiceService.js:774`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L774) |
| **Input Tax Credit** | Explicit notice: Vendor may claim Input Tax Credit (ITC) under Section 16 of CGST Act | Rendered invoice note |
| **Signatory Block** | `"Authorized Signatory — For SIRABA ORGANIC PRIVATE LIMITED"` | Footer |

### 4.3 Visual Sample Location
- **Sample PDF:** [`CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/02_SIRABA_COMMISSION_INVOICE.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/02_SIRABA_COMMISSION_INVOICE.pdf)

---

## 5. INVOICE TYPE 3: CREDIT NOTE

### 5.1 Statutory Identification
- **Document Model:** `CREDIT_NOTE` ([`backend/models/Invoice.js:22`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L22))
- **Statutory Purpose:** Statutory Credit Note issued under **Section 34(1) of the CGST Act, 2017**, in respect of returned goods, cancelled orders, or deficiency of supply.
- **Issuing Entity:** The original Vendor Partner (Supplier of Goods).
- **Recipient:** The Customer who returned the item or received a refund.
- **Mandatory Linkage:** Persists explicit link to `originalInvoice: ObjectId` ([`Invoice.js:165`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L165)) and displays original invoice number & date.

### 5.2 Architectural Principles & Implemented Fields

1. **Strict Immutability of Original Tax Invoice:**
   - The original `CUSTOMER_TAX_INVOICE` is **never updated in place or deleted**.
   - The original invoice preserves historical evidence of the transaction as issued.
2. **Sequential Credit Note Numbering:**
   - Numbered atomically as `CN/[YY-(YY+1)]/[000001]` (e.g. `CN/26-27/000001`).
3. **Data Fields Rendered:**
   - Original Tax Invoice Number & Issuance Date.
   - Specific refunded/returned line item details (name, quantity, HSN, unit price).
   - Reversal of Taxable Value.
   - Reversal of statutory tax components (CGST, SGST, or IGST).
   - Refund reference code (`creditNoteDetails.refundReference`).
   - Categorized reason for issuance (`creditNoteDetails.reason`).

### 5.3 Visual Sample Location
- **Sample PDF:** [`CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/03_CREDIT_NOTE.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/03_CREDIT_NOTE.pdf)

---

## 6. INVOICE TYPE 4: VENDOR SETTLEMENT STATEMENT

### 6.1 Statutory & Operational Identification
- **Document Model:** `VENDOR_SETTLEMENT_STATEMENT` ([`backend/models/Invoice.js:20`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L20))
- **Operational Purpose:** Operational accounting document detailing gross merchandise consignment, platform commission deduction, customer shipping allocation, and net merchant payout.
- **Issuing Entity:** Siraba Organic Platform Operator.
- **Recipient:** Vendor Partner.
- **Template on Disk:** [`backend/templates/invoices/vendor-invoice-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/invoices/vendor-invoice-template.html)
- **Active Route:** `GET /api/vendors/invoices/:orderId/preview` and `/download` ([`backend/routes/vendorInvoiceRoutes.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/vendorInvoiceRoutes.js))

### 6.2 Implemented Field Structure & Reconciliation

| Financial Row | Representation in Statement | Mathematical Meaning |
| :--- | :--- | :--- |
| **Gross Items Subtotal** | `₹900.00` | Total merchandise value of fulfilled vendor items |
| **Allocated GST Share** | `₹45.00` | Tax collected on items (retained by vendor for GST deposit) |
| **Customer Shipping Share** | `₹50.00` | Customer-paid shipping charge allocated to this sub-order |
| **Platform Commission** | `-₹90.00` (10%) | Commission deducted by Siraba in accordance with vendor plan |
| **NET VENDOR PAYOUT** | **`₹810.00`** | `Gross Subtotal (₹900.00) − Commission (₹90.00)` |
| **Logistics Tracking** | Carrier: `Shiprocket Express`, AWB: `SR-88491023` | Authoritative courier tracking metadata |

### 6.3 Visual Sample Location
- **Sample PDF:** [`CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/04_VENDOR_SETTLEMENT_STATEMENT.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/04_VENDOR_SETTLEMENT_STATEMENT.pdf)

---

## 7. SIRABA INVOICE HSN / SAC CLASSIFICATION AUDIT

The CA explicitly requested:
> *"SIRABA Invoice me HSN No. fill"*

The technical audit establishes the following findings:

### 7.1 Technical Finding Summary

| Item | Current Implementation Status |
| :--- | :--- |
| **Invoice Type** | Siraba Organic → Vendor (`VENDOR_COMMISSION_INVOICE`) |
| **Nature of Transaction** | B2B Marketplace Facilitation / E-Commerce Intermediation Service |
| **Current Classification Value** | **`998311`** |
| **Classification Type** | **SAC (Services Accounting Code)** — Heading 99 |
| **Configured GST Rate** | **18%** (Standard Indian Service GST Rate) |
| **Source Location in Codebase** | [`backend/services/invoiceService.js:779`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L779) |
| **Schema Storage Field** | `itemsSnapshot[].hsn` (Universal tariff code storage field in [`Invoice.js:125`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L125)) |
| **CA Confirmation Required?** | **YES** (Must confirm if `998311` is approved or if `998371` / `998599` is preferred) |

### 7.2 Why It Cannot Be an HSN
In Indian GST law:
- **HSN (Harmonized System of Nomenclature):** Applied strictly to **tangible goods** (Chapters 01 to 98).
- **SAC (Services Accounting Code):** Applied strictly to **services** (Heading 99).
- Because Siraba is providing a **digital marketplace facilitation service** to the vendor and not selling goods, entering a physical goods HSN code would violate Section 31 of the CGST Act.
- The 6-digit code `998311` represents **"Management consulting and management services / Other information technology services"**.

---

## 8. INVOICE NUMBERING ARCHITECTURE

Invoice numbering is implemented in [`backend/utils/invoiceNumberGenerator.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/invoiceNumberGenerator.js) using concurrency-safe atomic MongoDB `$inc` counters on `InvoiceSequence`:

### 8.1 Indian Fiscal Year Calculation
- Fiscal year spans **April 1 to March 31**.
- Dynamically evaluated via `getIndianFinancialYear()` as `YY-(YY+1)` (e.g. `26-27`).

### 8.2 Sequence Patterns by Document Type

| Document Type | Prefix Rule | Sequence Format | Example Invoice Number |
| :--- | :--- | :--- | :--- |
| `CUSTOMER_TAX_INVOICE` | `[VENDOR-PREFIX]` (Vendor Code or `VND-[Last 6 Hex of VendorId]`) | `[PREFIX]/[FY]/[000001]` | `VND-2F34D3/26-27/000001` |
| `CUSTOMER_TAX_INVOICE` *(Platform fallback)* | `SO` | `SO/[FY]/[000001]` | `SO/26-27/000001` |
| `VENDOR_COMMISSION_INVOICE` | `SO-COMM` | `SO-COMM/[FY]/[000001]` | `SO-COMM/26-27/000001` |
| `CREDIT_NOTE` | `CN` | `CN/[FY]/[000001]` | `CN/26-27/000001` |
| `VENDOR_SETTLEMENT_STATEMENT` | `VND-SETTLE` | `VND-SETTLE/[FY]/[000001]` | `VND-SETTLE/26-27/000001` |

### 8.3 Idempotency Guarantee
Calling invoice generation multiple times for an existing order or vendor order **does not advance the sequence counter**. The existing document is returned immediately without numbering drift.

---

## 9. GST TREATMENT & CALCULATION ENGINE

The authoritative GST Engine is implemented in [`backend/utils/gstEngine.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/gstEngine.js):

1. **State Normalization & 2-Digit GST Code Mapping:**
   - Normalizes state names (e.g. "J&K", "Jammu and Kashmir", "JK" → `01`; "Karnataka", "KA" → `29`).
2. **Jurisdiction Detection (`determineJurisdiction`):**
   - Compares Dispatch Origin State (Vendor State) against Place of Supply (Customer Delivery State).
   - **Intra-State:** Splits tax equally into `CGST (50%)` and `SGST (50%)`; `IGST = 0.00`.
   - **Inter-State:** Allocates 100% of tax to `IGST`; `CGST = 0.00`, `SGST = 0.00`.
3. **Rounding & Zero-Penny Drift:**
   - Calculates `cgst = Math.round((totalTax / 2) * 100) / 100`.
   - Calculates `sgst = Math.round((totalTax - cgst) * 100) / 100`.
   - Guarantees `cgst + sgst === totalTax` exactly without floating-point penny discrepancies.
4. **Section 15(3) Discount Apportionment:**
   - Platform coupon discounts are apportioned proportionally across line items before tax calculation:
     $$\text{Line Taxable Value} = \text{Line Subtotal} - \left(\frac{\text{Line Subtotal}}{\text{Order Subtotal}} \times \text{Discount}\right)$$
   - Tax is computed strictly on the post-discount taxable amount.

---

## 10. MULTI-VENDOR INVOICE FLOW & ISOLATION

When a customer places a basket order containing products from multiple vendors (e.g. Saffron from Vendor A and Honey from Vendor B):
1. **Database Splitting:** The single master `Order` creates independent child `VendorOrder` records for each vendor.
2. **Independent Document Generation:** Each `VendorOrder` generates a completely separate `CUSTOMER_TAX_INVOICE`.
3. **Strict Isolation Guarantees:**
   - Vendor A's invoice lists **only Vendor A's items**, Vendor A's GSTIN, and Vendor A's numbering sequence.
   - Vendor B's invoice lists **only Vendor B's items**, Vendor B's GSTIN, and Vendor B's numbering sequence.
   - Zero item leakage, zero tax leakage, and zero sequence collisions occur.
   - The customer can download each vendor tax invoice independently from their order history.

---

## 11. INVOICE ISSUANCE LIFECYCLE GATE

Implemented in [`backend/services/invoiceService.js:68-80`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L68-L80):
- Final Customer Tax Invoices **cannot be issued while an order is in `'pending'` vendor approval status**.
- Attempting to preview or download an invoice while pending throws `400 Bad Request`.
- This eliminates "sequence burn" and prevents issued invoices for orders that may subsequently be rejected by the merchant.
- Invoicing unlocks automatically once the merchant transitions the sub-order to `'confirmed'`, `'processing'`, or `'shipped'`.

---

## 12. CA DECISIONS & CONFIRMATIONS CHECKLIST

The following items are submitted for formal CA and client confirmation:

| # | Item for Confirmation | Current Implementation | Action Required by CA |
| :-: | :--- | :--- | :--- |
| **1** | **Siraba Commission Invoice SAC** | `998311` (18% GST) | **Confirm** whether SAC `998311` is approved or if an alternative SAC (e.g., `998371`, `998434`, or `998599`) is preferred. |
| **2** | **Invoice Table Header Label** | Column labeled "HSN/SAC" or "SAC CODE" | **Confirm** preferred column heading on Siraba's B2B commission invoices. |
| **3** | **Siraba Legal Entity Identifiers** | Registered: `SIRABA ORGANIC PRIVATE LIMITED`<br>GSTIN: `01AABCS1429B1Z1`<br>Address: Pampore, J&K - 192121 | **Confirm** Corporate Identification Number (CIN) and Permanent Account Number (PAN) to be printed on Siraba's invoice header. |
| **4** | **Platform Coupon Discount Policy** | Currently absorbed 100% by Siraba while vendor payout is based on catalog merchandise value | **Confirm** whether promotional discounts will remain platform-funded or if co-funded vendor promotions will be instituted. |
| **5** | **TCS Compliance (Section 52 CGST)** | Section 52 TCS mechanism implemented in system architecture | **Confirm** whether TCS at 1% (0.5% CGST + 0.5% SGST or 1% IGST) should appear as an explicit line deduction on the Vendor Settlement Statement or managed solely in monthly GST portal filing. |
| **6** | **Master Vendor Agreement Alignment** | Active version `1.0` confirms Facilitator Model (Sec 79 IT Act) | **Confirm** full alignment of executed agreements with statutory filing structure. |
