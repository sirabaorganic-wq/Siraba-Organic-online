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
  platformHandlingFeeFlat: 25,
  platformHandlingFeePercent: 5,
  codSurcharge: 40,
  flatRateFallback: 70,
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
      // Merge with defaults so new fields always have values
      return { ...DEFAULT_SHIPPING_CONFIG, ...settings.shippingConfig };
    }
  } catch (err) {
    console.error('Failed to load SiteSettings for shipping:', err.message);
  }
  return { ...DEFAULT_SHIPPING_CONFIG };
}

/**
 * Core shipping estimation logic.
 * Shared between the estimate endpoint and order-creation validation.
 *
 * @param {Array}  cartItems       - [{ product: ObjectId, quantity: Number }]
 * @param {String} deliveryPincode - Customer's postal code
 * @param {String} paymentMethod   - "COD" or "Online"
 * @returns {Object} Shipping breakdown
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

  // 2. Group items by vendor
  const vendorGroupMap = new Map();
  let cartSubtotal = 0;

  for (const cartItem of cartItems) {
    const product = products.find(p => p._id.toString() === cartItem.product.toString());
    if (!product) continue;

    const itemTotal = (cartItem.price || product.price) * cartItem.quantity;
    cartSubtotal += itemTotal;

    // Determine vendor key — null/undefined vendor = platform product (admin warehouse)
    const vendorId = (product.isVendorProduct && product.vendor)
      ? product.vendor._id.toString()
      : '__platform__';

    if (!vendorGroupMap.has(vendorId)) {
      vendorGroupMap.set(vendorId, {
        vendorId,
        vendorName: vendorId === '__platform__'
          ? 'Siraba Organic'
          : (product.vendor.businessName || 'Vendor'),
        pickupPincode: vendorId === '__platform__'
          ? null // Will use Shiprocket's Primary pickup
          : product.vendor.address?.postalCode,
        items: [],
        totalWeight: 0,
      });
    }

    const group = vendorGroupMap.get(vendorId);
    group.items.push({
      productId: product._id,
      name: product.name,
      quantity: cartItem.quantity,
      price: cartItem.price || product.price,
      weight: config.weightPerItem * cartItem.quantity,
    });
    group.totalWeight += config.weightPerItem * cartItem.quantity;
  }

  // 3. Check free shipping threshold
  if (cartSubtotal >= config.freeShippingThreshold) {
    return {
      totalShipping: 0,
      isFreeShipping: true,
      freeShippingThreshold: config.freeShippingThreshold,
      amountToFreeShipping: 0,
      codSurcharge: 0,
      vendorBreakdown: Array.from(vendorGroupMap.values()).map(g => ({
        vendorId: g.vendorId,
        vendorName: g.vendorName,
        courierRate: 0,
        handlingFee: 0,
        courierName: 'Free Shipping',
        estimatedDays: '3-7',
        subtotal: 0,
      })),
    };
  }

  // 4. Query Shiprocket serviceability for each vendor group
  const vendorBreakdown = [];
  let totalShipping = 0;
  const isCOD = paymentMethod === 'COD';

  for (const [, group] of vendorGroupMap) {
    let courierRate = config.flatRateFallback;
    let courierName = 'Standard Delivery';
    let estimatedDays = '5-7';

    // Only query Shiprocket if we have both pincodes
    if (group.pickupPincode && deliveryPincode) {
      try {
        const courier = await shiprocketService.checkServiceability({
          pickup_postcode: group.pickupPincode,
          delivery_postcode: deliveryPincode,
          weight: group.totalWeight > 0 ? group.totalWeight : 0.5,
          cod: isCOD,
        });

        if (courier) {
          courierRate = courier.rate || config.flatRateFallback;
          courierName = courier.courier_name || 'Standard Delivery';
          estimatedDays = courier.etd || '3-5 days';
        }
      } catch (err) {
        // Shiprocket API failed — use fallback rate silently
        console.error(`Shipping estimate failed for vendor ${group.vendorName}:`, err.message);
        courierRate = config.flatRateFallback;
        courierName = 'Standard Delivery (est.)';
        estimatedDays = '5-7';
      }
    } else {
      // No vendor pincode (platform product) — use fallback
      courierRate = config.flatRateFallback;
    }

    // Calculate platform handling fee
    const handlingFee = Math.round(
      config.platformHandlingFeeFlat + (courierRate * config.platformHandlingFeePercent / 100)
    );

    const vendorShipping = Math.round(courierRate + handlingFee);
    totalShipping += vendorShipping;

    vendorBreakdown.push({
      vendorId: group.vendorId,
      vendorName: group.vendorName,
      courierRate: Math.round(courierRate),
      handlingFee,
      courierName,
      estimatedDays,
      subtotal: vendorShipping,
    });
  }

  // 5. Add COD surcharge if applicable
  const codSurcharge = isCOD ? config.codSurcharge : 0;
  totalShipping += codSurcharge;

  return {
    totalShipping: Math.round(totalShipping),
    isFreeShipping: false,
    freeShippingThreshold: config.freeShippingThreshold,
    amountToFreeShipping: Math.round(config.freeShippingThreshold - cartSubtotal),
    codSurcharge,
    vendorBreakdown,
  };
}

// ─── ROUTE: POST /api/shipping/estimate ───────────────────────
// @desc    Calculate shipping charges for a cart + delivery address
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
// Also export the core function for server-side validation in orderRoutes
module.exports.calculateShipping = calculateShipping;
