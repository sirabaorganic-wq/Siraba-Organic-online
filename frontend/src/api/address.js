import client from './client';

/**
 * Address API service for consumer shipping addresses
 */
export const addressApi = {
  // Fetch all saved addresses for the authenticated consumer
  getAddresses: async () => {
    try {
      const { data } = await client.get('/addresses');
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error('Failed to get addresses:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load addresses',
        data: [],
      };
    }
  },

  // Create a new consumer shipping address
  addAddress: async (addressData) => {
    try {
      const { data } = await client.post('/addresses', addressData);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to add address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save address',
        errors: error.response?.data?.errors,
      };
    }
  },

  // Update an existing address
  updateAddress: async (id, addressData) => {
    try {
      const { data } = await client.put(`/addresses/${id}`, addressData);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to update address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update address',
        errors: error.response?.data?.errors,
      };
    }
  },

  // Delete an existing address
  deleteAddress: async (id) => {
    try {
      const { data } = await client.delete(`/addresses/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to delete address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete address',
      };
    }
  },

  // Set an address as default
  setDefaultAddress: async (id) => {
    try {
      const { data } = await client.patch(`/addresses/${id}/default`);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to set default address:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to set default address',
      };
    }
  },
};

export default addressApi;
