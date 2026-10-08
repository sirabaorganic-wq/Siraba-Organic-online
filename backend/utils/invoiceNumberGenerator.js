const InvoiceSequence = require("../models/InvoiceSequence");

/**
 * Compute the Indian Financial Year string (e.g., "26-27") for a given date.
 * Fiscal year in India starts on April 1 and ends on March 31.
 *
 * @param {Date} date
 * @returns {string} Financial Year code e.g. "26-27"
 */
function getIndianFinancialYear(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 2 = Mar, 3 = Apr, ... 11 = Dec

  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;

  const startYearShort = String(startYear).slice(-2);
  const endYearShort = String(endYear).slice(-2);

  return `${startYearShort}-${endYearShort}`;
}

/**
 * Generate the next sequential invoice number for a given invoice type, date, and optional vendor.
 * Uses atomic MongoDB $inc on InvoiceSequence to guarantee uniqueness and concurrency safety.
 *
 * For CUSTOMER_TAX_INVOICE:
 * If a vendor is provided, sequences are isolated per vendor per financial year,
 * formatted as: [VENDOR-PREFIX]/[FY]/[SEQUENCE] (e.g., VND-67478E/26-27/000001).
 *
 * @param {string} invoiceType e.g. 'CUSTOMER_TAX_INVOICE', 'VENDOR_SETTLEMENT_STATEMENT', 'VENDOR_COMMISSION_INVOICE'
 * @param {Date} [date=new Date()]
 * @param {object|string} [vendor=null] Optional vendor document, object, or vendor ID
 * @returns {Promise<{ invoiceNumber: string, financialYear: string, sequenceNumber: number }>}
 */
async function generateNextInvoiceNumber(invoiceType, date = new Date(), vendor = null) {
  const financialYear = getIndianFinancialYear(date);

  let vendorIdStr = null;
  let vendorPrefix = null;
  if (vendor) {
    const rawId = vendor._id ? vendor._id.toString() : String(vendor);
    vendorIdStr = rawId;
    if (vendor.vendorCode) {
      vendorPrefix = String(vendor.vendorCode).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    } else {
      vendorPrefix = `VND-${rawId.slice(-6).toUpperCase()}`;
    }
  }

  let sequenceKey;
  let prefix;

  if (invoiceType === "CUSTOMER_TAX_INVOICE" && vendorIdStr) {
    sequenceKey = `${invoiceType}_${vendorIdStr}_${financialYear}`;
    prefix = vendorPrefix;
  } else {
    sequenceKey = `${invoiceType}_${financialYear}`;
    switch (invoiceType) {
      case "CUSTOMER_TAX_INVOICE":
        prefix = "SO";
        break;
      case "VENDOR_SETTLEMENT_STATEMENT":
        prefix = "VND-SETTLE";
        break;
      case "VENDOR_COMMISSION_INVOICE":
        prefix = "SO-COMM";
        break;
      case "CREDIT_NOTE":
        prefix = "CN";
        break;
      default:
        prefix = "INV";
        break;
    }
  }

  const counter = await InvoiceSequence.findOneAndUpdate(
    { _id: sequenceKey },
    {
      $inc: { sequence: 1 },
      $setOnInsert: { invoiceType, financialYear },
    },
    { new: true, upsert: true }
  );

  const seqNumber = counter.sequence;
  const paddedSeq = String(seqNumber).padStart(6, "0");
  const invoiceNumber = `${prefix}/${financialYear}/${paddedSeq}`;

  return {
    invoiceNumber,
    financialYear,
    sequenceNumber: seqNumber,
  };
}

module.exports = {
  getIndianFinancialYear,
  generateNextInvoiceNumber,
};
