const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const SiteSettings = require('../models/SiteSettings');
const shiprocketService = require('../services/shiprocketService');

/**
 * Default shipping config used when SiteSettings has no shippingConfig doc yet.
 * Mirrors the schema defaults in SiteSettings.js.
 */
const DEFAULT_SHIPPING_CONFIG = {
  freeShippingThreshold: 999,
  thresholdScope: 'PER_VENDOR_ORDER',
  belowThresholdMode: 'CUSTOMER_PAYS',
  platformHandlingFeeFlat: 25,
  platformHandlingFeePercent: 5,
  codSurcharge: 40,
  flatRateFallback: 66,
  weightPerItem: 0.5,
  isEnabled: true,
};

/**
 * Load shipping config from DB or fall back to defaults.
 */
async function getShippingConfig() {
  try {
    const settings = await SiteSettings.findOne({ type: 'home' }).lean();
    if (settings?.shippingConfig) {
      return { ...DEFAULT_SHIPPING_CONFIG, ...settings.shippingConfig };
    }
  } catch (err) {
    console.error('Failed to load SiteSettings for shipping:', err.message);
  }
  return { ...DEFAULT_SHIPPING_CONFIG };
}

/**
 * Core vendor-wise shipping estimation logic.
 * Applied per vendor fulfillment group, NOT blindly against the parent cart total.
 *
 * @param {Array}  cartItems       - [{ product: ObjectId, quantity: Number, price: Number }]
 * @param {String} deliveryPincode - Customer's postal code
 * @param {String} paymentMethod   - "COD" or "Online"
 * @returns {Object} Vendor-wise shipping breakdown and totals
 */
async function calculateShipping(cartItems, deliveryPincode, paymentMethod = 'Online') {
  const config = await getShippingConfig();

  if (!config.isEnabled) {
    return {
      totalShipping: 0,
      isFreeShipping: true,
      freeShippingThreshold: config.freeShippingThreshold,
      amountToFreeShipping: 0,
      codSurcharge: 0,
      vendorBreakdown: [],
      _note: 'Shipping charges disabled by admin',
    };
  }

  // 1. Fetch products with vendor details
  const productIds = cartItems.map(item => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).populate('vendor');

  // 2. Group items into Vendor Fulfillment Groups
  const vendorGroupMap = new Map();

  for (const cartItem of cartItems) {
    const product = products.find(p => p._id.toString() === cartItem.product.toString());
    if (!product) continue;

    const unitPrice = cartItem.price || product.price;
    const itemTotal = unitPrice * cartItem.quantity;

    const vendorId = (product.isVendorProduct && product.vendor)
      ? product.vendor._id.toString()
      : '__platform__';

    if (!vendorGroupMap.has(vendorId)) {
      const vendorName = vendorId === '__platform__'
        ? 'Siraba Organic'
        : (product.vendor.businessName || 'Vendor');

      const pickupPincode = vendorId === '__platform__'
        ? null
        : (product.vendor.pickupAddress?.pincode || product.vendor.address?.postalCode);

      vendorGroupMap.set(vendorId, {
        vendorId,
        vendorName,
        pickupPincode,
        items: [],
        vendorSubtotal: 0,
        totalWeight: 0,
      });
    }

    const group = vendorGroupMap.get(vendorId);
    group.items.push({
      productId: product._id,
      name: product.name,
      quantity: cartItem.quantity,
      price: unitPrice,
      weight: config.weightPerItem * cartItem.quantity,
    });
    group.vendorSubtotal += itemTotal;
    group.totalWeight += config.weightPerItem * cartItem.quantity;
  }

  // Calculate total cart subtotal across all vendors
  const totalCartSubtotal = Array.from(vendorGroupMap.values()).reduce(
    (sum, g) => sum + g.vendorSubtotal,
    0
  );

  const isCartLevelFree = (config.thresholdScope === 'PER_PARENT_ORDER')
    ? (totalCartSubtotal >= config.freeShippingThreshold)
    : false;

  // 3. Process each Vendor Fulfillment Group independently
  const vendorBreakdown = [];
  let totalCustomerShipping = 0;
  const isCOD = paymentMethod === 'COD';

  for (const [, group] of vendorGroupMap) {
    // Determine free shipping eligibility
    const isFreeShippingEligible = isCartLevelFree || (group.vendorSubtotal >= config.freeShippingThreshold);

    let courierRate = config.flatRateFallback;
    let courierName = 'Standard Delivery';
    let estimatedDays = '3-5 days';

    // Optimization: Skip live Shiprocket courier query if customer is already eligible for free shipping
    if (!isFreeShippingEligible && group.pickupPincode && deliveryPincode) {
      try {
        const courier = await shiprocketService.checkServiceability({
          pickup_postcode: String(group.pickupPincode).trim(),
          delivery_postcode: String(deliveryPincode).trim(),
          weight: group.totalWeight > 0 ? group.totalWeight : 0.5,
          cod: isCOD,
        });

        if (courier) {
          courierRate = courier.rate || config.flatRateFallback;
          courierName = courier.courier_name || 'Standard Delivery';
          estimatedDays = courier.etd || '3-5 days';
        }
      } catch (err) {
        console.error(`Shipping estimate failed for vendor ${group.vendorName}:`, err.message);
        courierRate = config.flatRateFallback;
        courierName = 'Standard Delivery (est.)';
        estimatedDays = '5-7 days';
      }
    } else if (isFreeShippingEligible) {
      courierRate = 0;
      courierName = 'Free Delivery';
      estimatedDays = '3-5 days';
    } else {
      courierRate = config.flatRateFallback;
    }

    // Calculate platform handling fee & total estimated logistics cost
    const handlingFee = isFreeShippingEligible
      ? 0
      : Math.round(
          config.platformHandlingFeeFlat + (courierRate * config.platformHandlingFeePercent / 100)
        );
    const estimatedShippingCost = isFreeShippingEligible ? 0 : Math.round(courierRate + handlingFee);
    const customerShippingCharge = isFreeShippingEligible ? 0 : estimatedShippingCost;
    const shippingSubsidy = isFreeShippingEligible ? Math.round(config.flatRateFallback) : 0;
    const amountToFreeShipping = isFreeShippingEligible
      ? 0
      : Math.max(0, config.freeShippingThreshold - group.vendorSubtotal);

    totalCustomerShipping += customerShippingCharge;

    vendorBreakdown.push({
      vendorId: group.vendorId,
      vendorName: group.vendorName,
      vendorSubtotal: Math.round(group.vendorSubtotal * 100) / 100,
      threshold: config.freeShippingThreshold,
      isFreeShippingEligible,
      courierRate: Math.round(courierRate),
      handlingFee,
      estimatedShippingCost,
      customerShippingCharge,
      shippingSubsidy,
      amountToFreeShipping: Math.round(amountToFreeShipping * 100) / 100,
      subtotal: Math.round(customerShippingCharge), // alias for vendor shipping total
      courierName,
      estimatedDays,
    });
  }

  // 4. Add COD surcharge if applicable
  const codSurcharge = isCOD ? config.codSurcharge : 0;
  totalCustomerShipping += codSurcharge;

  const isOverallFree = totalCustomerShipping === 0;
  const rootAmountToFreeShipping = isOverallFree
    ? 0
    : Math.max(0, config.freeShippingThreshold - totalCartSubtotal);

  return {
    totalShipping: Math.round(totalCustomerShipping),
    isFreeShipping: isOverallFree,
    freeShippingThreshold: config.freeShippingThreshold,
    amountToFreeShipping: Math.round(rootAmountToFreeShipping * 100) / 100,
    codSurcharge,
    vendorBreakdown,
  };
}

// ─── ROUTE: GET /api/shipping/config ──────────────────────────
// @desc    Get public shipping config (threshold, enabled, etc.)
// @access  Public
router.get('/config', async (req, res) => {
  try {
    const config = await getShippingConfig();
    res.json({
      freeShippingThreshold: config.freeShippingThreshold,
      thresholdScope: config.thresholdScope,
      belowThresholdMode: config.belowThresholdMode,
      codSurcharge: config.codSurcharge,
      isEnabled: config.isEnabled,
    });
  } catch (error) {
    console.error('Failed to get shipping config:', error);
    res.status(500).json({ message: 'Failed to get shipping config', error: error.message });
  }
});

// ─── ROUTE: POST /api/shipping/estimate ───────────────────────
// @desc    Calculate vendor-wise shipping charges for a cart + delivery address
// @access  Private (logged-in users)
router.post('/estimate', protect, async (req, res) => {
  try {
    const { cartItems, deliveryPincode, paymentMethod } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    if (!deliveryPincode) {
      return res.status(400).json({ message: 'Delivery pincode is required' });
    }

    const result = await calculateShipping(cartItems, deliveryPincode, paymentMethod);
    res.json(result);
  } catch (error) {
    console.error('Shipping Estimate Error:', error);
    res.status(500).json({ message: 'Failed to estimate shipping', error: error.message });
  }
});

module.exports = router;
module.exports.calculateShipping = calculateShipping;
module.exports.getShippingConfig = getShippingConfig;
