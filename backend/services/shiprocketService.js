const axios = require('axios');
const IORedis = require('ioredis');

class ShiprocketService {
  constructor() {
    this.redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.baseUrl = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/payload';
    
    // Universal 5-10s timeout instance for API calls
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000 
    });
  }

  /**
   * Authenticates with Shiprocket API and caches the JWT token
   */
  async login() {
    const cachedToken = await this.redis.get('shiprocket_token');
    if (cachedToken) return cachedToken;

    try {
      const response = await this.client.post('/auth/login', {
        email: process.env.SHIPROCKET_API_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD
      });
      
      const token = response.data.token;
      // Cache for 9 days (Shiprocket tokens expire in 10 days) -> 9*24*60*60 seconds
      await this.redis.set('shiprocket_token', token, 'EX', 9 * 24 * 60 * 60);
      return token;
    } catch (error) {
      console.error('Shiprocket Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }

  /**
   * Checks options and returns the best courier 
   * Sorted by: (1) Delivery Time, (2) Rating, (3) Cost
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
          cod: cod ? 1 : 0
        }
      });

      const couriers = response.data.data.available_courier_companies || [];
      if (couriers.length === 0) {
        throw new Error('No couriers available for this route');
      }

      // Priority sort handling
      couriers.sort((a, b) => {
        if (a.etd_hours !== b.etd_hours) return a.etd_hours - b.etd_hours; // Faster is better
        if (a.rating !== b.rating) return b.rating - a.rating; // Higher rating is better
        return a.rate - b.rate; // Cheaper is better
      });

      return couriers[0]; 
    } catch (error) {
      console.error('Shiprocket Serviceability Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Translates Siraba schemas to Shiprocket Payload to create an adhoc shipment
   */
  async createShipment(vendorOrder, order, vendor) {
    const token = await this.login();
    
    // Payment Mode
    const isPrepaid = order.isPaid === true || order.paymentStatus === "paid";
    const payment_method = isPrepaid ? 'Prepaid' : 'COD';
    
    let totalWeight = 0;
    vendorOrder.items.forEach(item => {
       totalWeight += 0.5 * item.quantity;
    });

    if (!vendorOrder.shippingAddress || !vendorOrder.shippingAddress.postalCode) {
      throw new Error('Shipping address or postal code is missing');
    }

    const payload = {
      order_id: vendorOrder._id.toString(), 
      order_date: new Date(vendorOrder.createdAt).toISOString().split('T')[0],
      pickup_location: vendor.shiprocket_pickup_code || 'Primary',
      billing_customer_name: vendorOrder.shippingAddress.name || 'Customer',
      billing_last_name: '',
      billing_address: vendorOrder.shippingAddress.address,
      billing_city: vendorOrder.shippingAddress.city,
      billing_pincode: vendorOrder.shippingAddress.postalCode,
      billing_state: vendorOrder.shippingAddress.state,
      billing_country: vendorOrder.shippingAddress.country || 'India',
      billing_email: 'customer@example.com', 
      billing_phone: vendorOrder.shippingAddress.phone || '0000000000',
      shipping_is_billing: true,
      order_items: vendorOrder.items.map(item => ({
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
      weight: totalWeight > 0 ? totalWeight : 0.5 
    };

    try {
      const response = await this.client.post('/orders/create/adhoc', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = response.data;
      
      return {
        shiprocketOrderId: result.order_id,
        shipmentId: result.shipment_id,
        awbCode: result.awb_code,
        courierName: result.courier_name,
        courierId: result.courier_company_id,
        routingCode: result.routing_code,
        labelUrl: result.label_url
      };
    } catch (error) {
      console.error('Shiprocket Create Shipment Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Cancel shipment using AWB Code
   */
  async cancelShipment(awbCode) {
    const token = await this.login();
    try {
      const response = await this.client.post('/orders/cancel/awb', { awbs: [awbCode] }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
          await Product.findByIdAndUpdate(item.product, {
            $inc: { countInStock: item.quantity }
          });
          
          await Vendor.updateOne(
            { _id: vendorOrder.vendor, "inventory.product": item.product },
            { $inc: { "inventory.$.stockQuantity": item.quantity } }
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
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Track Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new ShiprocketService();
