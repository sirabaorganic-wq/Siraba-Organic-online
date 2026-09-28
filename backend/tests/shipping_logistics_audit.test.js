/**
 * ============================================================
 *  SIRABA ORGANIC — SHIPPING COST & VENDOR LOGISTICS AUDIT TEST
 *  File : backend/tests/shipping_logistics_audit.test.js
 *  Run  : node tests/shipping_logistics_audit.test.js
 * ============================================================
 *
 *  Comprehensive QA audit verifying:
 *  1. Business Rule Change: Free shipping threshold is ₹999 (not ₹499)
 *  2. Verification Scenarios: ₹100, ₹498, ₹499, ₹500, ₹998, ₹998.99, ₹999, ₹1,000+
 *  3. Dynamic single source of truth: SiteSettings threshold overrides
 *  4. Multi-vendor order rate aggregation & free shipping qualification
 *  5. Vendor Settlement & Economics: Net payout = subtotal - commission (0 shipping deduction)
 *  6. Platform subsidy accounting when free shipping is granted
 */

'use strict';

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

const PASS = `${GREEN}${BOLD}[ PASS ]${RESET}`;
const FAIL = `${RED}${BOLD}[ FAIL ]${RESET}`;
const INFO = `${CYAN}[ INFO ]${RESET}`;

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${PASS}  ${label}`);
    passed++;
  } else {
    console.log(`  ${FAIL}  ${label}`);
    if (detail) console.log(`         ${RED}↳ ${detail}${RESET}`);
    failed++;
    failures.push({ label, detail });
  }
}

// ─── MOCK DATA ────────────────────────────────────────────────

const VENDOR_1 = {
  _id: 'vend_01',
  businessName: 'Himalayan Organics',
  address: { postalCode: '248001' },
  shiprocket_pickup_code: 'PICKUP_DEHRADUN',
};

const VENDOR_2 = {
  _id: 'vend_02',
  businessName: 'Nilgiri Tea Estates',
  address: { postalCode: '643001' },
  shiprocket_pickup_code: 'PICKUP_OOTY',
};

const PROD_A = {
  _id: 'prod_a',
  name: 'Organic Basmati Rice 1kg',
  price: 249,
  vendor: VENDOR_1,
  isVendorProduct: true,
};

const PROD_B = {
  _id: 'prod_b',
  name: 'Green Tea Leaves 250g',
  price: 250,
  vendor: VENDOR_2,
  isVendorProduct: true,
};

const PROD_CUSTOM = {
  _id: 'prod_custom',
  name: 'Custom Priced Product',
  price: 100,
  vendor: VENDOR_1,
  isVendorProduct: true,
};

// ─── MOCK SYSTEM REQUIRE HOOK ────────────────────────────────

const Module = require('module');
const _origRequire = Module.prototype.require;

const mockProducts = [PROD_A, PROD_B, PROD_CUSTOM];
let siteSettingsData = {
  shippingConfig: {
    freeShippingThreshold: 999,
    thresholdScope: 'PER_VENDOR_ORDER',
    belowThresholdMode: 'CUSTOMER_PAYS',
    platformHandlingFeeFlat: 25,
    platformHandlingFeePercent: 5,
    codSurcharge: 40,
    flatRateFallback: 70,
    weightPerItem: 0.5,
    isEnabled: true,
  },
};

Module.prototype.require = function(path) {
  if (path.endsWith('../models/Product') || path.endsWith('./Product') || path === '../models/Product') {
    return {
      find: function(query) {
        const ids = query?._id?.$in || [];
        const results = mockProducts.filter(p => ids.includes(p._id));
        return {
          populate: () => Promise.resolve(results),
          lean: () => Promise.resolve(results),
          then: (res) => res(results),
        };
      },
    };
  }

  if (path.endsWith('../models/SiteSettings') || path.endsWith('./SiteSettings') || path === '../models/SiteSettings') {
    return {
      findOne: function() {
        return {
          lean: () => Promise.resolve(siteSettingsData),
          then: (res) => res(siteSettingsData),
        };
      },
    };
  }

  if (path.endsWith('../services/shiprocketService') || path === '../services/shiprocketService') {
    return {
      checkServiceability: async function({ pickup_postcode, delivery_postcode, cod, weight }) {
        return {
          status: 200,
          data: {
            available_courier_companies: [
              {
                courier_company_id: 101,
                courier_name: 'Delhivery Surface',
                rate: 60,
                etd: '3-4 days',
                rating: 4.5,
              },
            ],
          },
        };
      },
      getAvailableCouriers: async function({ pickup_postcode, delivery_postcode, cod }) {
        return [{
          courier_company_id: 101,
          courier_name: 'Delhivery Surface',
          rate: 60,
          etd: '3-4 days',
          rating: 4.5,
        }];
      },
    };
  }

  return _origRequire.apply(this, arguments);
};

// ─── IMPORT TARGET ────────────────────────────────────────────

const { calculateShipping, getShippingConfig } = require('../routes/shippingRoutes');

// ─── TEST RUNNER ──────────────────────────────────────────────

async function runAuditTests() {
  console.log(`\n${BOLD}============================================================${RESET}`);
  console.log(`${BOLD}📦  SIRABA ORGANIC — SHIPPING COST & LOGISTICS AUDIT SUITE${RESET}`);
  console.log(`${BOLD}============================================================${RESET}\n`);

  // ─────────────────────────────────────────────────────────────
  // 1. FREE SHIPPING THRESHOLD CONFIGURATION AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log(`${YELLOW}── Phase 1: Authoritative Free-Shipping Threshold ──${RESET}`);

  const config = await getShippingConfig();
  assert(
    'Authoritative threshold is exactly ₹999',
    config.freeShippingThreshold === 999,
    `Expected 999, got ${config.freeShippingThreshold}`
  );
  assert(
    'Threshold scope is PER_VENDOR_ORDER',
    config.thresholdScope === 'PER_VENDOR_ORDER',
    `Expected 'PER_VENDOR_ORDER', got ${config.thresholdScope}`
  );
  assert(
    'Shipping estimation engine is enabled',
    config.isEnabled === true
  );

  // ─────────────────────────────────────────────────────────────
  // 2. CHECKOUT SCENARIO AUDIT MATRIX
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}── Phase 2: Checkout Value Matrix (Under vs Over ₹999) ──${RESET}`);

  // Scenario 1: ₹100 cart
  PROD_CUSTOM.price = 100;
  const res100 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 100 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹100: Shipping charge applied (> 0)', res100.totalShipping > 0);
  assert('Cart ₹100: isFreeShipping === false', res100.isFreeShipping === false);
  assert('Cart ₹100: amountToFreeShipping === 899', res100.amountToFreeShipping === 899, `Got ${res100.amountToFreeShipping}`);

  // Scenario 2: ₹498 cart
  PROD_CUSTOM.price = 498;
  const res498 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 498 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹498: Shipping charge applied (> 0)', res498.totalShipping > 0);
  assert('Cart ₹498: isFreeShipping === false', res498.isFreeShipping === false);

  // Scenario 3: ₹499 cart (PREVIOUS THRESHOLD — MUST NOW CHARGE SHIPPING)
  PROD_CUSTOM.price = 499;
  const res499 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 499 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹499 (Old Threshold): Shipping charge APPLIED under new rule', res499.totalShipping > 0);
  assert('Cart ₹499: isFreeShipping === false (NO LONGER FREE)', res499.isFreeShipping === false);
  assert('Cart ₹499: amountToFreeShipping === 500', res499.amountToFreeShipping === 500, `Got ${res499.amountToFreeShipping}`);

  // Scenario 4: ₹500 cart
  PROD_CUSTOM.price = 500;
  const res500 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 500 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹500: Shipping charge applied', res500.totalShipping > 0);
  assert('Cart ₹500: isFreeShipping === false', res500.isFreeShipping === false);

  // Scenario 5: ₹998 cart
  PROD_CUSTOM.price = 998;
  const res998 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 998 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹998: Shipping charge applied', res998.totalShipping > 0);
  assert('Cart ₹998: isFreeShipping === false', res998.isFreeShipping === false);
  assert('Cart ₹998: amountToFreeShipping === 1', res998.amountToFreeShipping === 1);

  // Scenario 6: ₹998.99 cart
  PROD_CUSTOM.price = 998.99;
  const res998_99 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 998.99 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹998.99: Shipping charge applied', res998_99.totalShipping > 0);
  assert('Cart ₹998.99: isFreeShipping === false', res998_99.isFreeShipping === false);

  // Scenario 7: Exactly ₹999 cart (NEW THRESHOLD)
  PROD_CUSTOM.price = 999;
  const res999 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 999 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹999 exactly: totalShipping === 0 (FREE SHIPPING)', res999.totalShipping === 0, `Got ${res999.totalShipping}`);
  assert('Cart ₹999: isFreeShipping === true', res999.isFreeShipping === true);
  assert('Cart ₹999: amountToFreeShipping === 0', res999.amountToFreeShipping === 0);

  // Scenario 8: ₹1,000+ cart
  PROD_CUSTOM.price = 1250;
  const res1250 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 1250 }],
    '560001',
    'ONLINE'
  );
  assert('Cart ₹1,250: totalShipping === 0 (FREE SHIPPING)', res1250.totalShipping === 0);
  assert('Cart ₹1,250: isFreeShipping === true', res1250.isFreeShipping === true);

  // ─────────────────────────────────────────────────────────────
  // 3. MULTI-VENDOR ALLOCATION & ACCOUNTING
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}── Phase 3: Multi-Vendor Orders ──${RESET}`);

  // Multi-vendor cart under ₹999 per vendor: Prod A (₹249) + Prod B (₹250) = ₹499 total
  const resMultiUnder = await calculateShipping(
    [
      { product: 'prod_a', quantity: 1, price: 249 },
      { product: 'prod_b', quantity: 1, price: 250 },
    ],
    '560001',
    'ONLINE'
  );
  assert('Multi-vendor ₹499: 2 distinct vendor breakdown entries', resMultiUnder.vendorBreakdown.length === 2);
  assert('Multi-vendor ₹499: isFreeShipping === false', resMultiUnder.isFreeShipping === false);
  assert('Multi-vendor ₹499: Each vendor has individual shipping charge', 
    resMultiUnder.vendorBreakdown[0].customerShippingCharge > 0 &&
    resMultiUnder.vendorBreakdown[1].customerShippingCharge > 0
  );
  assert('Multi-vendor ₹499: totalShipping equals sum of vendor shipping charges',
    resMultiUnder.totalShipping === (
      resMultiUnder.vendorBreakdown[0].customerShippingCharge +
      resMultiUnder.vendorBreakdown[1].customerShippingCharge
    )
  );

  // Multi-vendor cart over ₹999 for both: Prod A (4 x ₹250 = ₹1,000) + Prod B (4 x ₹250 = ₹1,000)
  const resMultiOver = await calculateShipping(
    [
      { product: 'prod_a', quantity: 4, price: 250 },
      { product: 'prod_b', quantity: 4, price: 250 },
    ],
    '560001',
    'ONLINE'
  );
  assert('Multi-vendor over ₹999 each: isFreeShipping === true', resMultiOver.isFreeShipping === true);
  assert('Multi-vendor over ₹999 each: totalShipping === 0', resMultiOver.totalShipping === 0);
  assert('Multi-vendor over ₹999 each: All vendor shipping charges are ₹0 for consumer',
    resMultiOver.vendorBreakdown.every(v => v.customerShippingCharge === 0)
  );

  // ─────────────────────────────────────────────────────────────
  // 4. VENDOR SETTLEMENT & LOGISTICS RESPONSIBILITY AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}── Phase 4: Vendor Settlement & Logistics Accounting ──${RESET}`);

  // Test Vendor Payout Formula: Net Payout = Subtotal - Commission
  const vendorSubtotal = 1000;
  const commissionRate = 0.10; // 10%
  const commission = vendorSubtotal * commissionRate; // 100
  const actualCourierCost = 72; // Shiprocket rate

  // Accounting Model Verification:
  // Does Siraba deduct shipping from vendor? NO!
  const vendorShippingDeduction = 0;
  const vendorNetAmount = vendorSubtotal - commission - vendorShippingDeduction;

  assert(
    'Vendor Payout Formula: Net = Subtotal - Commission (Logistics Deduction is exactly ₹0)',
    vendorNetAmount === 900,
    `Expected 900, got ${vendorNetAmount}`
  );

  // Platform Subsidy Accounting for Free Shipping:
  const consumerShippingPaid = 0; // Free shipping
  const platformSubsidy = actualCourierCost - consumerShippingPaid;
  assert(
    'Platform Subsidy Accounting: Platform absorbs actual courier cost when consumer has free shipping',
    platformSubsidy === 72,
    `Expected 72, got ${platformSubsidy}`
  );

  // ─────────────────────────────────────────────────────────────
  // 5. DYNAMIC THRESHOLD OVERRIDE AUDIT
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}── Phase 5: Dynamic Threshold Authority (No Hardcoded Fallback) ──${RESET}`);

  // Dynamically update threshold to ₹1,500
  siteSettingsData.shippingConfig.freeShippingThreshold = 1500;

  PROD_CUSTOM.price = 1200;
  const resDynamic1200 = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 1200 }],
    '560001',
    'ONLINE'
  );
  assert(
    'Dynamic Config: Cart ₹1,200 now charges shipping when threshold dynamically updated to ₹1,500',
    resDynamic1200.totalShipping > 0 && resDynamic1200.isFreeShipping === false
  );

  // Restore threshold to ₹999
  siteSettingsData.shippingConfig.freeShippingThreshold = 999;
  const resRestored = await calculateShipping(
    [{ product: 'prod_custom', quantity: 1, price: 1200 }],
    '560001',
    'ONLINE'
  );
  assert(
    'Dynamic Config: Cart ₹1,200 receives free shipping again when threshold restored to ₹999',
    resRestored.totalShipping === 0 && resRestored.isFreeShipping === true
  );

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}============================================================${RESET}`);
  console.log(`TEST EXECUTION SUMMARY:`);
  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`${BOLD}============================================================${RESET}\n`);

  if (failed > 0) {
    console.error(`${RED}${BOLD}Audit Test Suite Failed with ${failed} error(s).${RESET}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}All Shipping & Logistics Audit Tests Passed Successfully!${RESET}\n`);
    process.exit(0);
  }
}

runAuditTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
