/**
 * ============================================================================
 * SIRABA ORGANIC — GST & TAX CALCULATION ENGINE
 * File: backend/utils/gstEngine.js
 * ============================================================================
 *
 * Implements authoritative Indian GST rules:
 * 1. Product/Category rate resolution (0%, 5%, 12%, 18%, 28%)
 * 2. Supply Jurisdiction: Intra-State (CGST + SGST) vs Inter-State (IGST)
 * 3. Exact line-item calculation and decimal precision without floating-point drift
 * 4. Symmetric discount allocation and statutory tax reconciliation
 */

'use strict';

/**
 * Standardize Indian state names for comparison.
 * Handles common abbreviations and spelling variations.
 */
function normalizeState(state) {
  if (!state || typeof state !== 'string') return '';
  const s = state.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, '');
  
  const stateMap = {
    'jk': 'jammu and kashmir',
    'j and k': 'jammu and kashmir',
    'jammu and kashmir': 'jammu and kashmir',
    'kashmir': 'jammu and kashmir',
    'dl': 'delhi',
    'nct of delhi': 'delhi',
    'delhi': 'delhi',
    'ka': 'karnataka',
    'karnataka': 'karnataka',
    'mh': 'maharashtra',
    'maharashtra': 'maharashtra',
    'tn': 'tamil nadu',
    'tamil nadu': 'tamil nadu',
    'up': 'uttar pradesh',
    'uttar pradesh': 'uttar pradesh',
    'wb': 'west bengal',
    'west bengal': 'west bengal',
    'pb': 'punjab',
    'punjab': 'punjab',
    'hr': 'haryana',
    'haryana': 'haryana',
    'hp': 'himachal pradesh',
    'himachal pradesh': 'himachal pradesh',
    'uk': 'uttarakhand',
    'uttarakhand': 'uttarakhand',
    'rj': 'rajasthan',
    'rajasthan': 'rajasthan',
    'gj': 'gujarat',
    'gujarat': 'gujarat',
    'mp': 'madhya pradesh',
    'madhya pradesh': 'madhya pradesh',
    'ap': 'andhra pradesh',
    'andhra pradesh': 'andhra pradesh',
    'ts': 'telangana',
    'tg': 'telangana',
    'telangana': 'telangana',
    'kl': 'kerala',
    'kerala': 'kerala',
    'or': 'odisha',
    'odisha': 'odisha',
    'orissa': 'odisha',
    'br': 'bihar',
    'bihar': 'bihar',
    'as': 'assam',
    'assam': 'assam',
    'ga': 'goa',
    'goa': 'goa',
  };

  return stateMap[s] || s;
}

/**
 * Get 2-digit Indian GST State Code from state name or code.
 *
 * @param {string} state State name or abbreviation
 * @returns {string} 2-digit state code (e.g. '01', '07', '29') or empty string
 */
function getStateCode(state) {
  if (!state || typeof state !== 'string') return '';
  const trimmed = state.trim();
  if (/^\d{2}$/.test(trimmed)) return trimmed;

  const norm = normalizeState(trimmed);
  const codeMap = {
    'jammu and kashmir': '01',
    'himachal pradesh': '02',
    'punjab': '03',
    'chandigarh': '04',
    'uttarakhand': '05',
    'haryana': '06',
    'delhi': '07',
    'rajasthan': '08',
    'uttar pradesh': '09',
    'bihar': '10',
    'sikkim': '11',
    'arunachal pradesh': '12',
    'nagaland': '13',
    'manipur': '14',
    'mizoram': '15',
    'tripura': '16',
    'meghalaya': '17',
    'assam': '18',
    'west bengal': '19',
    'jharkhand': '20',
    'odisha': '21',
    'chhattisgarh': '22',
    'madhya pradesh': '23',
    'gujarat': '24',
    'daman and diu': '26',
    'dadra and nagar haveli': '26',
    'maharashtra': '27',
    'andhra pradesh': '37',
    'karnataka': '29',
    'goa': '30',
    'lakshadweep': '31',
    'kerala': '32',
    'tamil nadu': '33',
    'puducherry': '34',
    'andaman and nicobar islands': '35',
    'telangana': '36',
    'ladakh': '38',
  };

  return codeMap[norm] || '';
}

/**
 * Determine if a transaction is Inter-State (IGST) or Intra-State (CGST + SGST).
 *
 * @param {string} supplierState State of the supplier / dispatch origin
 * @param {string} customerState State of customer delivery address
 * @returns {{ isInterState: boolean, supplierState: string, customerState: string }}
 */
function determineJurisdiction(supplierState, customerState) {
  const normSupplier = normalizeState(supplierState || 'Jammu and Kashmir');
  const normCustomer = normalizeState(customerState || 'Jammu and Kashmir');

  const isInterState = normSupplier !== normCustomer;

  return {
    isInterState,
    supplierState: supplierState || 'Jammu and Kashmir',
    customerState: customerState || 'Jammu and Kashmir',
  };
}

// ============================================================================
// PHASE D: CENTRALIZED GST CONFIGURATION FOR CUSTOMER PRODUCT SALES
// ============================================================================
const CUSTOMER_PRODUCT_GST_RATE = 18; // Flat 18% GST per client business instruction
const CUSTOMER_PRODUCT_GST_RATIO = 0.18;

/**
 * Resolve the applicable GST rate for a product.
 * Under Phase D client business instruction, customer product sales flow uses a flat 18% GST rate.
 * The underlying dynamic tax-rate architecture (0%, 5%, 12%, 18%) is preserved for catalog inquiries
 * or when explicitly requested via options.useCatalogRate.
 *
 * @param {object} product Product document or snapshot
 * @param {object} [gstSettings] GSTSettings singleton
 * @param {object} [options] Options: { useCatalogRate: boolean }
 * @returns {number} Effective GST percentage (e.g. 18)
 */
function resolveProductTaxRate(product, gstSettings = null, options = {}) {
  if (gstSettings && gstSettings.gst_enabled === false) {
    return 0;
  }

  // Preserve underlying dynamic catalog tax rates when explicitly requested
  if (options && options.useCatalogRate) {
    // 1. Explicit product-level GST rate
    if (product && typeof product.gstRate === 'number' && !isNaN(product.gstRate)) {
      return product.gstRate;
    }
    if (product && typeof product.taxRate === 'number' && !isNaN(product.taxRate)) {
      return product.taxRate;
    }

    // 2. Category-based rate from GSTSettings
    if (product && product.category && gstSettings && Array.isArray(gstSettings.category_gst_rates)) {
      const catMatch = gstSettings.category_gst_rates.find(
        (c) => c.category && c.category.toLowerCase() === product.category.toLowerCase()
      );
      if (catMatch && typeof catMatch.gst_percentage === 'number') {
        return catMatch.gst_percentage;
      }
    }

    // 3. Global default percentage from GSTSettings
    if (gstSettings && typeof gstSettings.default_gst_percentage === 'number') {
      return gstSettings.default_gst_percentage;
    }
  }

  // Authoritative Phase D client instruction: Flat 18% GST for customer product sales flow
  return CUSTOMER_PRODUCT_GST_RATE;
}

/**
 * Calculate line item tax breakdown with precise rounding.
 * Guarantees cgstAmount + sgstAmount === totalTax for intra-state supplies.
 *
 * @param {object} params
 * @param {number} params.taxableAmount Net taxable amount after allocated discounts
 * @param {number} params.gstRate GST percentage (e.g. 5, 18)
 * @param {boolean} params.isInterState Whether supply is inter-state (IGST)
 * @returns {object} Tax calculation breakdown
 */
function calculateLineItemTax({
  taxableAmount,
  gstRate,
  unitPrice,
  quantity = 1,
  discount = 0,
  taxRate,
  isInterState = false,
}) {
  const effectiveGstRate = gstRate !== undefined ? gstRate : (taxRate !== undefined ? taxRate : 18);
  let safeTaxable;
  let subtotal = 0;
  if (taxableAmount !== undefined) {
    safeTaxable = Math.max(0, Math.round(Number(taxableAmount || 0) * 100) / 100);
    subtotal = Math.round((safeTaxable + (discount || 0)) * 100) / 100;
  } else {
    subtotal = Math.round(Number(unitPrice || 0) * Number(quantity || 1) * 100) / 100;
    safeTaxable = Math.max(0, Math.round((subtotal - (discount || 0)) * 100) / 100);
  }

  const safeRate = Math.max(0, Number(effectiveGstRate || 0));
  const totalTax = Math.round(safeTaxable * (safeRate / 100) * 100) / 100;

  if (isInterState) {
    return {
      subtotal,
      discount: discount || 0,
      taxableAmount: safeTaxable,
      gstRate: safeRate,
      taxRate: safeRate,
      totalTax,
      taxAmount: totalTax,
      isInterState: true,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: safeRate,
      igstAmount: totalTax,
    };
  } else {
    // Intra-State: Split into equal CGST and SGST (half and half)
    const halfRate = safeRate / 2;
    const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
    const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

    return {
      subtotal,
      discount: discount || 0,
      taxableAmount: safeTaxable,
      gstRate: safeRate,
      taxRate: safeRate,
      totalTax,
      taxAmount: totalTax,
      isInterState: false,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
    };
  }
}

/**
 * Calculate multi-item order tax breakdown with proportional discount apportionment.
 *
 * @param {object} params
 * @param {Array<object>} params.items Order items with price and quantity
 * @param {number} [params.discountAmount=0] Order discount to apportion
 * @param {string} params.supplierState Origin state
 * @param {string} params.customerState Destination state
 * @param {object} [params.gstSettings] Global GST settings
 * @returns {object} Comprehensive order tax snapshot
 */
function calculateOrderTaxBreakdown({
  items = [],
  discountAmount = 0,
  supplierState = 'Jammu and Kashmir',
  customerState = 'Jammu and Kashmir',
  gstSettings = null,
}) {
  const { isInterState } = determineJurisdiction(supplierState, customerState);
  const grossSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const safeDiscount = Math.min(grossSubtotal, Math.max(0, discountAmount || 0));

  let totalTaxable = 0;
  let totalTax = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const itemsTax = items.map((item) => {
    const itemGross = (item.price || 0) * (item.quantity || 1);
    
    // Proportional discount apportionment
    const itemDiscount = grossSubtotal > 0
      ? Math.round((itemGross / grossSubtotal) * safeDiscount * 100) / 100
      : 0;

    const taxableAmount = Math.max(0, Math.round((itemGross - itemDiscount) * 100) / 100);
    const gstRate = resolveProductTaxRate(item.product || item, gstSettings);
    
    const lineTax = calculateLineItemTax({ taxableAmount, gstRate, isInterState });

    totalTaxable += taxableAmount;
    totalTax += lineTax.totalTax;
    cgstTotal += lineTax.cgstAmount;
    sgstTotal += lineTax.sgstAmount;
    igstTotal += lineTax.igstAmount;

    const itemHsn = (item.hsnCode || item.hsn || (item.product && (item.product.hsnCode || item.product.hsn)) || '').trim();

    return {
      ...item,
      hsn: itemHsn,
      hsnCode: itemHsn,
      unitPrice: item.price,
      quantity: item.quantity,
      lineTotal: itemGross,
      discountAmount: itemDiscount,
      taxableAmount,
      gstRate: lineTax.gstRate,
      taxAmount: lineTax.totalTax,
      cgstRate: lineTax.cgstRate,
      cgstAmount: lineTax.cgstAmount,
      sgstRate: lineTax.sgstRate,
      sgstAmount: lineTax.sgstAmount,
      igstRate: lineTax.igstRate,
      igstAmount: lineTax.igstAmount,
      isInterState,
    };
  });

  return {
    isInterState,
    supplierState,
    customerState,
    grossSubtotal: Math.round(grossSubtotal * 100) / 100,
    totalDiscount: Math.round(safeDiscount * 100) / 100,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    cgst: Math.round(cgstTotal * 100) / 100,
    sgst: Math.round(sgstTotal * 100) / 100,
    igst: Math.round(igstTotal * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    igstTotal: Math.round(igstTotal * 100) / 100,
    itemsTax,
  };
}

module.exports = {
  CUSTOMER_PRODUCT_GST_RATE,
  CUSTOMER_PRODUCT_GST_RATIO,
  normalizeState,
  getStateCode,
  determineJurisdiction,
  resolveProductTaxRate,
  calculateLineItemTax,
  calculateOrderTaxBreakdown,
};
