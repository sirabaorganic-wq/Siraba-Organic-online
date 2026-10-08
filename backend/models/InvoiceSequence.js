const mongoose = require("mongoose");

/**
 * Invoice Sequence Model
 * Provides atomic, concurrency-safe sequential counters for invoices by financial year and type.
 */
const invoiceSequenceSchema = mongoose.Schema(
  {
    // Unique identifier combining type and financial year, e.g., "CUSTOMER_TAX_INVOICE_26-27"
    _id: {
      type: String,
      required: true,
    },
    invoiceType: {
      type: String,
      required: true,
      index: true,
    },
    financialYear: {
      type: String,
      required: true,
      index: true,
    },
    sequence: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InvoiceSequence", invoiceSequenceSchema);
