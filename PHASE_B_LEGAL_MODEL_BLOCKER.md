# SIRABA ORGANIC — PHASE B LEGAL & TAX MODEL BLOCKER

**Document Status:** FORMAL BLOCKER FILED  
**Phase:** Phase B — Financial & GST Engine Remediation  
**Date:** October 3, 2026  
**Auditor & Architect:** Senior Indian E-Commerce Financial-Systems Architect  

---

## 1. NATURE OF THE BLOCKER

Siraba Organic cannot finalize customer-facing tax invoice generation or complete legal tax filing reconciliation until company management, legal counsel, and statutory tax auditors formally select between **Model 1 (Marketplace Facilitator)** and **Model 2 (Merchant of Record / Reseller)**.

In strict adherence to the project charter:
> *"DO NOT decide which model is legally correct yourself. If there is still no explicit business/accounting decision, create `PHASE_B_LEGAL_MODEL_BLOCKER.md` ... Then continue ONLY with model-neutral technical work. Do not silently change seller identity."*

This document outlines the evidence, technical consequences, required fields, and the exact decision needed.

---

## 2. COMPETING EVIDENCE DISCOVERED IN CODEBASE

### Evidence Supporting MODEL 1 (Marketplace Facilitator)
1. **Master Vendor Agreement (`backend/templates/agreements/master-vendor-agreement-template.html`):**
   - Section 2.2: Declares Siraba Organic as a *"marketplace platform and neutral facilitator under the Information Technology Act, 2000, and does not take title to the Vendor's products unless expressly agreed in an authorized enterprise agreement."*
   - Section 2.3: *"The Vendor retains sole ownership and title to its products until customer delivery."*
   - Section 4.2: *"The Vendor shall set the Maximum Retail Price (MRP) and Selling Price in compliance with Indian legal requirements. Prices must be inclusive of all applicable GST..."*
   - Section 5.3: Consignments must include authentic batch identifiers *"matching the compliance certificate and invoice."*
2. **Vendor Order Partitioning (`backend/models/VendorOrder.js`):**
   - Every consumer order is subdivided into vendor-specific `VendorOrder` records with independent shipping economics, commission rates, and fulfillment tracking via individual Shiprocket pickup locations.
3. **Vendor Notifications (`backend/utils/vendorEmailService.js`):**
   - Notifications explicitly identify the platform as *"Siraba Organic Multi-Vendor Marketplace"*.

### Evidence Supporting MODEL 2 (Merchant of Record / Reseller)
1. **Order Record GST Fields (`backend/routes/orderRoutes.js:186-191`):**
   - The main Order document records `sellerGstNumber = gstSettings.admin_gst_number` (Siraba's platform GSTIN) rather than the individual vendors' GSTINs.
2. **Legacy Customer Invoice (`backend/routes/invoiceRoutes.js`):**
   - Generates a single consolidated document listing **Siraba Organic** as the sole seller with Siraba's Pampore address and Siraba's Admin GSTIN, combining items from all vendors onto one bill.
3. **Settlement Logic (`backend/routes/vendorRoutes.js:2070-2100`):**
   - Payout to the vendor is strictly `subtotal - commission`. The GST collected from the customer (`vendorOrder.tax`) is not disbursed to the vendor, indicating the platform currently retains the tax liability.

---

## 3. TECHNICAL & OPERATIONAL CONSEQUENCES OF EACH MODEL

| Domain | Model 1: Marketplace Facilitator (ECO) | Model 2: Merchant of Record (Reseller) |
| ------ | --------------------------------------- | --------------------------------------- |
| **Customer Invoicing for 2-Vendor Order** | Customer receives **2 distinct Tax Invoices** (1 from Vendor A, 1 from Vendor B). | Customer receives **1 consolidated Tax Invoice** from Siraba Organic. |
| **Seller Identity on Tax Invoice** | Respective Vendor Legal Name, Warehouse Address, and Vendor GSTIN. | "Siraba Organic", Pampore Address, and Platform Admin GSTIN. |
| **Marketplace Fees Document** | Siraba issues a separate B2B Tax Invoice to each Vendor for **Platform Commission + 18% GST (SAC 998371)**. | Siraba records commission as gross trading margin (Gross Retail Price − Vendor Wholesale Cost). |
| **Vendor Document in Portal** | Vendor Settlement Sheet + Commission Invoices issued by Siraba. | Vendor B2B Tax Invoice / Purchase Bill billed to Siraba. |
| **Statutory Tax Return** | Siraba files **GSTR-8** (TCS under Section 52). Vendors file **GSTR-1 / GSTR-3B** on product values. | Siraba files **GSTR-1 / GSTR-3B** on full consumer retail turnover and claims ITC on vendor bills. |
| **Vendor Non-GST Sellers** | Vendors without GSTIN cannot make inter-state taxable supplies (Section 24(ix) CGST Act). | Siraba can procure from unregistered suppliers subject to composition/reverse charge rules. |

---

## 4. AFFECTED INVOICE TYPES & FIELDS

1. **`CUSTOMER_TAX_INVOICE`:**
   - *If Model 1:* Linked to `VendorOrder`. `sellerSnapshot` = Vendor.
   - *If Model 2:* Linked to `Order`. `sellerSnapshot` = Siraba Organic.
2. **`VENDOR_COMMISSION_INVOICE`:**
   - *If Model 1:* Required statutory document from Siraba to Vendor with SAC 998371.
   - *If Model 2:* Not applicable (margin-based accounting).
3. **`CREDIT_NOTE`:**
   - *If Model 1:* Issued by the Vendor to the Customer referencing the Vendor's original tax invoice.
   - *If Model 2:* Issued by Siraba Organic referencing Siraba's original tax invoice.

---

## 5. EXACT DECISION REQUIRED FROM MANAGEMENT & LEGAL

Company management, chartered accountants, and legal counsel must sign off on one of the following two directives:

> **DIRECTIVE A (Adopt Model 1 — Marketplace Facilitator):**  
> "Siraba Organic acts solely as an Electronic Commerce Operator under Section 52 CGST Act. The technical system shall generate separate tax invoices for each vendor order bearing the vendor's legal name and GSTIN, and shall generate platform commission invoices from Siraba to the vendor."

**OR**

> **DIRECTIVE B (Adopt Model 2 — Merchant of Record):**  
> "Siraba Organic purchases inventory on consignment from vendors and retails goods directly to consumers. The technical system shall generate a single tax invoice in Siraba's name for the full customer order, and shall treat vendor payouts as cost of goods sold (COGS)."

---

## 6. PHASE B MODEL-NEUTRAL EXECUTION BOUNDARY

While awaiting this executive decision, Phase B proceeds strictly with model-neutral foundational engineering:
1. Product-level tax classification (0%, 5%, 12%, 18%) and HSN codes.
2. Dual-jurisdiction tax engine (determining Intra-State CGST/SGST vs Inter-State IGST from any two states).
3. Order-time tax and HSN snapshotting into `Order.orderItems` and `VendorOrder.items`.
4. Discrete financial reconciliation engines for both customer totals and vendor settlements.
5. Credit note data model and refund isolation.
6. Absolute preservation of existing pricing calculations (`tax_pricing_audit.test.js`).
