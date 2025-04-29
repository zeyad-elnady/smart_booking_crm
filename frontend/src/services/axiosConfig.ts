import axios from "axios";

// Helper function to get the API URL
const getApiUrl = () => {
   const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
   console.log("Using API URL:", url);
   return url;
};

// Check if we're in a localhost/development environment
const isLocalDevelopment = () => {
   if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname.includes('192.168.') || 
         window.location.hostname.includes('.local');
   }
   return false;
};

// Create a separate axios instance for Next.js API routes
export const nextApiAxios = axios.create({
   // No baseURL because we'll use relative paths to /api routes
   timeout: 10000, // Increased timeout for API routes
   headers: {
      "Content-Type": "application/json",
   },
});

// Create axios instance with appropriate timeout for dev/prod
const axiosInstance = axios.create({
   baseURL: getApiUrl(),
   // Short timeout for local development to fail faster
   timeout: isLocalDevelopment() ? 3000 : 10000,
   headers: {
      "Content-Type": "application/json",
   },
});

// Add a request interceptor to include the auth token
axiosInstance.interceptors.request.use(
   (config) => {
      try {
         // Log the request details
         const requestUrl = `${config.baseURL || ""}${config.url || ""}`;
         console.log("Making request to:", requestUrl);
         console.log("Request method:", config.method?.toUpperCase());
         console.log("Request data:", config.data);

         const token = localStorage.getItem("token");
         if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Using auth token:", token.substring(0, 10) + "...");
         } else {
            console.log("No auth token found");
         }

         // Format date fields before sending to server
         if (config.data && config.data.date) {
            config.data.date = new Date(config.data.date).toISOString();
         }
         return config;
      } catch (err) {
         console.error("Error in request interceptor:", err);
         return config;
      }
   },
   (error) => {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
   }
);

// Response interceptor
axiosInstance.interceptors.response.use(
   (response) => {
      try {
         // Log successful response
         console.log(`Response from ${response.config.url || "unknown"}:`, {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
         });

         // Format dates in response data
         if (response.data && Array.isArray(response.data)) {
            response.data = response.data.map((item) => {
               if (item.date) {
                  item.date = new Date(item.date).toISOString().split("T")[0];
               }
               return item;
            });
         } else if (response.data && response.data.date) {
            response.data.date = new Date(response.data.date)
               .toISOString()
               .split("T")[0];
         }
         return response;
      } catch (err) {
         console.error("Error in response interceptor:", err);
         return response;
      }
   },
   (error) => {
      // Enhanced error logging
      console.error("API Error:", {
         url: error.config?.url,
         method: error.config?.method,
         status: error.response?.status,
         statusText: error.response?.statusText,
         data: error.response?.data,
         headers: error.config?.headers,
      });

      // For local development, don't show network error toasts
      if (isLocalDevelopment() && !error.response) {
         console.log("Network error in local development - suppressing error");
         return Promise.reject({
            message: "Local development mode - API server not detected",
            isLocalDevError: true,
            details: error.message,
         });
      }

      // Handle network errors
      if (!error.response) {
         return Promise.reject({
            message:
               "Network error. Please check your connection and ensure the backend server is running.",
            details: error.message,
         });
      }

      // Handle server errors
      return Promise.reject({
         status: error.response.status,
         message: error.response.data?.message || "An error occurred",
         details: error.response.data,
      });
   }
);

// Apply the same response interceptor to nextApiAxios
nextApiAxios.interceptors.response.use(
   axiosInstance.interceptors.response.handlers[0].fulfilled,
   axiosInstance.interceptors.response.handlers[0].rejected
);

export default axiosInstance;
