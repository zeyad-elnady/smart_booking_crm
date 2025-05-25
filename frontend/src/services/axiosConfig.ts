import axios from "axios";
import { toast } from 'react-hot-toast';
import { indexedDBService } from './indexedDB';

// Helper function to get the API URL
const getApiUrl = () => {
   const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:12345/api";
   console.log("Using API URL:", url);
   return url;
};

// Check if we're in a localhost/development environment
const isLocalDevelopment = () => {
   if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname.includes('192.168.') || 
         window.location.hostname.includes('.local') ||
         process.env.NODE_ENV === 'development';
   }
   return process.env.NODE_ENV === 'development';
};

// Create axios instance for API calls
const axiosInstance = axios.create({
   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12345',
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json'
   }
});

// Create axios instance for Next.js API routes
const nextApiAxios = axios.create({
   baseURL: '/api',
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json'
   }
});

// Add request interceptor
axiosInstance.interceptors.request.use(
   async (config) => {
      // Check if we're in local development mode and should skip API calls
      const isDevMode = isLocalDevelopment();
      
      if (isDevMode && config.method?.toLowerCase() !== 'get') {
         console.log('In local development mode - skipping API call to:', config.url);
         
         // For non-GET requests in dev mode, create a simulated response
         const mockResponse = {
            data: { 
               success: true, 
               message: 'Using local data in development mode',
               localDevelopmentMode: true
            },
            status: 200,
            statusText: 'OK (Dev Mode)',
            headers: {},
            config,
         };
         return Promise.resolve(mockResponse);
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add data cache headers for GET requests
      if (config.method?.toLowerCase() === 'get') {
         // Add cache control headers to improve offline support
         config.headers['Cache-Control'] = 'max-age=3600'; // Cache for 1 hour
         config.headers['Pragma'] = 'no-cache';
      }
      
      // Check if we're offline and cache the request for later
      if (!navigator.onLine && config.method?.toLowerCase() !== 'get') {
         try {
            // Initialize IndexedDB
            await indexedDBService.initDB();
            
            // Store outgoing request in IndexedDB for later sync
            const requestData = {
               url: config.url,
               method: config.method,
               data: config.data,
               headers: config.headers,
               timestamp: new Date().toISOString()
            };
            
            // Add to pending requests store
            await indexedDBService.saveSetting(`pending_request_${Date.now()}`, JSON.stringify(requestData));
            
            // Show offline notification
            toast.success('Request saved for later sync when online');
            
            // For non-GET requests in offline mode, create a simulated response
            if (config.method?.toLowerCase() !== 'get') {
               const mockResponse = {
                  data: { 
                     success: true, 
                     message: 'This operation will be synced when connection is restored',
                     offlineMode: true
                  },
                  status: 200,
                  statusText: 'OK (Offline)',
                  headers: {},
                  config,
               };
               return Promise.resolve(mockResponse);
            }
         } catch (error) {
            console.error('Failed to cache request for offline sync:', error);
         }
      }
      
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Add response interceptor
const responseInterceptor = axiosInstance.interceptors.response.use(
   async (response) => {
      // Cache important data for offline access
      try {
         if (response.config.method?.toLowerCase() === 'get') {
            await indexedDBService.initDB();
            
            // Cache settings data
            if (response.config.url?.includes('/settings')) {
               await indexedDBService.saveSetting('settings_cache', JSON.stringify({
                  data: response.data,
                  timestamp: new Date().toISOString()
               }));
            }
            
            // Cache appointments data
            if (response.config.url?.includes('/appointments')) {
               await indexedDBService.saveSetting('appointments_cache', JSON.stringify({
                  data: response.data,
                  timestamp: new Date().toISOString()
               }));
            }
            
            // Cache customers data
            if (response.config.url?.includes('/customers')) {
               await indexedDBService.saveSetting('customers_cache', JSON.stringify({
                  data: response.data,
                  timestamp: new Date().toISOString()
               }));
            }
            
            // Cache services data
            if (response.config.url?.includes('/services')) {
               await indexedDBService.saveSetting('services_cache', JSON.stringify({
                  data: response.data,
                  timestamp: new Date().toISOString()
               }));
            }
         }
      } catch (error) {
         console.error('Failed to cache response data:', error);
      }
      
      return response;
   },
   async (error) => {
      // If we're in development mode, prioritize cached data and don't show network errors
      const isDevMode = isLocalDevelopment();
      
      // For network errors or in development mode
      if (!error.response || isDevMode) {
         // Get requests - try to use cached data
         if (error.config.method?.toLowerCase() === 'get') {
            try {
               await indexedDBService.initDB();
               
               // Look up cached data based on URL pattern
               let cacheKey = null;
               
               if (error.config.url?.includes('/settings')) {
                  cacheKey = 'settings_cache';
               } else if (error.config.url?.includes('/appointments')) {
                  cacheKey = 'appointments_cache';
               } else if (error.config.url?.includes('/customers')) {
                  cacheKey = 'customers_cache';
               } else if (error.config.url?.includes('/services')) {
                  cacheKey = 'services_cache';
               }
               
               if (cacheKey) {
                  const cachedJson = await indexedDBService.getSetting(cacheKey);
                  if (cachedJson) {
                     const cached = JSON.parse(cachedJson);
                     
                     // Create a simulated response from the cached data
                     const cachedResponse = {
                        data: cached.data,
                        status: 200,
                        statusText: isDevMode ? 'OK (Local Dev)' : 'OK (Cached)',
                        headers: {},
                        config: error.config,
                        cached: true,
                        timestamp: cached.timestamp
                     };
                     
                     if (!isDevMode) {
                        toast.info('Using cached data (offline mode)');
                     }
                     return cachedResponse;
                  }
               }
            } catch (cacheError) {
               console.error('Failed to retrieve cached data:', cacheError);
            }
         }
         
         // If cache retrieval failed or not applicable
         if (isDevMode) {
            console.log('Working in local development mode - API not connected');
            
            // Create empty mock responses based on URL
            if (error.config.url?.includes('/settings/business')) {
               return {
                  data: { message: 'Using default business settings in local mode' },
                  status: 200,
                  statusText: 'OK (Local Dev)',
                  headers: {},
                  config: error.config
               };
            }
            
            // Return empty arrays for collection endpoints
            if (error.config.url?.includes('/appointments') || 
                error.config.url?.includes('/customers') || 
                error.config.url?.includes('/services')) {
               return {
                  data: [],
                  status: 200,
                  statusText: 'OK (Local Dev)',
                  headers: {},
                  config: error.config
               };
            }
            
            // Generic success response for any other endpoint
            return {
               data: { success: true, message: 'Operation successful in local dev mode' },
               status: 200,
               statusText: 'OK (Local Dev)',
               headers: {},
               config: error.config
            };
         } else {
            toast.error('Network error. Working in offline mode.');
         }
         
         return Promise.reject(error);
      }
      
      if (error.response.status === 401) {
         // Unauthorized - clear token and redirect to login
         localStorage.removeItem('token');
         window.location.href = '/login';
      }
      
      return Promise.reject(error);
   }
);

// Apply the same response interceptor to nextApiAxios
nextApiAxios.interceptors.response.use(
   (response) => response,
   async (error) => {
      const isDevMode = isLocalDevelopment();
      
      if (!error.response || isDevMode) {
         if (isDevMode) {
            console.log('Working in local development mode - internal API not connected');
            
            // Return a mock success response
            return {
               data: { success: true, message: 'Operation successful in local dev mode' },
               status: 200,
               statusText: 'OK (Local Dev)'
            };
         } else {
            toast.error('Network error. Working in offline mode.');
         }
         return Promise.reject(error);
      }
      
      if (error.response.status === 401) {
         localStorage.removeItem('token');
         window.location.href = '/login';
      }
      
      return Promise.reject(error);
   }
);

// Function to check pending offline requests and sync them
export const syncOfflineRequests = async () => {
   // Skip sync in development mode
   if (isLocalDevelopment()) {
      console.log('Skipping sync in local development mode');
      return;
   }
   
   if (navigator.onLine) {
      try {
         await indexedDBService.initDB();
         const allSettings = await indexedDBService.getAllFromStore('settings');
         
         // Find all pending requests
         const pendingRequests = allSettings.filter(item => 
            item.key.startsWith('pending_request_')
         );
         
         if (pendingRequests.length > 0) {
            toast.info(`Syncing ${pendingRequests.length} pending requests...`);
            
            for (const request of pendingRequests) {
               try {
                  const requestData = JSON.parse(request.value);
                  
                  // Send the cached request
                  await axios({
                     method: requestData.method,
                     url: requestData.url,
                     data: requestData.data,
                     headers: requestData.headers
                  });
                  
                  // Delete the pending request after successful sync
                  await indexedDBService.deleteFromStore('settings', request.key);
               } catch (requestError) {
                  console.error('Failed to sync request:', requestError);
               }
            }
            
            toast.success('Sync completed');
         }
      } catch (error) {
         console.error('Error during sync of offline requests:', error);
         toast.error('Failed to sync offline changes');
      }
   }
};

// Register an online event listener to sync when connection is restored
if (typeof window !== 'undefined') {
   window.addEventListener('online', () => {
      // Skip toast in development mode
      if (!isLocalDevelopment()) {
         toast.success('Connection restored');
         syncOfflineRequests();
      }
   });
}

export { axiosInstance as default, nextApiAxios };
