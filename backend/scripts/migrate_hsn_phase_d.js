/**
 * ============================================================================
 * SIRABA ORGANIC — PHASE D HSN MIGRATION & AUDIT SCRIPT
 * File: backend/scripts/migrate_hsn_phase_d.js
 * Run:  node backend/scripts/migrate_hsn_phase_d.js
 * ============================================================================
 *
 * Implements Phase D Database Migration & Compliance Audit:
 * 1. Synchronizes canonical `hsnCode` and backward-compatible `hsn` fields on all Product documents.
 * 2. DOES NOT invent or guess HSN codes for products missing them.
 * 3. Identifies and logs all products with missing HSN codes.
 * 4. Ensures product-level gstRate is standardized to 18%.
 * 5. Produces an audit summary for administrators and vendors.
 */

'use strict';

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

async function runMigration() {
  console.log('============================================================');
  console.log('📦  SIRABA ORGANIC — PHASE D PRODUCT HSN MIGRATION & AUDIT');
  console.log('============================================================\n');

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI missing in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB.\n');

  try {
    const products = await Product.find({}).populate('vendor', 'businessName email');
    console.log(`Total Products in Database: ${products.length}\n`);

    let updatedCount = 0;
    let configuredCount = 0;
    let missingCount = 0;
    const missingProductsList = [];

    for (const prod of products) {
      let isModified = false;
      const existingHsn = (prod.hsn || '').trim();
      const existingHsnCode = (prod.hsnCode || '').trim();

      const canonicalHsn = existingHsnCode || existingHsn;

      if (canonicalHsn) {
        configuredCount++;
        if (prod.hsnCode !== canonicalHsn || prod.hsn !== canonicalHsn) {
          prod.hsnCode = canonicalHsn;
          prod.hsn = canonicalHsn;
          isModified = true;
        }
      } else {
        missingCount++;
        missingProductsList.push({
          id: prod._id.toString(),
          name: prod.name,
          sku: prod.sku || 'N/A',
          category: prod.category,
          vendor: prod.vendor ? prod.vendor.businessName : 'In-House/Platform',
          vendorId: prod.vendor ? prod.vendor._id.toString() : 'None',
        });
      }

      // Ensure default gstRate is 18
      if (prod.gstRate !== 18) {
        prod.gstRate = 18;
        isModified = true;
      }

      if (isModified) {
        await prod.save();
        updatedCount++;
      }
    }

    console.log('------------------------------------------------------------');
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`  - Total Products Audited:     ${products.length}`);
    console.log(`  - HSN Configured (Valid):     ${configuredCount}`);
    console.log(`  - HSN Missing (Action Req):   ${missingCount}`);
    console.log(`  - Records Synchronized:       ${updatedCount}`);
    console.log('------------------------------------------------------------\n');

    if (missingProductsList.length > 0) {
      console.log('⚠️  PRODUCTS REQUIRING VENDOR HSN PROVISION:');
      console.log('   (These products will block final tax invoice issuance until configured)');
      console.table(missingProductsList);
    } else {
      console.log('✓ All products currently possess an HSN code.');
    }

    console.log('\n✓ Phase D Migration & Audit completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
