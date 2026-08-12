const axios = require('axios');
const IORedis = require('ioredis');

class ShiprocketService {
  constructor() {
    this.inMemoryToken = null;
    this.inMemoryTokenExpiry = 0;

    // Safe Redis Initialization with error handler
    try {
      this.redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        retryStrategy() {
          return null; // Stop retrying if Redis is not available
        },
      });
      this.redis.on('error', (err) => {
        // Fallback silently to in-memory caching
      });
    } catch (e) {
      this.redis = null;
    }

    // Official Shiprocket Base API URL (sanitize /v1/payload -> /v1/external)
    let envBase = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    if (envBase.includes('/v1/payload')) {
      envBase = envBase.replace('/v1/payload', '/v1/external');
    }
    this.baseUrl = envBase;

    // Universal Axios Instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Authenticates with Shiprocket API and caches the JWT token
   */
  async login() {
    // 1. Check in-memory cache
    if (this.inMemoryToken && Date.now() < this.inMemoryTokenExpiry) {
      return this.inMemoryToken;
    }

    // 2. Check Redis cache if connected
    if (this.redis && this.redis.status === 'ready') {
      try {
        const cachedToken = await this.redis.get('shiprocket_token');
        if (cachedToken) {
          this.inMemoryToken = cachedToken;
          this.inMemoryTokenExpiry = Date.now() + 8 * 24 * 60 * 60 * 1000;
          return cachedToken;
        }
      } catch (redisErr) {
        // Ignore Redis error and proceed to API login
      }
    }

    try {
      const response = await this.client.post('/auth/login', {
        email: process.env.SHIPROCKET_API_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD,
      });

      const token = response.data.token;
      if (!token) {
        throw new Error('No token returned from Shiprocket API');
      }

      this.inMemoryToken = token;
      this.inMemoryTokenExpiry = Date.now() + 8 * 24 * 60 * 60 * 1000;

      if (this.redis && this.redis.status === 'ready') {
        try {
          await this.redis.set('shiprocket_token', token, 'EX', 8 * 24 * 60 * 60);
        } catch (e) {}
      }

      return token;
    } catch (error) {
      console.error('Shiprocket Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }

  /**
   * Register Vendor Pickup Location with Shiprocket API
   * POST /settings/company/addpickup
   */
  async registerPickupLocation(vendor) {
    if (!vendor || !vendor.pickupAddress) {
      throw new Error('Vendor pickup address is required');
    }

    const addr = vendor.pickupAddress;
    if (!addr.pincode || !addr.addressLine1 || !addr.city || !addr.state) {
      throw new Error('Incomplete vendor pickup address: addressLine1, city, state, and pincode required');
    }

    const token = await this.login();

    // Unique, deterministic location nickname
    const sanitizeName = (str) => (str || '').replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30);
    const locationName =
      vendor.shiprocket_pickup_code ||
      addr.shiprocketLocationName ||
      `V_${sanitizeName(vendor.businessName)}_${vendor._id.toString().substring(18)}`;

    const payload = {
      pickup_location: locationName,
      name: addr.contactPerson || vendor.contactPerson || vendor.businessName,
      email: vendor.email,
      phone: addr.phone || vendor.phone,
      address: addr.addressLine1,
      address_2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      country: addr.country || 'India',
      pin_code: String(addr.pincode).trim(),
    };

    try {
      const response = await this.client.post('/settings/company/addpickup', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        success: true,
        locationName,
        shiprocketResponse: response.data,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`Shiprocket addpickup failed for vendor ${vendor._id}:`, error.response?.data || error.message);
      
      // If location name already exists in Shiprocket, treat as success/reuse
      if (errorMsg && (errorMsg.includes('already exists') || errorMsg.includes('Location name already'))) {
        return {
          success: true,
          locationName,
          alreadyExists: true,
        };
      }

      return {
        success: false,
        locationName,
        error: errorMsg,
      };
    }
  }

  /**
   * Checks options and returns the best courier 
   */
  async checkServiceability({ pickup_postcode, delivery_postcode, weight, cod }) {
    const token = await this.login();
    try {
      const response = await this.client.get('/courier/serviceability/', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          pickup_postcode,
          delivery_postcode,
          weight,
          cod: cod ? 1 : 0,
        },
      });

      const couriers = response.data.data?.available_courier_companies || [];
      if (couriers.length === 0) {
        throw new Error('No couriers available for this route');
      }

      couriers.sort((a, b) => {
        if (a.etd_hours !== b.etd_hours) return a.etd_hours - b.etd_hours;
        if (a.rating !== b.rating) return b.rating - a.rating;
        return a.rate - b.rate;
      });

      return couriers[0];
    } catch (error) {
      console.error('Shiprocket Serviceability Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verifies if a pickup location name exists in the Shiprocket account
   */
  async verifyPickupLocation(locationName) {
    if (!locationName) {
      return { verified: false, reason: 'MISSING_LOCATION_NAME', message: 'Pickup location name is required' };
    }

    const token = await this.login();
    try {
      const response = await this.client.get('/settings/company/pickup', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const shippingAddresses = response.data?.data?.shipping_address || [];
      const recentAddresses = response.data?.data?.recent_addresses || [];
      const allAddresses = [...(Array.isArray(shippingAddresses) ? shippingAddresses : []), ...(Array.isArray(recentAddresses) ? recentAddresses : [])];

      const matched = allAddresses.find((addr) =>
        (addr.pickup_location || addr.location_name || addr.pickup_code || '').trim().toLowerCase() === locationName.trim().toLowerCase()
      );

      if (matched) {
        return {
          verified: true,
          locationName: matched.pickup_location || matched.location_name || locationName,
          locationId: matched.id || matched.address_id || null,
          verifiedAt: new Date(),
        };
      }

      return {
        verified: false,
        reason: 'PICKUP_LOCATION_NOT_REGISTERED',
        message: `Pickup location '${locationName}' is not registered in Shiprocket.`,
      };
    } catch (error) {
      console.error('Verify Pickup Location API error:', error.response?.data || error.message);
      return {
        verified: false,
        reason: 'SHIPROCKET_VERIFICATION_API_ERROR',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Assign AWB Code for a created shipment
   */
  async assignAwb(shipmentId, courierId = null) {
    const token = await this.login();
    try {
      const payload = { shipment_id: String(shipmentId) };
      if (courierId) payload.courier_id = String(courierId);

      const response = await this.client.post('/courier/assign/awb', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data?.response?.data || response.data;
    } catch (error) {
      console.error('Shiprocket Assign AWB Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Request / Generate Pickup for a shipment
   */
  async generatePickup(shipmentId) {
    const token = await this.login();
    try {
      const response = await this.client.post('/courier/generate/pickup', {
        shipment_id: [String(shipmentId)],
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      console.error('Shiprocket Generate Pickup Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Translates Siraba schemas to Shiprocket Payload to create an adhoc shipment
   */
  async createShipment(vendorOrder, order, vendor) {
    const token = await this.login();

    // Verify vendor pickup location configuration
    const pickupLocation =
      vendor?.pickupAddress?.shiprocketLocationName ||
      vendor?.shiprocket_pickup_code ||
      vendor?.pickupAddress?.facilityName;

    if (!pickupLocation) {
      const err = new Error(`Vendor ${vendor?._id || 'Direct'} has no configured pickup location name`);
      err.code = 'PICKUP_LOCATION_NOT_REGISTERED';
      throw err;
    }

    // STRICT NO WRONG-PICKUP FALLBACK POLICY: Verify location with Shiprocket first!
    const verification = await this.verifyPickupLocation(pickupLocation);
    if (!verification.verified) {
      const err = new Error(verification.message || `Pickup location '${pickupLocation}' is not registered in Shiprocket.`);
      err.code = verification.reason || 'PICKUP_LOCATION_NOT_REGISTERED';
      throw err;
    }

    // REUSE EXISTING SHIPMENT: If shipmentId already exists, NEVER call /orders/create/adhoc again!
    if (vendorOrder.shipmentId) {
      console.log(`Reusing existing Shiprocket Shipment ID ${vendorOrder.shipmentId} for order ${vendorOrder._id}`);
      const shipmentData = {
        shiprocketOrderId: vendorOrder.shiprocketOrderId,
        shipmentId: vendorOrder.shipmentId,
        awbCode: vendorOrder.awbCode || '',
        courierName: vendorOrder.courierName || '',
        courierId: vendorOrder.courierId || '',
        routingCode: vendorOrder.shippingRoutingCode || '',
        labelUrl: vendorOrder.labelUrl || '',
      };

      if (!shipmentData.awbCode) {
        const awbRes = await this.assignAwb(shipmentData.shipmentId);
        if (awbRes?.awb_code) {
          shipmentData.awbCode = awbRes.awb_code;
          shipmentData.courierName = awbRes.courier_name || awbRes.courier_company_id || '';
          shipmentData.courierId = String(awbRes.courier_company_id || '');
        } else if (awbRes?.awb_assign_error) {
          throw new Error(`AWB Assignment Error: ${awbRes.awb_assign_error}`);
        }
      }

      if (shipmentData.awbCode) {
        try {
          await this.generatePickup(shipmentData.shipmentId);
          shipmentData.pickupScheduled = true;
        } catch (pErr) {
          console.warn(`Pickup generation notice for shipment ${shipmentData.shipmentId}:`, pErr.response?.data?.message || pErr.message);
        }
      }

      return shipmentData;
    }

    const isPrepaid = order.isPaid === true || order.paymentStatus === 'captured' || order.paymentStatus === 'paid';
    const payment_method = isPrepaid ? 'Prepaid' : 'COD';

    let totalWeight = 0;
    vendorOrder.items.forEach((item) => {
      totalWeight += (item.weight || 0.5) * item.quantity;
    });

    if (!vendorOrder.shippingAddress || !vendorOrder.shippingAddress.postalCode) {
      throw new Error('Shipping address or postal code is missing');
    }

    const rawPhone = String(
      vendorOrder.shippingAddress?.phone ||
      order.shippingAddress?.phone ||
      order.user?.phone ||
      vendor?.phone ||
      '9549892293'
    ).replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? rawPhone : (rawPhone.length > 10 ? rawPhone.slice(-10) : '9549892293');

    const payload = {
      order_id: vendorOrder._id.toString(),
      order_date: new Date(vendorOrder.createdAt || Date.now()).toISOString().split('T')[0],
      pickup_location: verification.locationName || pickupLocation,
      billing_customer_name: vendorOrder.shippingAddress?.name || order.shippingAddress?.fullName || order.user?.name || 'Customer',
      billing_last_name: '',
      billing_address: vendorOrder.shippingAddress?.address || order.shippingAddress?.address || 'Main Street',
      billing_city: vendorOrder.shippingAddress?.city || order.shippingAddress?.city || 'Jaipur',
      billing_pincode: String(vendorOrder.shippingAddress?.postalCode || order.shippingAddress?.postalCode).trim(),
      billing_state: vendorOrder.shippingAddress?.state || order.shippingAddress?.state || 'Rajasthan',
      billing_country: vendorOrder.shippingAddress?.country || order.shippingAddress?.country || 'India',
      billing_email: order.user?.email || 'customer@sirabaorganic.com',
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      order_items: vendorOrder.items.map((item) => ({
        name: item.name,
        sku: item.sku || 'SKU',
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
      })),
      payment_method: payment_method,
      sub_total: vendorOrder.subtotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: totalWeight > 0 ? totalWeight : 0.5,
    };

    try {
      const response = await this.client.post('/orders/create/adhoc', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = response.data;

      const shipmentData = {
        shiprocketOrderId: result.order_id,
        shipmentId: result.shipment_id,
        awbCode: result.awb_code || '',
        courierName: result.courier_name || '',
        courierId: result.courier_company_id || '',
        routingCode: result.routing_code || '',
        labelUrl: result.label_url || '',
      };

      // Auto-attempt AWB assignment if AWB code was not included in order creation response
      if (!shipmentData.awbCode && shipmentData.shipmentId) {
        try {
          const awbRes = await this.assignAwb(shipmentData.shipmentId);
          if (awbRes?.awb_code) {
            shipmentData.awbCode = awbRes.awb_code;
            shipmentData.courierName = awbRes.courier_name || awbRes.courier_company_id || '';
            shipmentData.courierId = String(awbRes.courier_company_id || '');
          }
        } catch (awbErr) {
          console.warn(`Auto AWB assignment notice for shipment ${shipmentData.shipmentId}:`, awbErr.response?.data?.message || awbErr.message);
        }
      }

      return shipmentData;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      console.error('Shiprocket Create Shipment Error:', error.response?.data || error.message);
      const err = new Error(`Shiprocket order creation failed: ${errorMsg}`);
      err.code = error.response?.status === 400 ? 'SHIPROCKET_ORDER_CREATE_FAILED' : 'SHIPROCKET_API_ERROR';
      err.response = error.response;
      throw err;
    }
  }

  /**
   * Cancel shipment using AWB Code
   */
  async cancelShipment(awbCode) {
    const token = await this.login();
    try {
      const response = await this.client.post(
        '/orders/cancel/awb',
        { awbs: [awbCode] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Shiprocket Cancel Shipment Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Handle inventory rollback when shipment totally fails
   */
  async rollbackInventory(vendorOrder) {
    const Product = require('../models/Product');
    const Vendor = require('../models/Vendor');

    try {
      for (const item of vendorOrder.items) {
        if (item.product) {
          // Fixed: countInStock -> stockQuantity
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stockQuantity: item.quantity },
          });

          await Vendor.updateOne(
            { _id: vendorOrder.vendor, 'inventory.product': item.product },
            { $inc: { 'inventory.$.stockQuantity': item.quantity } }
          );
        }
      }
      console.log(`Inventory rolled back for VendorOrder: ${vendorOrder._id}`);
    } catch (err) {
      console.error('Error rolling back inventory:', err);
    }
  }

  /**
   * Track order by AWB
   */
  async trackOrder(awbCode) {
    const token = await this.login();
    try {
      const response = await this.client.get(`/courier/track/awb/${awbCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Track Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new ShiprocketService();
