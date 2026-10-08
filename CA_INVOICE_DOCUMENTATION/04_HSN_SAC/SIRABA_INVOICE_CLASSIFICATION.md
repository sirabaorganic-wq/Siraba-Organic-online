# SIRABA ORGANIC — SIRABA INVOICE CLASSIFICATION AUDIT NOTE (HSN vs. SAC)
**Document Ref:** `SIRABA-FIN-AUDIT-2026-SAC`  
**Target Audience:** Chartered Accountant (CA) & Legal Counsel  
**Subject:** Clarification on "HSN No. to be filled in Siraba's Own Invoice"  
**Date of Audit:** October 7, 2026  
**Status:** IMPLEMENTED AS SAC 998311 (18% GST) — CA CONFIRMATION REQUIRED  

---

## 1. EXECUTIVE SUMMARY & STATUTORY DISTINCTION

When reviewing Siraba Organic's billing structure, the CA raised the following query:
> *"SIRABA Invoice me HSN No. fill"* *(Fill HSN Number in Siraba's invoice)*

Following a full technical audit of the codebase, database schemas, and GST engine, the following statutory distinction must be understood:

1. **Siraba's Own Invoice is a B2B Service Invoice, NOT a Goods Invoice**:
   - Under the confirmed Vendor-as-Seller marketplace architecture (IT Act 2000 Section 79; CGST Act Section 9(5) / Section 52), **Vendors are the suppliers of physical goods** (e.g. Saffron, Honey, Spices).
   - Customer-facing product tax invoices carry authentic **HSN (Harmonized System of Nomenclature)** codes (e.g. HSN `09102010` for Saffron, HSN `04090000` for Honey).
   - **Siraba Organic does not sell products to vendors.** Siraba bills vendors for **Marketplace Facilitation & Platform Commission Services**.

2. **Services Require SAC (Services Accounting Code), NOT HSN**:
   - In Indian GST law, physical goods are classified under **HSN codes (Chapters 01 to 98)**.
   - All services in India are classified under **SAC codes (Heading 99)**.
   - Therefore, a physical goods HSN code **cannot statutorily be applied** to Siraba's commission invoice. Instead, Siraba's invoice must bear an appropriate **SAC (Services Accounting Code)** starting with `99`.

---

## 2. CURRENT CODEBASE IMPLEMENTATION MATRIX

The dedicated audit traced every reference to commission billing, service codes, and classifications in the repository:

| Attribute | Implemented Value | Repository Source / File Location | Statutory Meaning |
| :--- | :--- | :--- | :--- |
| **Invoice Type** | `VENDOR_COMMISSION_INVOICE` | [`backend/models/Invoice.js:21`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js#L21) | B2B Tax Invoice for Services issued by Siraba to Vendor |
| **Billing Entity (Seller/Provider)** | SIRABA ORGANIC PRIVATE LIMITED | [`backend/services/invoiceService.js:743`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L743) | Platform operator / service provider |
| **Provider GSTIN** | `01AABCS1429B1Z1` (J&K) | [`backend/models/GSTSettings.js:26`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/GSTSettings.js#L26) | Admin GST number configured in singleton model |
| **Service Recipient (Buyer)** | Registered Vendor Partner | [`backend/services/invoiceService.js:759`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L759) | Billed to vendor's legal entity & GSTIN |
| **Service Description** | Marketplace Facilitation & Commission Services | [`backend/services/invoiceService.js:777`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L777) | Platform fee on gross sales |
| **Current Classification** | **`998311`** | [`backend/services/invoiceService.js:779`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L779) | Populated in line item code field |
| **Classification Type** | **SAC (Services Accounting Code)** | Explicit code comment: `// SAC for other information technology services / facilitation` | Service Heading 99 |
| **GST Rate Applied** | **18%** | [`backend/services/invoiceService.js:771`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L771) | Standard Indian service GST rate |
| **Jurisdiction Split** | Dynamic CGST (9%) + SGST (9%) or IGST (18%) | [`backend/services/invoiceService.js:770`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L770) | Evaluated via `determineJurisdiction` (J&K vs Vendor state) |
| **Numbering Format** | `SO-COMM/[YY-(YY+1)]/[000001]` | [`backend/utils/invoiceNumberGenerator.js:68`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/invoiceNumberGenerator.js#L68) | e.g. `SO-COMM/26-27/000001` |

---

## 3. WHY 998311 IS STORED IN THE `hsn` SCHEMA FIELD

In `backend/models/Invoice.js`, the schema defines an array of line items:
```javascript
itemsSnapshot: [
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    sku: { type: String },
    hsn: { type: String },  // <--- Shared classification storage field
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    ...
  }
]
```

**Technical Explanation:**  
- The schema field `hsn` serves as the universal tariff/classification code storage property across all document types.
- For `CUSTOMER_TAX_INVOICE`, this field stores the product's 4, 6, or 8-digit **HSN** code (e.g. `09102010`).
- For `VENDOR_COMMISSION_INVOICE`, this field stores the 6-digit **SAC** code (`998311`).
- The code does NOT treat `998311` as an HSN; as explicitly documented in `invoiceService.js:779`, it represents the **SAC for Information Technology / Platform Facilitation Services**.

---

## 4. STATUTORY SAC OPTIONS FOR E-COMMERCE MARKETPLACE FACILITATOR

Under the Indian GST Tariff Classification for Services (Heading 99), several SAC candidates exist for e-commerce operators billing commissions:

| SAC Code | Official GST Description | Industry Standard Usage | Current Repo Status |
| :---: | :--- | :--- | :---: |
| **`998311`** | **Management consulting and management services / Other information technology services** | Commonly adopted by IT platforms facilitating digital transactions. | **CURRENTLY CONFIGURED IN CODE** |
| **`998371`** | **Market research and public opinion polling / Business support services** | Referenced in earlier design documents (`INVOICE_LEGAL_MODEL_DECISION_REQUIRED.md:61`). | Alternative candidate |
| **`998434`** | **Electronic portal services / Web search portal services** | Specific to portals providing digital directory and merchant intermediation. | Alternative candidate |
| **`998599`** | **Other business support services n.e.c.** | Broad fallback used by aggregators and commercial facilitators. | Alternative candidate |
| **`996111` / `996211`** | **Services of commission agents / Wholesale trade services on a fee or contract basis** | Traditional physical commission agents (generally less preferred for tech platforms). | Alternative candidate |

---

## 5. CA CONFIRMATION / DECISION REQUIRED

> [!IMPORTANT]
> **CA ACTION REQUIRED:**
> 1. **Confirm Preferred SAC Code:** Please confirm whether Siraba Organic should continue utilizing **SAC `998311`** (Other information technology & platform facilitation services) on its commission invoices, or if your firm advises updating to **SAC `998371`**, **`998434`**, or **`998599`**.
> 2. **Confirm Display Label:** Please confirm that the invoice table column header for Siraba's commission invoice should display **"SAC CODE"** (or **"HSN/SAC"**) rather than "HSN" alone, ensuring statutory precision under the GST Act.
> 3. **Tax Rate:** 18% GST (CGST 9% + SGST 9% for intra-state J&K; IGST 18% for inter-state) is currently configured and active. Please confirm alignment.
