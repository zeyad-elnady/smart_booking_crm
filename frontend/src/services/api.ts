import axios, { AxiosError } from "axios";
import axiosInstance from "./axiosConfig";
import {
   Appointment,
   AppointmentData,
   AppointmentStatus,
} from "@/types/appointment";
import { indexedDBService } from "./indexedDB";
import { createCustomer } from "./customerService";

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

// Initialize local demo data
const initializeLocalData = () => {
   if (typeof window === 'undefined') return;
   
   try {
      // Remove mock data to ensure we use real data from the backend
      if (localStorage.getItem("mockCustomers")) {
         console.log("Removing mock customers from localStorage to use real backend data");
         localStorage.removeItem("mockCustomers");
      }
      
      // Always remove any mock appointments to prevent sample data issues
      if (localStorage.getItem("mockAppointments")) {
         console.log("Removing mock appointments from localStorage");
         localStorage.removeItem("mockAppointments");
      }
      
      // Always remove any mock services
      if (localStorage.getItem("mockServices")) {
         console.log("Removing mock services from localStorage");
         localStorage.removeItem("mockServices");
      }
      
      console.log("Local storage cleared to use real backend data");
   } catch (error) {
      console.error("Error clearing local mock data:", error);
   }
};

// Use the dynamic hostname for API configuration
const API_HOST = getApiHost();

// Initialize local data for development
initializeLocalData();

// Create an instance of axios with default config
const API = axios.create({
   baseURL: `http://${API_HOST}/api`,
   headers: {
      "Content-Type": "application/json",
   },
   timeout: 30000, // 30 seconds timeout
});

// Debug the API base URL at startup
console.log("API configured with baseURL:", API.defaults.baseURL);

// Also log environment variables if available
if (typeof window !== "undefined") {
   console.log("Running in browser environment");
   console.log("Window location:", window.location.origin);
   console.log("Using API host:", API_HOST);
}

// Add error type interface
interface ApiError extends Error {
   code?: string;
   response?: {
      data?: {
         message?: string;
      };
      status?: number;
   };
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
      } catch (initialError: unknown) {
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
      } catch (localhostError: unknown) {
         if (localhostError instanceof Error) {
            console.log("Localhost fallback failed:", localhostError.message);
         }
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
      } catch (ipError: unknown) {
         if (ipError instanceof Error) {
            console.log("IP fallback failed:", ipError.message);
         }
      }

      // If we get here, all attempts failed
      console.error("All API connection attempts failed");
      console.log("Please ensure the backend server is running on port 5000");
   } catch (error: unknown) {
      if (error instanceof Error) {
         console.error("API server connection FAILED:", error.message);
      }
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
   } catch (error: unknown) {
      console.error("API connection test failed:", error);

      let errorMessage = "Unknown connection error";

      if (error instanceof Error) {
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

      return {
         success: false,
         message: errorMessage,
         details: { error: "Unknown error occurred" },
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
   description?: string;
   duration: string;
   price: number | string;
   staffCount?: number | string; // Number of staff members who can provide this service
   isActive?: boolean;
   category?: string;
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
   address?: string;
   notes?: string;
}

export interface Customer extends CustomerData {
   _id: string;
   createdAt?: string;
   updatedAt?: string;
}

// Service API
export const serviceAPI = {
   getServices: async () => {
      console.log("Fetching services from API");
      
      try {
         // Try to fetch from the real API
         const response = await API.get("/services");
         return response.data;
      } catch (error) {
         console.error("API error fetching services:", error);
         
         // Return empty array if API fails
         return [];
      }
   },

   getServiceById: async (id: string) => {
      console.log(`Getting service with ID: ${id} from API`);
      
      try {
         // Try to fetch from the real API
         const response = await API.get(`/services/${id}`);
         return response.data;
      } catch (error) {
         console.error(`API error getting service ${id}:`, error);
         throw new Error(`Service with ID ${id} not found`);
      }
   },

   createService: async (serviceData: ServiceData) => {
      console.log("Creating service via API:", serviceData);
      
      try {
         // Try to create via real API
         const response = await API.post("/services", serviceData);
         return response.data;
      } catch (error) {
         console.error("API error creating service:", error);
         
         // Create a new service object for offline mode
         const newService: Service = {
            _id: `service_${Date.now()}`,
            ...serviceData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
         };
         
         return newService;
      }
   },

   updateService: async (id: string, serviceData: Partial<ServiceData>) => {
      console.log(`Updating service ${id} via API:`, serviceData);
      
      try {
         // Try to update via real API
         const response = await API.put(`/services/${id}`, serviceData);
         return response.data;
      } catch (error) {
         console.error(`API error updating service ${id}:`, error);
         throw error;
      }
   },

   deleteService: async (id: string) => {
      console.log(`Deleting service ${id} via API`);
      
      try {
         // Try to delete via real API
         const response = await API.delete(`/services/${id}`);
         return response.data;
      } catch (error) {
         console.error(`API error deleting service ${id}:`, error);
         throw error;
      }
   },
};

// Customer API
export const customerAPI = {
   getCustomers: async () => {
      console.log("Fetching customers from API");
      
      try {
         // Get customers from the API
         const response = await API.get<Customer[]>("/customers");
         console.log(`Retrieved ${response.data.length} customers from API`);
         return response.data;
      } catch (error) {
         console.error("Error retrieving customers from API:", error);
         
         // Return empty array if API fails
         console.log("API failed to retrieve customers, returning empty array");
         return [];
      }
   },

   getCustomerById: async (id: string) => {
      console.log(`[Customer API] Getting customer with ID: ${id} from API endpoint: ${API.defaults.baseURL}/customers/${id}`);
      
      try {
         // Get customer from the API
         const response = await API.get<Customer>(`/customers/${id}`);
         console.log("[Customer API] Customer retrieved from API - Status:", response.status);
         console.log("[Customer API] Customer data:", JSON.stringify(response.data, null, 2));
         return response.data;
      } catch (error) {
         console.error(`[Customer API] Error retrieving customer from API:`, error);
         
         // Try direct fetch as a fallback to diagnose potential Axios issues
         try {
            console.log(`[Customer API] Trying direct fetch as fallback...`);
            const apiUrl = `${API.defaults.baseURL}/customers/${id}`;
            console.log(`[Customer API] Fetching from: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
               throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("[Customer API] Direct fetch successful:", data);
            return data;
         } catch (fetchError) {
            console.error("[Customer API] Direct fetch also failed:", fetchError);
            throw new Error(`Customer with ID ${id} not found or server error`);
         }
      }
   },

   createCustomer: async (customerData: CustomerData) => {
      console.log("Creating customer:", customerData);
      
      try {
         // Call the backend API to create the customer
         const response = await API.post<Customer>("/customers", customerData);
         console.log('Customer created successfully:', response.data);
         return response.data;
      } catch (error) {
         console.error('Error creating customer via API:', error);
         
         // Fallback to local storage if API fails
         try {
            // Generate a unique ID for the customer
            const newCustomer = {
               ...customerData,
               _id: crypto.randomUUID(),
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString()
            };
            
            // Get existing customers from localStorage
            const existingCustomers = localStorage.getItem("mockCustomers");
            const customers = existingCustomers 
               ? JSON.parse(existingCustomers) 
               : [];
            
            // Check if email already exists
            if (customers.some((c: Customer) => c.email === customerData.email)) {
               throw new Error("Customer with this email already exists");
            }
            
            // Add new customer
            customers.push(newCustomer);
            
            // Save back to localStorage
            localStorage.setItem("mockCustomers", JSON.stringify(customers));
            
            console.log('Customer created in localStorage (fallback):', newCustomer);
            return newCustomer;
         } catch (localError) {
            console.error('Error creating customer in localStorage:', localError);
            throw localError;
         }
      }
   },

   updateCustomer: async (id: string, customerData: Partial<CustomerData>) => {
      console.log(`Updating customer ${id} via API:`, customerData);
      
      try {
         // Call the backend API to update the customer
         const response = await API.put<Customer>(
            `/customers/${id}`,
            customerData
         );
         
         console.log(`Customer updated successfully via API:`, response.data);
         return response.data;
      } catch (error) {
         console.error("Error updating customer via API:", error);
         throw error;
      }
   },

   deleteCustomer: async (id: string) => {
      console.log(`Deleting customer ${id}`);
      
      try {
         // Call the backend API to delete the customer
         const response = await API.delete(`/customers/${id}`);
         console.log("Customer deleted via API:", response.data);
         return response.data;
      } catch (error) {
         console.error("Error deleting customer via API:", error);
         
         // Fallback to localStorage if API fails
         const storedCustomers = localStorage.getItem("mockCustomers");
         if (!storedCustomers) {
            throw new Error("No customers found in localStorage");
         }
         
         try {
            const customers = JSON.parse(storedCustomers);
            const updatedCustomers = customers.filter((c: Customer) => c._id !== id);
            
            // Check if any customer was removed
            if (customers.length === updatedCustomers.length) {
               throw new Error(`Customer with ID ${id} not found`);
            }
            
            localStorage.setItem("mockCustomers", JSON.stringify(updatedCustomers));
            console.log(`Customer deleted from localStorage (fallback)`);
            
            return { success: true, message: "Customer deleted successfully" };
         } catch (localError) {
            console.error("Error deleting customer from localStorage:", localError);
            throw localError;
         }
      }
   }
};

// Appointment API
export const appointmentAPI = {
   getAppointments: async () => {
      try {
         console.log(`Fetching appointments from ${API.defaults.baseURL}/appointments`);
         const response = await API.get<Appointment[]>("/appointments");
         return response.data;
      } catch (error) {
         console.error("Error fetching appointments:", error);
         
         // Return empty array as fallback
         return [];
      }
   },

   getRecentAppointments: async () => {
      try {
         const response = await API.get<Appointment[]>("/appointments/recent");
         return response.data;
      } catch (error) {
         console.error("Error fetching recent appointments:", error);
         return [];
      }
   },

   getAppointmentById: async (id: string) => {
      try {
         const response = await API.get<Appointment>(`/appointments/${id}`);
         return response.data;
      } catch (error) {
         console.error(`Error fetching appointment ${id}:`, error);
         throw error;
      }
   },

   createAppointment: async (appointmentData: AppointmentData) => {
      try {
         // Log the data being sent
         console.log("Creating appointment with data:", appointmentData);

         // Format the data
         const formattedData = {
            ...appointmentData,
            date: new Date(appointmentData.date).toISOString(),
         };

         // Make the API call
         const response = await API.post<Appointment>(
            "/appointments",
            formattedData
         );

         // Log successful response
         console.log("Appointment created successfully:", response.data);

         return response.data;
      } catch (error) {
         console.error("Appointment creation failed:", error);
         throw error;
      }
   },

   updateAppointment: async (
      id: string,
      appointmentData: Partial<AppointmentData>
   ) => {
      try {
         const response = await API.put<Appointment>(
            `/appointments/${id}`,
            appointmentData
         );
         return response.data;
      } catch (error) {
         console.error("Error updating appointment:", error);
         throw error;
      }
   },

   deleteAppointment: async (id: string) => {
      try {
         const response = await API.delete(`/appointments/${id}`);
         return response.data;
      } catch (error) {
         console.error("Error deleting appointment:", error);
         throw error;
      }
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
         } catch (error: unknown) {
            if (error instanceof Error) {
               console.error(
                  "Cannot connect to backend server:",
                  error.message
               );
            }
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
      } catch (error: unknown) {
         console.error("Login error detail:", error);

         // Extract and enhance error message
         if (error instanceof Error) {
            if ((error as ApiError).code === "ECONNABORTED") {
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
   totalCustomers: number;
   averageRevenue: number;
   averageWaitTime: number;
   totalRevenue: number;
   completedAppointments: number;
   weeklyRevenue: number;
   monthlyRevenue: number;
}

// Dashboard API
export const dashboardAPI = {
   getStats: async (): Promise<DashboardStats> => {
      try {
         // Initialize the database connection
         await indexedDBService.initDB();
         
         // Fetch all customers, appointments, and services from IndexedDB
         const customers = await indexedDBService.getAllCustomers();
         const appointments = await indexedDBService.getAllAppointments();
         const services = await indexedDBService.getAllServices();
         
         // Calculate total customers
         const totalCustomers = customers.length;
         
         // Get today's date in yyyy-MM-dd format
         const today = new Date();
         const todayStr = today.toISOString().split('T')[0];
         
         // Filter appointments for today
         const appointmentsToday = appointments.filter(
            appointment => appointment.date === todayStr
         );
         
         // Get completed appointments for today
         const completedAppointments = appointmentsToday.filter(
            appointment => appointment.status === 'Completed'
         ).length;
         
         // Calculate total revenue based on completed appointments
         let totalRevenue = 0;
         appointmentsToday.forEach(appointment => {
            // Get the service price
            let price = 0;
            
            // If the appointment has serviceInfo with price
            if (appointment.serviceInfo && appointment.serviceInfo.price) {
               price = appointment.serviceInfo.price;
            } 
            // If the appointment has service ID, find the service and get price
            else if (typeof appointment.service === 'string') {
               const service = services.find(s => s._id === appointment.service);
               if (service) {
                  price = service.price;
               }
            }
            // If service is an object
            else if (appointment.service && typeof appointment.service === 'object') {
               price = (appointment.service as any).price || 0;
            }
            
            if (appointment.status === 'Completed') {
               totalRevenue += price;
            }
         });
         
         // Get the start of the current week (Monday)
         const startOfWeek = new Date(today);
         const day = startOfWeek.getDay();
         const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
         startOfWeek.setDate(diff);
         startOfWeek.setHours(0, 0, 0, 0);
         
         // Get the end of the current week (Sunday)
         const endOfWeek = new Date(startOfWeek);
         endOfWeek.setDate(endOfWeek.getDate() + 6);
         endOfWeek.setHours(23, 59, 59, 999);
         
         // Get the start of the current month
         const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
         
         // Get the end of the current month
         const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
         endOfMonth.setHours(23, 59, 59, 999);
         
         // Calculate weekly revenue
         let weeklyRevenue = 0;
         appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date);
            if (
               appointmentDate >= startOfWeek && 
               appointmentDate <= endOfWeek && 
               appointment.status === 'Completed'
            ) {
               // Get the service price
               let price = 0;
               
               // If the appointment has serviceInfo with price
               if (appointment.serviceInfo && appointment.serviceInfo.price) {
                  price = appointment.serviceInfo.price;
               } 
               // If the appointment has service ID, find the service and get price
               else if (typeof appointment.service === 'string') {
                  const service = services.find(s => s._id === appointment.service);
                  if (service) {
                     price = service.price;
                  }
               }
               // If service is an object
               else if (appointment.service && typeof appointment.service === 'object') {
                  price = (appointment.service as any).price || 0;
               }
               
               weeklyRevenue += price;
            }
         });
         
         // Calculate monthly revenue
         let monthlyRevenue = 0;
         appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date);
            if (
               appointmentDate >= startOfMonth && 
               appointmentDate <= endOfMonth && 
               appointment.status === 'Completed'
            ) {
               // Get the service price
               let price = 0;
               
               // If the appointment has serviceInfo with price
               if (appointment.serviceInfo && appointment.serviceInfo.price) {
                  price = appointment.serviceInfo.price;
               } 
               // If the appointment has service ID, find the service and get price
               else if (typeof appointment.service === 'string') {
                  const service = services.find(s => s._id === appointment.service);
                  if (service) {
                     price = service.price;
                  }
               }
               // If service is an object
               else if (appointment.service && typeof appointment.service === 'object') {
                  price = (appointment.service as any).price || 0;
               }
               
               monthlyRevenue += price;
            }
         });
         
         // Calculate average revenue per appointment (if there are completed appointments)
         const completedAppointmentsAll = appointments.filter(
            appointment => appointment.status === 'Completed'
         );
         
         let totalRevenueAll = 0;
         completedAppointmentsAll.forEach(appointment => {
            // Get the service price
            let price = 0;
            
            // If the appointment has serviceInfo with price
            if (appointment.serviceInfo && appointment.serviceInfo.price) {
               price = appointment.serviceInfo.price;
            } 
            // If the appointment has service ID, find the service and get price
            else if (typeof appointment.service === 'string') {
               const service = services.find(s => s._id === appointment.service);
               if (service) {
                  price = service.price;
               }
            }
            // If service is an object
            else if (appointment.service && typeof appointment.service === 'object') {
               price = (appointment.service as any).price || 0;
            }
            
            totalRevenueAll += price;
         });
         
         const averageRevenue = completedAppointmentsAll.length > 0 
            ? totalRevenueAll / completedAppointmentsAll.length 
            : 0;
         
         // Calculate average wait time (using service durations)
         let totalDuration = 0;
         let durationCount = 0;
         
         appointments.forEach(appointment => {
            let duration = 0;
            
            // If the appointment has a duration property
            if (appointment.duration) {
               duration = parseInt(appointment.duration, 10);
            }
            // If the appointment has serviceInfo with duration
            else if (appointment.serviceInfo && appointment.serviceInfo.duration) {
               duration = parseInt(appointment.serviceInfo.duration, 10);
            }
            // If the appointment has service ID, find the service and get duration
            else if (typeof appointment.service === 'string') {
               const service = services.find(s => s._id === appointment.service);
               if (service) {
                  duration = parseInt(service.duration, 10);
               }
            }
            // If service is an object
            else if (appointment.service && typeof appointment.service === 'object') {
               duration = parseInt((appointment.service as any).duration, 10) || 0;
            }
            
            if (duration > 0) {
               totalDuration += duration;
               durationCount++;
            }
         });
         
         const averageWaitTime = durationCount > 0 ? totalDuration / durationCount : 0;
         
         // Return the calculated statistics
         return {
            totalCustomers,
            completedAppointments,
            totalRevenue,
            weeklyRevenue,
            monthlyRevenue,
            averageRevenue,
            averageWaitTime
         };
      } catch (error) {
         console.error("Error calculating dashboard stats:", error);
         throw error;
      }
   },
};

export default API;

const handleAxiosError = (error: unknown) => {
   if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.data) {
         return new Error(JSON.stringify(axiosError.response.data));
      }
      return new Error(axiosError.message);
   }
   return error instanceof Error
      ? error
      : new Error("An unknown error occurred");
};

export const createAppointment = async (
   appointmentData: AppointmentData
): Promise<Appointment> => {
   try {
      const response = await axiosInstance.post<Appointment>(
         "/appointments",
         appointmentData
      );
      return response.data;
   } catch (error) {
      throw handleAxiosError(error);
   }
};

export const updateAppointment = async (
   id: string,
   appointment: Partial<Appointment>
): Promise<Appointment> => {
   try {
      const response = await axiosInstance.put(
         `/appointments/${id}`,
         appointment
      );
      return response.data;
   } catch (error) {
      throw error;
   }
};

export const deleteAppointment = async (id: string): Promise<void> => {
   try {
      await axiosInstance.delete(`/appointments/${id}`);
   } catch (error) {
      throw error;
   }
};

export const getAppointments = async (): Promise<Appointment[]> => {
   try {
      const response = await axiosInstance.get("/appointments");
      return response.data;
   } catch (error) {
      throw error;
   }
};

export const getAppointmentById = async (id: string): Promise<Appointment> => {
   try {
      const response = await axiosInstance.get(`/appointments/${id}`);
      return response.data;
   } catch (error) {
      throw error;
   }
};

export const testConnections = async () => {
   try {
      console.log("Testing API and database connections...");

      try {
         // Test basic API connection
         console.log("Testing basic API connection...");
         const baseResponse = await axiosInstance.get(
            "/services/test-connection"
         );
         console.log("Basic connection test successful:", baseResponse.data);

         try {
            // Test service creation with exact required fields
            const testService = {
               name: "Test Service",
               description: "Test service description",
               duration: "30",
               price: 50.0,
               category: "Test",
               isActive: true,
            };

            console.log("Creating test service with data:", testService);
            const createResponse = await axiosInstance.post(
               "/services",
               testService
            );
            console.log("Service creation successful:", createResponse.data);

            return {
               success: true,
               apiConnection: baseResponse.data,
               serviceCreation: createResponse.data,
            };
         } catch (serviceError: any) {
            console.error("Service creation failed:", {
               error: serviceError,
               response: serviceError.response?.data,
               data: serviceError.response?.data?.receivedData,
            });
            return {
               success: false,
               apiConnection: baseResponse.data,
               error:
                  serviceError.response?.data?.message ||
                  "Service creation failed",
               receivedData: serviceError.response?.data?.receivedData,
            };
         }
      } catch (apiError: any) {
         console.error("API connection test failed:", {
            error: apiError,
            response: apiError.response?.data,
         });
         return {
            success: false,
            error:
               apiError.response?.data?.message || "API connection test failed",
            status: apiError.response?.status,
            details: apiError.response?.data,
         };
      }
   } catch (error: any) {
      console.error("Connection test failed:", error);
      return {
         success: false,
         error: error.message || "Unknown error occurred",
      };
   }
};
