const axios = require('axios');
const IORedis = require('ioredis');
const { CUSTOMER_PRODUCT_GST_RATE } = require('../utils/gstEngine');

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

    this.authPromise = null;

    // Safe 401 Token Recovery Interceptor (BUG-05)
    if (this.client?.interceptors?.response?.use) {
      this.client.interceptors.response.use(
        (response) => response,
        async (error) => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/login')
        ) {
          originalRequest._retry = true;
          await this.clearCachedToken();
          try {
            const newToken = await this.login(true);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return typeof this.client.request === 'function'
              ? this.client.request(originalRequest)
              : this.client(originalRequest);
          } catch (authError) {
            return Promise.reject(authError);
          }
        }
        return Promise.reject(error);
      }
    );
    }
  }

  /**
   * Clears cached token in both memory and Redis
   */
  async clearCachedToken() {
    this.inMemoryToken = null;
    this.inMemoryTokenExpiry = 0;
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.del('shiprocket_token');
      } catch (e) {}
    }
  }

  /**
   * Alias for login() to preserve backwards-compatibility with scripts
   */
  async authenticate() {
    return this.login();
  }

  /**
   * Authenticates with Shiprocket API and caches the JWT token
   * @param {boolean} forceRefresh - Bypass cache and fetch fresh token from API
   */
  async login(forceRefresh = false) {
    // 1. Check in-memory cache
    if (!forceRefresh && this.inMemoryToken && Date.now() < this.inMemoryTokenExpiry) {
      return this.inMemoryToken;
    }

    // 2. Check Redis cache if connected
    if (!forceRefresh && this.redis && this.redis.status === 'ready') {
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

    // Prevent concurrent auth storms under load
    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      try {
        const response = await this.client.post('/auth/login', {
          email: process.env.SHIPROCKET_API_EMAIL,
          password: process.env.SHIPROCKET_API_PASSWORD,
        });

        const token = response.data?.token;
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
        console.error('Shiprocket Auth Error:', error.response?.data?.message || error.message);
        throw new Error('Failed to authenticate with Shiprocket');
      } finally {
        this.authPromise = null;
      }
    })();

    return this.authPromise;
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

    // Unique, deterministic location nickname (Shiprocket hard limit: 36 characters, alphanumeric & underscores)
    const sanitizeName = (str) => (str || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 36);
    let locationName =
      vendor.shiprocket_pickup_code ||
      addr.shiprocketLocationName ||
      `V_${sanitizeName(vendor.businessName).substring(0, 20)}_${vendor._id.toString().substring(18)}`;
    
    // Ensure final locationName never exceeds 36 chars and has valid chars
    locationName = sanitizeName(locationName);

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
    if (!shipmentId) {
      throw new Error('Shipment ID is required to generate pickup');
    }

    const token = await this.login();
    try {
      const response = await this.client.post('/courier/generate/pickup', {
        shipment_id: [String(shipmentId)],
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      const isSuccess = data?.pickup_status === 1 ||
        Boolean(data?.response?.pickup_token_number) ||
        Boolean(data?.response?.pickup_scheduled_date) ||
        (typeof data?.message === 'string' && data.message.toLowerCase().includes('already'));

      return {
        success: isSuccess,
        pickupStatus: data?.pickup_status,
        pickupScheduledDate: data?.response?.pickup_scheduled_date || null,
        pickupTokenNumber: data?.response?.pickup_token_number || null,
        message: data?.response?.data || data?.message || '',
        rawResponse: data,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      if (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('scheduled'))) {
        return {
          success: true,
          alreadyScheduled: true,
          message: errorMsg,
          rawResponse: error.response?.data,
        };
      }
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

      const isAlreadyScheduled = Boolean(vendorOrder.pickupScheduledAt || vendorOrder.status === 'pickup_scheduled');
      if (shipmentData.awbCode && !isAlreadyScheduled) {
        try {
          const pickupRes = await this.generatePickup(shipmentData.shipmentId);
          shipmentData.pickup = pickupRes;
          if (pickupRes.success) {
            shipmentData.pickupScheduled = true;
            shipmentData.pickupScheduledAt = pickupRes.pickupScheduledDate ? new Date(pickupRes.pickupScheduledDate) : new Date();
            shipmentData.pickupTokenNumber = pickupRes.pickupTokenNumber || '';
          } else {
            shipmentData.pickupScheduled = false;
            shipmentData.pickupError = pickupRes.message || 'Pickup scheduling pending';
          }
        } catch (pErr) {
          console.warn(`Pickup generation notice for shipment ${shipmentData.shipmentId}:`, pErr.response?.data?.message || pErr.message);
          shipmentData.pickupScheduled = false;
          shipmentData.pickupError = pErr.response?.data?.message || pErr.message;
        }
      } else if (isAlreadyScheduled) {
        shipmentData.pickupScheduled = true;
        shipmentData.pickupScheduledAt = vendorOrder.pickupScheduledAt;
        shipmentData.pickupTokenNumber = vendorOrder.pickupTokenNumber;
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

    const resellerName = (
      vendor?.businessName ||
      vendor?.tradeName ||
      vendor?.brandName ||
      vendor?.shopSettings?.shopName ||
      vendor?.legalName ||
      'SIRABA ORGANIC'
    ).trim();

    const payload = {
      order_id: vendorOrder._id.toString(),
      order_date: new Date(vendorOrder.createdAt || Date.now()).toISOString().split('T')[0],
      pickup_location: verification.locationName || pickupLocation,
      reseller_name: resellerName,
      billing_customer_name: vendorOrder.shippingAddress?.name || order.shippingAddress?.name || order.shippingAddress?.fullName || order.user?.name || 'Customer',
      billing_last_name: '',
      billing_address: vendorOrder.shippingAddress?.address || order.shippingAddress?.address || 'Main Street',
      billing_city: vendorOrder.shippingAddress?.city || order.shippingAddress?.city || 'Jaipur',
      billing_pincode: String(vendorOrder.shippingAddress?.postalCode || order.shippingAddress?.postalCode).trim(),
      billing_state: vendorOrder.shippingAddress?.state || order.shippingAddress?.state || 'Rajasthan',
      billing_country: vendorOrder.shippingAddress?.country || order.shippingAddress?.country || 'India',
      billing_email: order.user?.email || 'customer@sirabaorganic.com',
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      order_items: vendorOrder.items.map((item) => {
        const itemObj = {
          name: item.name,
          sku: item.sku || 'SKU',
          units: item.quantity,
          selling_price: item.price,
          discount: item.discountAmount || 0,
        };

        const rawHsn =
          item.hsnCode ||
          item.hsn ||
          (item.product && (item.product.hsnCode || item.product.hsn)) ||
          '';
        const cleanHsn = typeof rawHsn === 'string' ? rawHsn.trim() : String(rawHsn || '').trim();
        if (cleanHsn) {
          itemObj.hsn = cleanHsn;
        }

        const effectiveTaxRate =
          typeof item.taxRate === 'number' && !isNaN(item.taxRate)
            ? item.taxRate
            : (typeof vendorOrder.taxBreakdown?.totalTax === 'number' && vendorOrder.subtotal > 0
                ? Math.round((vendorOrder.taxBreakdown.totalTax / vendorOrder.subtotal) * 100)
                : CUSTOMER_PRODUCT_GST_RATE);

        itemObj.tax = effectiveTaxRate;

        return itemObj;
      }),
      payment_method: payment_method,
      sub_total: vendorOrder.subtotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: totalWeight > 0 ? totalWeight : 0.5,
    };

    console.log('[Shiprocket] Dispatching shipment payload:', {
      vendorOrderId: vendorOrder._id?.toString(),
      vendorId: vendor?._id?.toString() || 'direct_platform',
      pickup_location: payload.pickup_location,
      reseller_name: payload.reseller_name,
      itemsCount: payload.order_items.length,
      hasHsn: payload.order_items.every((it) => Boolean(it.hsn)),
      hasTax: payload.order_items.every((it) => it.tax !== undefined && it.tax !== null),
      payment_method: payload.payment_method,
      sub_total: payload.sub_total,
    });

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

      // Auto-attempt Pickup Scheduling once AWB is assigned on fresh shipment (BUG-01 Fix)
      if (shipmentData.awbCode && shipmentData.shipmentId) {
        try {
          const pickupRes = await this.generatePickup(shipmentData.shipmentId);
          shipmentData.pickup = pickupRes;
          if (pickupRes.success) {
            shipmentData.pickupScheduled = true;
            shipmentData.pickupScheduledAt = pickupRes.pickupScheduledDate ? new Date(pickupRes.pickupScheduledDate) : new Date();
            shipmentData.pickupTokenNumber = pickupRes.pickupTokenNumber || '';
          } else {
            shipmentData.pickupScheduled = false;
            shipmentData.pickupError = pickupRes.message || 'Pickup scheduling pending';
          }
        } catch (pickupErr) {
          console.warn(`Auto pickup generation notice for shipment ${shipmentData.shipmentId}:`, pickupErr.response?.data?.message || pickupErr.message);
          shipmentData.pickupScheduled = false;
          shipmentData.pickupError = pickupErr.response?.data?.message || pickupErr.message;
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
   * Alias for cancelShipment to preserve compatibility
   */
  async cancelOrder(awbCode) {
    return this.cancelShipment(awbCode);
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
