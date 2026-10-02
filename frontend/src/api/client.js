import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

// Add a request interceptor to inject the token
client.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    // Check if this is a vendor API call
    const isVendorRoute =
      url.startsWith("/vendors") ||
      url.startsWith("/vendor-messages/vendor") ||
      url.startsWith("/notifications/vendor") ||
      url.includes("/vendor");

    if (isVendorRoute) {
      // Use vendor token for vendor routes with resilient fallbacks
      let vendorToken = localStorage.getItem("vendorToken");
      if (!vendorToken) {
        try {
          const vInfo = JSON.parse(localStorage.getItem("vendorInfo") || "{}");
          vendorToken = vInfo.token;
        } catch (e) {}
      }
      if (!vendorToken) {
        vendorToken = localStorage.getItem("token");
      }
      if (vendorToken) {
        config.headers.Authorization = `Bearer ${vendorToken}`;
      }
    } else {
      // Use regular user token for other routes, falling back to vendorToken
      let token = localStorage.getItem("token");
      if (!token) {
        token = localStorage.getItem("vendorToken");
      }
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
        requestUrl.startsWith("/notifications/vendor") ||
        requestUrl.includes("/vendor");

      // Do NOT clear tokens on downloads, previews, or non-fatal status checks
      const isExemptRoute =
        requestUrl.includes("/download") ||
        requestUrl.includes("/preview") ||
        requestUrl.includes("/status");

      if (isVendorRoute) {
        if (!isExemptRoute) {
          // If actively on vendor dashboard and session expires
          if (window.location.pathname === "/vendor/dashboard") {
            localStorage.removeItem("vendorToken");
            localStorage.removeItem("vendorInfo");
            window.location.href = "/vendor";
          }
        }
      } else {
        // User auth failed - redirect to user login
        if (
          window.location.pathname !== "/login" &&
          !window.location.pathname.startsWith("/vendor")
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("userInfo");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
