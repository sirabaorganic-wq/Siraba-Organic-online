import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

// Add a request interceptor to inject the token
client.interceptors.request.use(
  (config) => {
    // Check if this is a vendor API call
    const isVendorRoute =
      config.url?.startsWith("/vendors") ||
      config.url?.startsWith("/vendor-messages/vendor") ||
      config.url?.startsWith("/notifications/vendor");

    if (isVendorRoute) {
      // Use vendor token for vendor routes
      const vendorToken = localStorage.getItem("vendorToken");
      if (vendorToken) {
        config.headers.Authorization = `Bearer ${vendorToken}`;
      }
    } else {
      // Use regular user token for other routes
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || "";
      const isVendorRoute =
        requestUrl.startsWith("/vendors") ||
        requestUrl.startsWith("/vendor-messages/vendor") ||
        requestUrl.startsWith("/notifications/vendor");

      if (isVendorRoute) {
        // Vendor auth failed - redirect to vendor login
        localStorage.removeItem("vendorToken");
        localStorage.removeItem("vendorInfo");
        if (
          !window.location.pathname.startsWith("/vendor") ||
          window.location.pathname === "/vendor/dashboard"
        ) {
          window.location.href = "/vendor";
        }
      } else {
        // User auth failed - redirect to user login
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        if (
          window.location.pathname !== "/login" &&
          !window.location.pathname.startsWith("/vendor")
        ) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
