import axios from "axios";

// Determine the correct hostname for API calls
const getApiHost = () => {
   // Check for explicit API host environment variable
   if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_HOST) {
      return process.env.NEXT_PUBLIC_API_HOST;
   }

   // Use the same hostname as the browser, but with port 5000
   if (typeof window !== "undefined") {
      // For development on localhost, use explicit localhost
      if (
         window.location.hostname === "localhost" ||
         window.location.hostname === "127.0.0.1"
      ) {
         return "localhost:5000";
      }

      // For any other hostname, use that with port 5000
      return `${window.location.hostname}:5000`;
   }

   // Fallback for server-side rendering
   return "localhost:5000";
};

// Use the dynamic hostname for API configuration
const API_HOST = getApiHost();

// Create an instance of axios with default config
const API = axios.create({
   baseURL: `http://${API_HOST}/api`,
   headers: {
      "Content-Type": "application/json",
   },
   timeout: 10000, // 10 seconds timeout
});

// Debug the API base URL at startup
console.log("API configured with baseURL:", API.defaults.baseURL);

// Also log environment variables if available
if (typeof window !== "undefined") {
   console.log("Running in browser environment");
   console.log("Window location:", window.location.origin);
   console.log("Using API host:", API_HOST);
}

// Try to ping the API on startup
const pingAPI = async () => {
   try {
      console.log("Attempting to connect to API server...");
      const baseUrl = `http://${API_HOST}`;
      console.log("Connecting to:", baseUrl);

      // First try the dynamic host
      try {
         const response = await fetch(baseUrl, {
            mode: "cors",
            credentials: "omit",
            signal: AbortSignal.timeout(3000),
         });

         if (response.ok) {
            console.log("API server connection: SUCCESS");
            return; // Success, exit the function
         }
      } catch (initialError) {
         console.log(
            "Initial connection attempt failed, trying fallback options..."
         );
      }

      // If dynamic host fails, try explicit localhost
      try {
         const localhostUrl = "http://localhost:5000";
         console.log("Trying localhost fallback:", localhostUrl);

         const localhostResponse = await fetch(localhostUrl, {
            mode: "cors",
            credentials: "omit",
            signal: AbortSignal.timeout(3000),
         });

         if (localhostResponse.ok) {
            console.log("API server connection via localhost: SUCCESS");
            return;
         }
      } catch (localhostError) {
         console.log("Localhost fallback failed:", localhostError.message);
      }

      // If everything fails, try IP address 127.0.0.1
      try {
         const loopbackUrl = "http://127.0.0.1:5000";
         console.log("Trying IP fallback:", loopbackUrl);

         const ipResponse = await fetch(loopbackUrl, {
            mode: "cors",
            credentials: "omit",
            signal: AbortSignal.timeout(3000),
         });

         if (ipResponse.ok) {
            console.log("API server connection via IP: SUCCESS");
            return;
         }
      } catch (ipError) {
         console.log("IP fallback failed:", ipError.message);
      }

      // If we get here, all attempts failed
      console.error("All API connection attempts failed");
      console.log("Please ensure the backend server is running on port 5000");
   } catch (error) {
      console.error("API server connection FAILED:", error.message);
      console.log("Please ensure the backend server is running on port 5000");
   }
};

// Execute the ping
pingAPI();

// Add a function to test API connection that can be called from components
export const testAPIConnection = async (): Promise<{
   success: boolean;
   message: string;
   details?: any;
}> => {
   try {
      const baseUrl = `http://${API_HOST}`;
      console.log("Testing API connection to:", baseUrl);

      // Test main endpoint
      const response = await fetch(baseUrl, {
         mode: "cors",
         credentials: "omit",
         signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
         return {
            success: false,
            message: `API server returned error status: ${response.status} ${response.statusText}`,
         };
      }

      // Test appointments endpoint
      const appointmentsUrl = `${baseUrl}/api/appointments/recent`;
      console.log("Testing appointments endpoint:", appointmentsUrl);

      const appointmentsResponse = await fetch(appointmentsUrl, {
         mode: "cors",
         credentials: "omit",
         signal: AbortSignal.timeout(5000),
      });

      if (!appointmentsResponse.ok) {
         return {
            success: false,
            message: `Appointments API returned error status: ${appointmentsResponse.status} ${appointmentsResponse.statusText}`,
         };
      }

      const appointmentsData = await appointmentsResponse.json();

      return {
         success: true,
         message:
            "API connection successful. All endpoints are working properly.",
         details: {
            baseUrl,
            appointments: appointmentsData.slice(0, 2), // Just return first 2 for brevity
         },
      };
   } catch (error) {
      console.error("API connection test failed:", error);

      let errorMessage = "Unknown connection error";

      if (error.name === "AbortError") {
         errorMessage = "Connection timed out after 5 seconds";
      } else if (error.message.includes("Failed to fetch")) {
         errorMessage = "Network error - server may be down or CORS issue";
      } else if (error.message.includes("NetworkError")) {
         errorMessage = "Network error - check if server is running";
      } else {
         errorMessage = `Error: ${error.message}`;
      }

      return {
         success: false,
         message: errorMessage,
         details: { error: error.message },
      };
   }
};

// Add a function to set cookie
const setCookie = (name: string, value: string, days: number = 30) => {
   if (typeof document !== "undefined") {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
   }
};

// Add a function to delete cookie
const deleteCookie = (name: string) => {
   if (typeof document !== "undefined") {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
   }
};

// Add a function to check if a cookie exists
const hasCookie = (name: string): boolean => {
   if (typeof document !== "undefined") {
      return document.cookie
         .split(";")
         .some((c) => c.trim().startsWith(`${name}=`));
   }
   return false;
};

// Add a request interceptor to inject the JWT token into requests
API.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem("token");
      if (token) {
         console.log(
            "Adding auth token to request:",
            token.substring(0, 10) + "..."
         );
         config.headers.Authorization = `Bearer ${token}`;
      } else {
         console.log("No auth token found for request");
      }

      // Add additional logging for request debugging
      console.log(`API Request to: ${config.url}`, config.data);

      return config;
   },
   (error) => {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
   }
);

// Add response interceptor for debugging
API.interceptors.response.use(
   (response) => {
      console.log(
         `API Response [${response.config.method?.toUpperCase()}] ${
            response.config.url
         }: Status ${response.status}`
      );
      return response;
   },
   (error) => {
      if (error.response) {
         console.error(
            `API Error [${error.config?.method?.toUpperCase()}] ${
               error.config?.url
            }: Status ${error.response.status}`,
            error.response.data
         );
      } else if (error.request) {
         console.error("API Error: No response received", error.request);
         // Add detailed error info
         if (error.code === "ECONNABORTED") {
            console.error(
               "Request timeout. Check server performance or increase timeout duration."
            );
         } else if (typeof window !== "undefined") {
            console.error(
               "Network state:",
               navigator.onLine ? "Online" : "Offline"
            );
         }
      } else {
         console.error("API Error:", error.message);
      }
      return Promise.reject(error);
   }
);

// Service types
export interface ServiceData {
   name: string;
   description: string;
   duration: string;
   price: string;
   category: string;
   isActive: boolean;
}

export interface Service extends ServiceData {
   _id: string;
   createdAt?: string;
   updatedAt?: string;
}

// Customer types
export interface CustomerData {
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
   notes?: string;
}

export interface Customer extends CustomerData {
   _id: string;
   createdAt?: string;
   updatedAt?: string;
}

// Appointment types
export interface AppointmentData {
   customer: string;
   service: string;
   date: string;
   time: string;
   duration: string;
   notes?: string;
   status?: "Pending" | "Confirmed" | "Cancelled" | "Completed";
}

export interface Appointment
   extends Omit<AppointmentData, "customer" | "service"> {
   _id: string;
   customer: Customer | string;
   service: Service | string;
   createdAt?: string;
   updatedAt?: string;
}

// Service API
export const serviceAPI = {
   getServices: async () => {
      const response = await API.get<Service[]>("/services");
      return response.data;
   },

   getServiceById: async (id: string) => {
      const response = await API.get<Service>(`/services/${id}`);
      return response.data;
   },

   createService: async (serviceData: ServiceData) => {
      const response = await API.post<Service>("/services", serviceData);
      return response.data;
   },

   updateService: async (id: string, serviceData: Partial<ServiceData>) => {
      const response = await API.put<Service>(`/services/${id}`, serviceData);
      return response.data;
   },

   deleteService: async (id: string) => {
      const response = await API.delete(`/services/${id}`);
      return response.data;
   },
};

// Customer API
export const customerAPI = {
   getCustomers: async () => {
      try {
         console.log(
            `Fetching customers from ${API.defaults.baseURL}/customers`
         );
         const response = await API.get("/customers");
         return response.data;
      } catch (error) {
         console.error("Error fetching customers:", error);

         // If API call fails, try to get from localStorage
         const mockCustomers = localStorage.getItem("mockCustomers");
         if (mockCustomers) {
            console.log("Using mock customer data from localStorage");
            return JSON.parse(mockCustomers);
         }

         throw error;
      }
   },

   getCustomerById: async (id) => {
      try {
         console.log(
            `Fetching customer with ID ${id} from ${API.defaults.baseURL}/customers/${id}`
         );
         const response = await API.get(`/customers/${id}`);
         return response.data;
      } catch (error) {
         console.error(`Error fetching customer ${id}:`, error);

         // If API call fails, try to get from localStorage
         const mockCustomers = localStorage.getItem("mockCustomers");
         if (mockCustomers) {
            console.log("Using mock customer data from localStorage");
            const customers = JSON.parse(mockCustomers);
            const customer = customers.find((c) => c._id === id);
            if (customer) {
               return customer;
            }
         }

         throw error;
      }
   },

   createCustomer: async (data) => {
      try {
         const response = await API.post("/customers", data);

         // Update local storage
         try {
            const mockCustomers = localStorage.getItem("mockCustomers");
            if (mockCustomers) {
               const customers = JSON.parse(mockCustomers);
               customers.push({
                  ...response.data,
                  _id: response.data._id || `mock_${Date.now()}`,
                  createdAt: new Date().toISOString(),
               });
               localStorage.setItem("mockCustomers", JSON.stringify(customers));
            }
         } catch (e) {
            console.error("Error updating local storage:", e);
         }

         return response.data;
      } catch (error) {
         console.error("Error creating customer:", error);

         // If API call fails, save to localStorage
         try {
            const newCustomer = {
               ...data,
               _id: `mock_${Date.now()}`,
               createdAt: new Date().toISOString(),
            };

            const mockCustomers = localStorage.getItem("mockCustomers");
            if (mockCustomers) {
               const customers = JSON.parse(mockCustomers);
               customers.push(newCustomer);
               localStorage.setItem("mockCustomers", JSON.stringify(customers));
            } else {
               localStorage.setItem(
                  "mockCustomers",
                  JSON.stringify([newCustomer])
               );
            }

            return newCustomer;
         } catch (e) {
            console.error("Error saving to localStorage:", e);
            throw error;
         }
      }
   },

   updateCustomer: async (id, data) => {
      try {
         const response = await API.put(`/customers/${id}`, data);

         // Update local storage
         try {
            const mockCustomers = localStorage.getItem("mockCustomers");
            if (mockCustomers) {
               const customers = JSON.parse(mockCustomers);
               const index = customers.findIndex((c) => c._id === id);
               if (index !== -1) {
                  customers[index] = {
                     ...customers[index],
                     ...data,
                     updatedAt: new Date().toISOString(),
                  };
                  localStorage.setItem(
                     "mockCustomers",
                     JSON.stringify(customers)
                  );
               }
            }
         } catch (e) {
            console.error("Error updating local storage:", e);
         }

         return response.data;
      } catch (error) {
         console.error(`Error updating customer ${id}:`, error);

         // If API call fails, update localStorage
         try {
            const mockCustomers = localStorage.getItem("mockCustomers");
            if (mockCustomers) {
               const customers = JSON.parse(mockCustomers);
               const index = customers.findIndex((c) => c._id === id);
               if (index !== -1) {
                  customers[index] = {
                     ...customers[index],
                     ...data,
                     updatedAt: new Date().toISOString(),
                  };
                  localStorage.setItem(
                     "mockCustomers",
                     JSON.stringify(customers)
                  );
                  return customers[index];
               }
            }
            throw new Error("Customer not found in mock data");
         } catch (e) {
            console.error("Error updating localStorage:", e);
            throw error;
         }
      }
   },

   deleteCustomer: async (id: string) => {
      const response = await API.delete(`/customers/${id}`);
      return response.data;
   },
};

// Appointment API
export const appointmentAPI = {
   getAppointments: async () => {
      const response = await API.get<Appointment[]>("/appointments");
      return response.data;
   },

   getAppointmentById: async (id: string) => {
      const response = await API.get<Appointment>(`/appointments/${id}`);
      return response.data;
   },

   getRecentAppointments: async (limit = 3) => {
      try {
         const response = await API.get(`/appointments/recent?limit=${limit}`);
         return response.data;
      } catch (error) {
         console.error("Error fetching recent appointments:", error);
         // Return mock data if API fails
         return [
            {
               _id: "1",
               customer: "John Doe",
               service: "Haircut",
               time: "10:00 AM",
               status: "Confirmed",
            },
            {
               _id: "2",
               customer: "Jane Smith",
               service: "Manicure",
               time: "11:30 AM",
               status: "Pending",
            },
            {
               _id: "3",
               customer: "Mike Johnson",
               service: "Massage",
               time: "2:00 PM",
               status: "Confirmed",
            },
         ];
      }
   },

   createAppointment: async (appointmentData: AppointmentData) => {
      const response = await API.post<Appointment>(
         "/appointments",
         appointmentData
      );
      return response.data;
   },

   updateAppointment: async (
      id: string,
      appointmentData: Partial<AppointmentData>
   ) => {
      const response = await API.put<Appointment>(
         `/appointments/${id}`,
         appointmentData
      );
      return response.data;
   },

   deleteAppointment: async (id: string) => {
      const response = await API.delete(`/appointments/${id}`);
      return response.data;
   },
};

// Auth types
export interface UserData {
   name: string;
   email: string;
   password: string;
   businessName?: string;
   businessType?: string;
}

export interface User {
   _id: string;
   name: string;
   email: string;
   role: "admin" | "user";
   businessName?: string;
   businessType?: string;
   token?: string;
}

export interface LoginCredentials {
   email: string;
   password: string;
}

// Authentication API
export const authAPI = {
   register: async (userData: UserData) => {
      console.log("Registering user:", userData.email);
      const response = await API.post<User>("/users", userData);
      if (response.data.token) {
         console.log("Registration successful, storing token");
         localStorage.setItem("token", response.data.token);
         localStorage.setItem("user", JSON.stringify(response.data));
         setCookie("token", response.data.token);
      }
      return response.data;
   },

   login: async (credentials: LoginCredentials) => {
      console.log("Logging in user:", credentials.email);

      try {
         // First, test if the server is accessible
         try {
            const pingResponse = await fetch(`http://${API_HOST}`);
            if (!pingResponse.ok) {
               console.error(
                  "Backend server responded with error:",
                  pingResponse.status
               );
               throw new Error(`Backend server error: ${pingResponse.status}`);
            }
         } catch (error) {
            console.error("Cannot connect to backend server:", error.message);
            throw new Error(
               "Cannot connect to server. Please make sure the backend is running."
            );
         }

         // Now attempt the actual login
         const response = await API.post<User>("/users/login", credentials);

         if (response.data.token) {
            console.log("Login successful, storing token");
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data));
            setCookie("token", response.data.token);
         }
         return response.data;
      } catch (error) {
         console.error("Login error detail:", error);

         // Extract and enhance error message
         if (error.code === "ECONNABORTED") {
            throw new Error(
               "Connection timeout. Server may be down or overloaded."
            );
         } else if (
            error.message.includes("Network Error") ||
            error.message.includes("connect")
         ) {
            throw new Error(
               "Network error. Please check if backend server is running."
            );
         }

         throw error; // Re-throw for handling in the component
      }
   },

   logout: () => {
      console.log("Logging out user");

      // Clear localStorage tokens
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Clear cookies
      deleteCookie("token");

      // For robust cookie deletion, also set an expired cookie with path
      if (typeof document !== "undefined") {
         document.cookie =
            "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
      }

      // Remove Authorization header if it was set
      if (API.defaults.headers.common["Authorization"]) {
         delete API.defaults.headers.common["Authorization"];
      }
   },

   getCurrentUser: () => {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      console.log("Getting current user, token exists:", !!token);

      // If user exists in localStorage but not in cookies, sync them
      if (user && !hasCookie("token")) {
         console.log("User in localStorage but not in cookies, syncing");
         const userData = JSON.parse(user) as User;
         if (userData.token) {
            setCookie("token", userData.token);
         } else {
            // If token is missing, clear localStorage
            console.log("Token missing in user data, clearing local storage");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            return null;
         }
      }
      // If no user in localStorage but token exists in cookies, clear cookies
      if (!user && hasCookie("token")) {
         console.log(
            "No user in localStorage but token in cookies, clearing cookies"
         );
         deleteCookie("token");
         return null;
      }
      return user ? (JSON.parse(user) as User) : null;
   },

   getProfile: async () => {
      const response = await API.get<User>("/users/profile");
      return response.data;
   },

   updateProfile: async (profileData: Partial<Omit<UserData, "email">>) => {
      const response = await API.put<User>("/users/profile", profileData);
      if (response.data) {
         localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
   },
};

// Dashboard statistics interface
export interface DashboardStats {
   appointmentsToday: number;
   totalCustomers: number;
   revenueToday: number;
   averageWaitTime: number;
}

// Dashboard API
export const dashboardAPI = {
   getStats: async (): Promise<DashboardStats> => {
      try {
         // Get current mock customer count from localStorage
         let totalCustomers = 0;
         try {
            const storedMockCustomers = localStorage.getItem("mockCustomers");
            if (storedMockCustomers) {
               const customers = JSON.parse(storedMockCustomers);
               totalCustomers = customers.length;
            }
         } catch (e) {
            console.error("Error getting mock customer count:", e);
         }

         // Check if we have stored mock stats in localStorage
         const storedMockStats = localStorage.getItem("mockDashboardStats");
         if (storedMockStats) {
            console.log("Using stored mock dashboard stats from localStorage");
            // Update the customer count to reflect the current localStorage
            const stats = JSON.parse(storedMockStats);
            stats.totalCustomers = totalCustomers; // Always update with current count
            localStorage.setItem("mockDashboardStats", JSON.stringify(stats));
            return stats;
         }

         // Try to get real data from API
         try {
            const response = await API.get<DashboardStats>("/dashboard/stats");
            return response.data;
         } catch (apiError) {
            console.error("Error fetching dashboard stats from API:", apiError);

            // Create new mock stats with accurate customer count
            const mockStats: DashboardStats = {
               appointmentsToday: Math.floor(Math.random() * 5),
               totalCustomers: totalCustomers,
               revenueToday: Math.floor(Math.random() * 300) + 50,
               averageWaitTime: Math.floor(Math.random() * 15) + 5,
            };

            // Store mock stats for later use
            localStorage.setItem(
               "mockDashboardStats",
               JSON.stringify(mockStats)
            );

            return mockStats;
         }
      } catch (error) {
         console.error("Error in getStats:", error);

         // Final fallback
         return {
            appointmentsToday: 0,
            totalCustomers: 0,
            revenueToday: 0,
            averageWaitTime: 0,
         };
      }
   },

   refreshStats: async (): Promise<DashboardStats> => {
      try {
         // For mock data, count customers from localStorage
         const storedMockCustomers = localStorage.getItem("mockCustomers");
         if (storedMockCustomers) {
            const customers = JSON.parse(storedMockCustomers);

            // Create refreshed mock stats
            const mockStats: DashboardStats = {
               appointmentsToday: Math.floor(Math.random() * 5),
               totalCustomers: customers.length,
               revenueToday: Math.floor(Math.random() * 300) + 50,
               averageWaitTime: Math.floor(Math.random() * 15) + 5,
            };

            // Store updated stats
            localStorage.setItem(
               "mockDashboardStats",
               JSON.stringify(mockStats)
            );
            console.log(
               "Refreshed mock dashboard stats based on customer count:",
               mockStats
            );
            return mockStats;
         }

         const response = await API.get<DashboardStats>(
            "/dashboard/stats?refresh=true"
         );
         return response.data;
      } catch (error) {
         console.error("Error refreshing dashboard stats:", error);
         // Return mock data if API fails (fallback for development)
         return {
            appointmentsToday: Math.floor(Math.random() * 5),
            totalCustomers: 0,
            revenueToday: Math.floor(Math.random() * 300) + 50,
            averageWaitTime: Math.floor(Math.random() * 15) + 5,
         };
      }
   },
};

export default API;
