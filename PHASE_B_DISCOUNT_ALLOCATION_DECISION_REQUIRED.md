# SIRABA ORGANIC — PHASE B DISCOUNT ALLOCATION DECISION DOCUMENT

**Document Status:** FORMAL BUSINESS DECISION REQUIRED  
**Phase:** Phase B — Financial & GST Engine Remediation  
**Date:** October 3, 2026  
**Auditor & Architect:** Senior Indian E-Commerce Financial-Systems Architect  

---

## 1. BACKGROUND & EXISTING IMPLEMENTATION AUDIT

During checkout (`backend/routes/orderRoutes.js:137-147` and `280-335`), when a customer applies a coupon code (e.g., `SAVE200` for ₹200 off):
1. **At the Customer Order Level:**
   - `verifiedItemsPrice = SUM(catalog items) = ₹1,600`
   - `verifiedDiscountAmount = ₹200`
   - `discountedSubtotal = ₹1,400`
   - `verifiedTaxPrice = 18% of ₹1,400 = ₹252`
   - `verifiedTotalPrice = ₹1,400 + ₹252 + ₹0 = ₹1,652`
   *(Customer pays ₹1,652 instead of ₹1,888).*

2. **At the VendorOrder Level:**
   - In `orderRoutes.js:296`, `vendorData.subtotal` is computed as `item.price * item.quantity` (gross item catalog price, unreduced by the coupon).
   - In `orderRoutes.js:308-309`:
     - `commission = (vendorData.subtotal * commissionRate) / 100`
     - `netAmount = vendorData.subtotal - commission`
   - For Vendor A with ₹1,000 subtotal @ 10% commission:
     - `commission = ₹100`
     - `netAmount = ₹900`
   - For Vendor B with ₹600 subtotal @ 15% commission:
     - `commission = ₹90`
     - `netAmount = ₹510`
   - Sum of Vendor Net Payouts = ₹900 + ₹510 = **₹1,410**.
   - Total Platform Commission = ₹100 + ₹90 = **₹190**.
   - Notice: ₹1,410 (payouts) + ₹252 (tax) = ₹1,662. But customer paid ₹1,652.
   - The platform commission earned is reduced by the ₹200 discount absorbed!

3. **Current Operating Finding:**
   - The code currently implements **Platform-Absorbed Promotional Discounts**.
   - Vendors receive payouts based on full gross selling prices without discount deductions.
   - The platform funds the entire consumer coupon discount out of its platform commission and margin.

---

## 2. THE THREE COMMERCIAL DISCOUNT ALLOCATION MODELS

### MODEL A: PLATFORM-SUBSIDIZED DISCOUNT (Current Code Behavior)
* **Mechanism:** The marketplace funds 100% of the coupon. Vendor payouts are unaffected.
* **Vendor Order Subtotal:** Gross catalog value (₹1,000).
* **Vendor Commission:** Calculated on gross (₹100).
* **Vendor Payout:** ₹900.
* **Financial Risk:** If coupon discount exceeds total platform commission, the marketplace incurs a negative margin on the order.

### MODEL B: VENDOR-FUNDED PROMOTIONAL DISCOUNT
* **Mechanism:** The vendor bears the discount on their products.
* **Vendor Order Subtotal:** Discounted value (e.g. ₹1,000 − ₹125 = ₹875).
* **Vendor Commission:** Calculated on discounted value (10% of ₹875 = ₹87.50).
* **Vendor Payout:** ₹787.50.
* **Legal/Contractual Requirement:** Requires explicit vendor consent in Master Vendor Agreement or merchant promotional participation toggle.

### MODEL C: PROPORTIONALLY SHARED DISCOUNT
* **Mechanism:** Discount is split between platform commission reduction and vendor price reduction.
* **Calculation:** Requires custom promotional campaign terms.

---

## 3. PHASE B EXECUTION SAFETY RULE

In strict compliance with the instruction:
> *"Until confirmed, do not arbitrarily change vendor payouts or customer payable amounts."*

* Phase B **preserves Model A** as the baseline calculation so that existing vendor wallet and payout balances are never altered unexpectedly.
* Phase B **enhances data capture** so that every line item and VendorOrder records both:
  - `grossSubtotal`
  - `allocatedDiscount`
  - `discountedSubtotal`
  - `discountFundedBy` (`PLATFORM` by default)
* Once management confirms commercial policy, adjusting allocation between platform and vendor requires only updating the funding policy flag, without altering database schemas.
