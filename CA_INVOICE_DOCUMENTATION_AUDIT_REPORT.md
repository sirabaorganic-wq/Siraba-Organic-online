# SIRABA ORGANIC — CA INVOICE DOCUMENTATION AUDIT REPORT

**Date of Audit:** October 7, 2026  
**Auditor & Systems Engineer:** Senior E-Commerce Financial Systems Architect & Compliance Engineer  
**Objective:** Independent repository inspection, legal agreement identification, invoice type analysis, and HSN/SAC classification audit for Chartered Accountant (CA) review.  
**Operating Baseline:** Phase C Confirmed Vendor-as-Seller Multi-Vendor Architecture  
**Execution Mode:** Strictly Read-Only (Zero production code or business data modified)  

---

## 1. EXECUTIVE AUDIT SUMMARY

Pursuant to the request from the Chartered Accountant (CA) for:
1. **The Agreement**
2. **Format of 4 types of invoices, including Credit Note**
3. **HSN No. / classification to be filled in Siraba's own invoice**

A comprehensive, non-destructive audit of the entire Siraba Organic codebase, templates, database models, services, GST calculation engine, and test suites was conducted.

### Core Audit Findings:
1. **Marketplace Model Confirmed:**  
   The platform operates strictly as a **neutral marketplace facilitator** under Section 79 of the Information Technology Act, 2000, and Section 9(5) / Section 52 of the Central Goods and Services Tax Act, 2017. Vendors are the legal suppliers/sellers of physical organic goods; Siraba Organic is the platform operator.
2. **Authoritative Agreement Located:**  
   The active, approved vendor contract is the **Master Vendor Marketplace Agreement** (`SIRABA_VMA_MASTER`, version `1.0`, template: `backend/templates/agreements/master-vendor-agreement-template.html`). An accompanying **Mutual Non-Disclosure Agreement** (`SIRABA_MNDA_MASTER`, version `1.0`, template: `backend/templates/agreements/mutual-nda-template.html`) is enforced conditionally for enterprise accounts.
3. **Four Distinct Document Types Implemented:**  
   The database schema, service gateway, and numbering generator implement exactly four financial and tax document types:
   - **Type 1:** `CUSTOMER_TAX_INVOICE` (Customer Product Tax Invoice: Vendor → Customer)
   - **Type 2:** `VENDOR_COMMISSION_INVOICE` (Marketplace Facilitation Service Invoice: Siraba → Vendor)
   - **Type 3:** `CREDIT_NOTE` (Statutory Tax Adjustment: Vendor → Customer, linked to original invoice)
   - **Type 4:** `VENDOR_SETTLEMENT_STATEMENT` (Merchandise Payout Reconciliation: Platform → Vendor)
4. **HSN vs. SAC Audit on Siraba's Invoice:**  
   Siraba's invoice bills **marketplace facilitation services**, not tangible goods. Under Indian GST law, services are classified under **SAC (Services Accounting Code)** starting with `99`, while goods are classified under **HSN (Harmonized System of Nomenclature)**. The repository currently implements **SAC `998311`** at **18% GST** (configured in [`backend/services/invoiceService.js:779`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L779)).
5. **CA Package Generated:**  
   A self-contained, client/CA-ready documentation and artifact folder `CA_INVOICE_DOCUMENTATION/` was constructed, containing exact agreements, rendered PDF specimens for all four document types, detailed HSN/SAC notes, and comprehensive technical specifications.

---

## 2. FILES INSPECTED DURING AUDIT

The audit inspected all relevant financial, tax, database, and legal files across the repository:

### 2.1 Database Models
- [`backend/models/Invoice.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Invoice.js) — Mongoose model for immutable financial documents (`enum: ["CUSTOMER_TAX_INVOICE", "VENDOR_SETTLEMENT_STATEMENT", "VENDOR_COMMISSION_INVOICE", "CREDIT_NOTE"]`).
- [`backend/models/InvoiceSequence.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/InvoiceSequence.js) — Atomic sequence tracking collection.
- [`backend/models/LegalAgreement.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/LegalAgreement.js) — Persistent legal agreement execution records with SHA-256 byte hashing.
- [`backend/models/GSTSettings.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/GSTSettings.js) — Singleton platform GST configuration model.
- [`backend/models/Order.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Order.js) & [`backend/models/VendorOrder.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/VendorOrder.js) — Multi-vendor order partitioning.
- [`backend/models/Vendor.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Vendor.js) & [`backend/models/Product.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/models/Product.js) — Merchant legal profiles and product catalog attributes.

### 2.2 Core Logic & Services
- [`backend/services/invoiceService.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js) — Authoritative gateway for document snapshotting, lifecycle gating, commission invoicing, and credit notes.
- [`backend/services/agreementService.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/agreementService.js) — Agreement rendering, PDF generation, and cryptographic hashing.
- [`backend/utils/invoiceNumberGenerator.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/invoiceNumberGenerator.js) — Indian financial year calculation and vendor-isolated atomic sequencing.
- [`backend/utils/gstEngine.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/utils/gstEngine.js) — Supply jurisdiction logic, state normalization, 2-digit GST state codes, and zero-drift tax rounding.
- [`backend/config/legalTemplates.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/config/legalTemplates.js) — Legal template registry and SHA-256 file hashing.

### 2.3 HTTP Routes & Controllers
- [`backend/routes/invoiceRoutes.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/invoiceRoutes.js) — Customer tax invoice preview, download, and multi-vendor routes.
- [`backend/routes/vendorInvoiceRoutes.js`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/routes/vendorInvoiceRoutes.js) — Vendor statement routes and settlement summary.

### 2.4 Templates & Rendering Engines
- [`backend/templates/invoices/invoice-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/invoices/invoice-template.html) — Consumer tax invoice template.
- [`backend/templates/invoices/vendor-invoice-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/invoices/vendor-invoice-template.html) — Vendor settlement statement template.
- [`backend/templates/agreements/master-vendor-agreement-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/agreements/master-vendor-agreement-template.html) — Master vendor contract.
- [`backend/templates/agreements/mutual-nda-template.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/templates/agreements/mutual-nda-template.html) — Mutual NDA template.

### 2.5 Historical Audit & Remediation Reports
- `VENDOR_INVOICE_PHASE_A_REMEDIATION_REPORT.md`
- `VENDOR_INVOICE_PHASE_B_FINANCIAL_GST_REPORT.md`
- `VENDOR_INVOICE_PHASE_C_CONSUMER_TAX_INVOICE_REPORT.md`
- `INVOICE_LEGAL_MODEL_DECISION_REQUIRED.md`
- `PHASE_B_LEGAL_MODEL_BLOCKER.md`

---

## 3. AUDIT OF INVOICE & DOCUMENT TYPES

The repository explicitly defines four distinct document types. No document types were invented:

| Type | Model Enum | Legal Supplier | Legal Recipient | Statutory Role | Template / Engine |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `CUSTOMER_TAX_INVOICE` | Vendor Partner | Customer | Section 31 CGST Act Product Tax Invoice | `invoice-template.html` |
| **2** | `VENDOR_COMMISSION_INVOICE` | Siraba Organic | Vendor Partner | B2B Tax Invoice for Marketplace Service (SAC 998311, 18% GST) | Implemented in `invoiceService.js:714-859` |
| **3** | `CREDIT_NOTE` | Vendor Partner | Customer | Section 34 CGST Act Credit Adjustment linked to original invoice | Implemented in `invoiceService.js:874-960` |
| **4** | `VENDOR_SETTLEMENT_STATEMENT`| Siraba (Platform) | Vendor Partner | Order Settlement & Net Merchant Payout Statement | `vendor-invoice-template.html` |

---

## 4. AUDIT OF LEGAL AGREEMENTS

1. **Master Vendor Marketplace Agreement (`SIRABA_VMA_MASTER`):**
   - **Status:** ACTIVE & MANDATORY across all vendor onboarding.
   - **Version:** `1.0`.
   - **Facilitator Relationship:** Section 2.2 explicitly codifies that Siraba Organic is a marketplace platform and neutral facilitator under the IT Act, 2000. Title to products remains with the vendor until delivery to the customer.
   - **Pricing & Taxes:** Section 4.2 mandates that vendor listing prices are inclusive of all applicable GST.
   - **Commissions:** Section 4.1 establishes platform commission deductions on completed orders.
2. **Mutual Non-Disclosure Agreement (`SIRABA_MNDA_MASTER`):**
   - **Status:** ACTIVE & CONDITIONAL (mandated during onboarding for enterprise accounts and custom formulations).
   - **Version:** `1.0`.
   - **Term:** 2 years; confidentiality survives for 3 years post-termination.

---

## 5. AUDIT OF HSN / SAC ON SIRABA'S INVOICE

### Query Raised: "SIRABA Invoice me HSN No. fill"

### Audit Findings:
1. **Transaction Nature:**  
   Siraba's invoice bills **marketplace facilitation services (commission)** to vendors. It does **not bill physical goods**.
2. **Statutory Classification:**  
   Under Indian GST law, services are classified under **SAC (Services Accounting Code)** starting with `99`. Tangible goods are classified under **HSN (Harmonized System of Nomenclature)** under Chapters 01 to 98.
3. **Current Configured Value:**  
   The codebase specifies **SAC `998311`** (*"Other information technology services / facilitation"*) at **18% GST** in [`backend/services/invoiceService.js:779`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/backend/services/invoiceService.js#L779).
4. **Schema Storage:**  
   The field is stored in `itemsSnapshot[].hsn` (the generic schema property used for tariff codes).
5. **Statutory Recommendation:**  
   The invoice table column on Siraba's B2B commission invoice should be labeled **"SAC CODE"** (or **"HSN/SAC"**). The CA must confirm whether **`998311`** is approved or if an alternative code such as **`998371`** (Business support services) or **`998434`** (Electronic portal services) should be adopted.

---

## 6. GENERATED ARTIFACTS & SAMPLE PDFS

Using the verified Puppeteer rendering pipeline and strictly synthetic test data (no database mutations, no live emails, no third-party API calls), the following artifacts were generated:

### 6.1 In `CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/`
1. [`01_CUSTOMER_TAX_INVOICE.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/01_CUSTOMER_TAX_INVOICE.pdf) (435,598 bytes) — Intra-state customer product invoice with Vendor as seller, dynamic CGST+SGST, authentic HSN `09102010`, and Siraba as facilitator.
2. [`02_SIRABA_COMMISSION_INVOICE.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/02_SIRABA_COMMISSION_INVOICE.pdf) (483,970 bytes) — Siraba Organic B2B invoice billing 10% commission on ₹900 order = ₹90 taxable value + 18% GST under SAC `998311`.
3. [`03_CREDIT_NOTE.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/03_CREDIT_NOTE.pdf) (491,776 bytes) — Section 34 CGST Act Credit Note linked to original invoice `VND-2F34D3/26-27/000001`, with reason, tax reversal, and immutable audit guarantees.
4. [`04_VENDOR_SETTLEMENT_STATEMENT.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS/04_VENDOR_SETTLEMENT_STATEMENT.pdf) (400,373 bytes) — Vendor order settlement statement displaying Gross Subtotal, Commission deduction, Net Payout, and Shiprocket courier tracking.

*(Mirrored in [`docs/ca-invoice-package/`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/docs/ca-invoice-package/) as requested).*

### 6.2 In `CA_INVOICE_DOCUMENTATION/01_AGREEMENT/`
1. [`01_MASTER_VENDOR_MARKETPLACE_AGREEMENT.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/01_AGREEMENT/01_MASTER_VENDOR_MARKETPLACE_AGREEMENT.pdf) (386,521 bytes) — Rendered legal PDF of Master Vendor Agreement.
2. [`02_MUTUAL_NDA_AGREEMENT.pdf`](file:///c:/Users/hp/OneDrive/Documents/Desktop/forked-siraba/Siraba-Organic-online-forked/CA_INVOICE_DOCUMENTATION/01_AGREEMENT/02_MUTUAL_NDA_AGREEMENT.pdf) (334,707 bytes) — Rendered legal PDF of Mutual NDA.
3. Raw Handlebars template source files (`master-vendor-agreement-template.html` & `mutual-nda-template.html`).

---

## 7. TECHNICAL OBSERVATIONS & GAPS (NOT MODIFIED IN THIS TASK)

In strict compliance with **Step 9 (Do Not Make Production Code Changes)**, the following technical observations were recorded without altering production code:

1. **TECHNICAL OBSERVATION 1 — Dedicated Template Files for Types 2 & 3:**  
   - Currently, `CUSTOMER_TAX_INVOICE` and `VENDOR_SETTLEMENT_STATEMENT` possess dedicated HTML files on disk (`invoice-template.html` and `vendor-invoice-template.html`).  
   - `VENDOR_COMMISSION_INVOICE` and `CREDIT_NOTE` are fully implemented in the database model (`Invoice.js`), service layer (`invoiceService.js`), and sequence generator (`invoiceNumberGenerator.js`), but dedicated standalone production template files (`commission-invoice-template.html` and `credit-note-template.html`) are pending formal approval of visual layouts by the CA/client.  
   - *Status:* Sample visual PDFs were successfully generated for CA review.
2. **TECHNICAL OBSERVATION 2 — Siraba Corporate Identifiers:**  
   - `GSTSettings` model stores `admin_gst_number` (`01AABCS1429B1Z1`) and `company_name` (`Siraba Organic`).  
   - Permanent Account Number (PAN) and Corporate Identification Number (CIN) for Siraba Organic are not yet defined as explicit fields in `GSTSettings`.
3. **TECHNICAL OBSERVATION 3 — TCS Presentation:**  
   - Section 52 Tax Collected at Source (TCS at 1% for e-commerce operators) is handled in the accounting/settlement model, but does not currently display as a distinct line-item row on the Vendor Settlement Statement HTML template.

---

## 8. ITEMS THAT MUST NOT BE CHANGED UNTIL CA CONFIRMATION

The following technical components are locked and must **NOT** be altered until the CA provides formal written confirmation:

1. **DO NOT change SAC `998311`** to a physical goods HSN code or an alternate SAC until the CA explicitly selects the final classification.
2. **DO NOT change the 18% GST rate** on Siraba's commission invoices.
3. **DO NOT change the Vendor-as-Seller model** in `invoice-template.html` (reverting to Siraba as seller would violate Section 79 IT Act and the Master Vendor Agreement).
4. **DO NOT modify the invoice numbering patterns** (`VND-...`, `SO-COMM/...`, `CN/...`, `VND-SETTLE/...`) without accounting approval.
5. **DO NOT disable the invoice issuance lifecycle gate** blocking finalized invoices on pending vendor orders.

---

## 9. HARD STOP & STATUTORY DISCLAIMER

> [!CAUTION]
> **COMPLIANCE & STATUTORY DISCLAIMER:**  
> This documentation package represents an accurate technical extraction of the currently implemented Siraba Organic platform and database architecture. In accordance with professional engineering ethics and task directives, this report makes **no unilateral legal or accounting claim of "CA Compliant" or "Statutorily Final"**. Formal legal and GST compliance is subject to final review, signoff, and confirmation by the client's appointed Chartered Accountant and legal advisors.
