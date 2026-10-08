const mongoose = require("mongoose");

/**
 * Invoice Model
 * Represents an immutable, persistent financial and tax document issued for orders or vendor orders.
 */
const invoiceSchema = mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    invoiceType: {
      type: String,
      enum: [
        "CUSTOMER_TAX_INVOICE",
        "VENDOR_SETTLEMENT_STATEMENT",
        "VENDOR_COMMISSION_INVOICE",
        "CREDIT_NOTE",
      ],
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    vendorOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorOrder",
      default: null,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "paid", "cancelled", "refunded"],
      default: "issued",
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
      index: true,
    },
    sequenceNumber: {
      type: Number,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // ── Seller Snapshot (Immutable at issuance) ───────────────────────────
    sellerSnapshot: {
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
      legalName: { type: String, required: true },
      tradeName: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      stateCode: { type: String },
      postalCode: { type: String },
      country: { type: String, default: "India" },
      gstin: { type: String },
      pan: { type: String },
      email: { type: String },
      phone: { type: String },
      isMarketplaceFacilitator: { type: Boolean, default: false },
      facilitatorName: { type: String, default: "Siraba Organic" },
    },

    // ── Buyer Snapshot (Immutable at issuance) ────────────────────────────
    buyerSnapshot: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      gstin: { type: String },
      gstClaimed: { type: Boolean, default: false },
      billingAddress: {
        name: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        stateCode: { type: String },
        postalCode: { type: String },
        country: { type: String, default: "India" },
        phone: { type: String },
      },
      shippingAddress: {
        name: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        stateCode: { type: String },
        postalCode: { type: String },
        country: { type: String, default: "India" },
        phone: { type: String },
      },
    },

    // ── Line Items Snapshot (Immutable at issuance) ───────────────────────
    itemsSnapshot: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        sku: { type: String },
        hsnCode: { type: String },
        hsn: { type: String },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        lineTotal: { type: Number, required: true },
        taxRate: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxableAmount: { type: Number },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
      },
    ],

    // ── Pricing & Discount Snapshots ──────────────────────────────────────
    pricingSnapshot: {
      itemsSubtotal: { type: Number, required: true },
      grossAmount: { type: Number, required: true },
    },

    discountSnapshot: {
      couponCode: { type: String },
      discountAmount: { type: Number, default: 0 },
      discountedSubtotal: { type: Number, required: true },
    },

    // ── Tax Snapshot ──────────────────────────────────────────────────────
    taxSnapshot: {
      gstEnabled: { type: Boolean, default: true },
      gstPercentage: { type: Number, default: 18 },
      taxPrice: { type: Number, default: 0 },
      isInterState: { type: Boolean, default: false },
      supplierState: { type: String },
      customerState: { type: String },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
    },

    // ── Credit Note / Refund Reference ───────────────────────────────────
    originalInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    creditNoteDetails: {
      reason: { type: String },
      refundAmount: { type: Number },
      refundReference: { type: String },
      itemsRefunded: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          name: { type: String },
          quantity: { type: Number },
          amount: { type: Number },
        },
      ],
    },

    // ── Shipping Snapshot ─────────────────────────────────────────────────
    shippingSnapshot: {
      shippingPrice: { type: Number, default: 0 },
      isFreeShipping: { type: Boolean, default: false },
      carrier: { type: String },
      trackingNumber: { type: String },
    },

    // ── Totals & Financial Reconciliation Snapshot ────────────────────────
    totalsSnapshot: {
      subtotal: { type: Number, required: true },
      discountAmount: { type: Number, default: 0 },
      taxableSubtotal: { type: Number, required: true },
      taxPrice: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      shippingPrice: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
      commissionAmount: { type: Number, default: 0 },
      commissionRate: { type: Number, default: 0 },
      netPayoutAmount: { type: Number, default: 0 },
    },

    // ── PDF Metadata ──────────────────────────────────────────────────────
    pdfStatus: {
      type: String,
      enum: ["not_generated", "generated", "failed"],
      default: "generated",
    },
    pdfStorageReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound Indexes for Idempotency & Lookups ───────────────────────────
// Guarantees only one invoice of a given type exists per Order or VendorOrder
invoiceSchema.index(
  { invoiceType: 1, order: 1, vendorOrder: 1 },
  {
    unique: true,
    partialFilterExpression: { invoiceType: { $ne: "CREDIT_NOTE" } },
  }
);

// Rapid lookups by customer or vendor
invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ vendor: 1, createdAt: -1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ vendorOrder: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
