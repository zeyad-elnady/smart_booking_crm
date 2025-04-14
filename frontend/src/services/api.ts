import axios from 'axios';

// Create an instance of axios with default config
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout but remove withCredentials which could cause CORS issues
  timeout: 10000, // 10 seconds timeout
});

// Debug the API base URL at startup
console.log('API configured with baseURL:', API.defaults.baseURL);

// Try to ping the API on startup
const pingAPI = async () => {
  try {
    console.log('Attempting to connect to API server...');
    const response = await fetch('http://localhost:5000', { 
      mode: 'cors',
      credentials: 'omit'  // Avoid CORS issues
    });
    console.log('API server connection:', response.ok ? 'SUCCESS' : 'FAILED', 'Status:', response.status);
  } catch (error) {
    console.error('API server connection FAILED:', error.message);
    console.log('Please ensure the backend server is running on port 5000');
  }
};

// Execute the ping
pingAPI();

// Add a function to set cookie
const setCookie = (name: string, value: string, days: number = 30) => {
  if (typeof document !== 'undefined') {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
  }
};

// Add a function to delete cookie
const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
  }
};

// Add a function to check if a cookie exists
const hasCookie = (name: string): boolean => {
  if (typeof document !== 'undefined') {
    return document.cookie.split(';').some(c => c.trim().startsWith(`${name}=`));
  }
  return false;
};

// Add a request interceptor to inject the JWT token into requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Adding auth token to request:', token.substring(0, 10) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No auth token found for request');
    }
    
    // Add additional logging for request debugging
    console.log(`API Request to: ${config.url}`, config.data);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
API.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}: Status ${error.response.status}`, 
        error.response.data);
    } else if (error.request) {
      console.error('API Error: No response received', error.request);
      // Add detailed error info
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout. Check server performance or increase timeout duration.');
      } else if (typeof window !== 'undefined') {
        console.error('Network state:', navigator.onLine ? 'Online' : 'Offline');
      }
    } else {
      console.error('API Error:', error.message);
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
  status?: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
}

export interface Appointment extends Omit<AppointmentData, 'customer' | 'service'> {
  _id: string;
  customer: Customer | string;
  service: Service | string;
  createdAt?: string;
  updatedAt?: string;
}

// Service API
export const serviceAPI = {
  getServices: async () => {
    const response = await API.get<Service[]>('/services');
    return response.data;
  },

  getServiceById: async (id: string) => {
    const response = await API.get<Service>(`/services/${id}`);
    return response.data;
  },

  createService: async (serviceData: ServiceData) => {
    const response = await API.post<Service>('/services', serviceData);
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
      // First check if we have stored mock customers in localStorage
      const storedMockCustomers = localStorage.getItem('mockCustomers');
      if (storedMockCustomers) {
        console.log('Using stored mock customers from localStorage');
        return JSON.parse(storedMockCustomers);
      }
      
      const response = await API.get<Customer[]>('/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Return mock data if API fails
      const storedMockCustomers = localStorage.getItem('mockCustomers');
      if (storedMockCustomers) {
        return JSON.parse(storedMockCustomers);
      }
      
      // Fallback mock data
      const defaultMockCustomers = [
        { 
          _id: '1', 
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          notes: 'Mock customer data (server unavailable)'
        },
        { 
          _id: '2', 
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '555-987-6543',
          notes: 'Mock customer data (server unavailable)'
        }
      ];
      
      // Store default mocks in localStorage
      localStorage.setItem('mockCustomers', JSON.stringify(defaultMockCustomers));
      return defaultMockCustomers;
    }
  },

  getCustomerById: async (id: string) => {
    const response = await API.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (customerData: CustomerData) => {
    try {
      // For development, enable an option to use mock data only
      const useMockDataOnly = false; // Set to false to use the real backend API
      
      if (useMockDataOnly) {
        console.log('Using mock data mode for customer creation');
        // Create a mock customer with unique ID
        const mockCustomer: Customer = {
          _id: 'mock_' + Date.now(),
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          notes: customerData.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Persist the mock customer in localStorage
        const existingMockCustomers = localStorage.getItem('mockCustomers');
        const mockCustomers = existingMockCustomers 
          ? [...JSON.parse(existingMockCustomers), mockCustomer] 
          : [mockCustomer];
        
        localStorage.setItem('mockCustomers', JSON.stringify(mockCustomers));
        
        // Update dashboard stats to reflect new customer count
        try {
          const dashboardStats = localStorage.getItem('mockDashboardStats');
          if (dashboardStats) {
            const stats = JSON.parse(dashboardStats);
            stats.totalCustomers = (stats.totalCustomers || 0) + 1;
            localStorage.setItem('mockDashboardStats', JSON.stringify(stats));
          }
        } catch (e) {
          console.error('Error updating dashboard stats:', e);
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Mock customer created and saved:', mockCustomer);
        return mockCustomer;
      }
      
      // If not using mock data, proceed with normal flow
      // First, test if the server is accessible
      try {
        const pingResponse = await fetch('http://localhost:5000', {
          mode: 'cors',
          credentials: 'omit',
          // Add a small timeout to detect slow responses
          signal: AbortSignal.timeout(3000)
        });
        if (!pingResponse.ok) {
          console.error('Backend server responded with error:', pingResponse.status);
          throw new Error(`Backend server error: ${pingResponse.status}`);
        }
      } catch (error) {
        console.error('Cannot connect to backend server:', error.message);
        // Fall back to mock data in development mode
        if (process.env.NODE_ENV !== 'production') {
          console.log('Falling back to mock data due to server connection issue');
          return {
            _id: 'mock_' + Date.now(),
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: customerData.email,
            phone: customerData.phone,
            notes: customerData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }
      
      // Add retry logic for the actual API call
      let retries = 2;
      let lastError = null;
      
      while (retries >= 0) {
        try {
          console.log(`Attempting to create customer${retries < 2 ? ` (retry ${2-retries}/2)` : ''}`);
          const response = await API.post<Customer>('/customers', customerData, {
            timeout: 5000 // Reduce timeout for faster failure detection
          });
          return response.data;
        } catch (err) {
          lastError = err;
          if (err.response) {
            // If we got a response, no need to retry
            throw err;
          }
          if (retries <= 0) break;
          retries--;
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // If we got here, all retries failed
      console.error('Customer creation failed after retries:', lastError);
      
      // Generate mock customer for development/testing
      if (process.env.NODE_ENV !== 'production') {
        console.log('Generating mock customer response for development');
        return {
          _id: 'mock_' + Date.now(),
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          notes: customerData.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      throw lastError || new Error('Failed to create customer after multiple attempts');
    } catch (error) {
      console.error('Customer creation error:', error);
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Server may be down or overloaded.');
      } else if (error.message.includes('Network Error') || error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        throw new Error('Network error. Please check if backend server is running.');
      }
      
      throw error; // Re-throw for handling in the component
    }
  },

  updateCustomer: async (id: string, customerData: Partial<CustomerData>) => {
    const response = await API.put<Customer>(`/customers/${id}`, customerData);
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const response = await API.delete(`/customers/${id}`);
    return response.data;
  },
};

// Appointment API
export const appointmentAPI = {
  getAppointments: async () => {
    const response = await API.get<Appointment[]>('/appointments');
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
      console.error('Error fetching recent appointments:', error);
      // Return mock data if API fails
      return [
        { 
          _id: '1', 
          customer: 'John Doe',
          service: 'Haircut',
          time: '10:00 AM', 
          status: 'Confirmed' 
        },
        { 
          _id: '2', 
          customer: 'Jane Smith',
          service: 'Manicure',
          time: '11:30 AM', 
          status: 'Pending'
        },
        { 
          _id: '3', 
          customer: 'Mike Johnson',
          service: 'Massage',
          time: '2:00 PM', 
          status: 'Confirmed'
        }
      ];
    }
  },

  createAppointment: async (appointmentData: AppointmentData) => {
    const response = await API.post<Appointment>('/appointments', appointmentData);
    return response.data;
  },

  updateAppointment: async (id: string, appointmentData: Partial<AppointmentData>) => {
    const response = await API.put<Appointment>(`/appointments/${id}`, appointmentData);
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
  role: 'admin' | 'user';
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
    console.log('Registering user:', userData.email);
    const response = await API.post<User>('/users', userData);
    if (response.data.token) {
      console.log('Registration successful, storing token');
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setCookie('token', response.data.token);
    }
    return response.data;
  },

  login: async (credentials: LoginCredentials) => {
    console.log('Logging in user:', credentials.email);
    
    try {
      // First, test if the server is accessible
      try {
        const pingResponse = await fetch('http://localhost:5000');
        if (!pingResponse.ok) {
          console.error('Backend server responded with error:', pingResponse.status);
          throw new Error(`Backend server error: ${pingResponse.status}`);
        }
      } catch (error) {
        console.error('Cannot connect to backend server:', error.message);
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }
      
      // Now attempt the actual login
      const response = await API.post<User>('/users/login', credentials);
      
      if (response.data.token) {
        console.log('Login successful, storing token');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        setCookie('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login error detail:', error);
      
      // Extract and enhance error message
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Server may be down or overloaded.');
      } else if (error.message.includes('Network Error') || error.message.includes('connect')) {
        throw new Error('Network error. Please check if backend server is running.');
      }
      
      throw error; // Re-throw for handling in the component
    }
  },

  logout: () => {
    console.log('Logging out user');
    
    // Clear localStorage tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear cookies
    deleteCookie('token');
    
    // For robust cookie deletion, also set an expired cookie with path
    if (typeof document !== 'undefined') {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
    }
    
    // Remove Authorization header if it was set
    if (API.defaults.headers.common['Authorization']) {
      delete API.defaults.headers.common['Authorization'];
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('Getting current user, token exists:', !!token);
    
    // If user exists in localStorage but not in cookies, sync them
    if (user && !hasCookie('token')) {
      console.log('User in localStorage but not in cookies, syncing');
      const userData = JSON.parse(user) as User;
      if (userData.token) {
        setCookie('token', userData.token);
      } else {
        // If token is missing, clear localStorage
        console.log('Token missing in user data, clearing local storage');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
    }
    // If no user in localStorage but token exists in cookies, clear cookies
    if (!user && hasCookie('token')) {
      console.log('No user in localStorage but token in cookies, clearing cookies');
      deleteCookie('token');
      return null;
    }
    return user ? JSON.parse(user) as User : null;
  },

  getProfile: async () => {
    const response = await API.get<User>('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData: Partial<Omit<UserData, 'email'>>) => {
    const response = await API.put<User>('/users/profile', profileData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
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
        const storedMockCustomers = localStorage.getItem('mockCustomers');
        if (storedMockCustomers) {
          const customers = JSON.parse(storedMockCustomers);
          totalCustomers = customers.length;
        }
      } catch (e) {
        console.error('Error getting mock customer count:', e);
      }
      
      // Check if we have stored mock stats in localStorage
      const storedMockStats = localStorage.getItem('mockDashboardStats');
      if (storedMockStats) {
        console.log('Using stored mock dashboard stats from localStorage');
        // Update the customer count to reflect the current localStorage
        const stats = JSON.parse(storedMockStats);
        stats.totalCustomers = totalCustomers; // Always update with current count
        localStorage.setItem('mockDashboardStats', JSON.stringify(stats));
        return stats;
      }
      
      // Try to get real data from API
      try {
        const response = await API.get<DashboardStats>('/dashboard/stats');
        return response.data;
      } catch (apiError) {
        console.error('Error fetching dashboard stats from API:', apiError);
        
        // Create new mock stats with accurate customer count
        const mockStats: DashboardStats = {
          appointmentsToday: Math.floor(Math.random() * 5),
          totalCustomers: totalCustomers,
          revenueToday: Math.floor(Math.random() * 300) + 50,
          averageWaitTime: Math.floor(Math.random() * 15) + 5
        };
        
        // Store mock stats for later use
        localStorage.setItem('mockDashboardStats', JSON.stringify(mockStats));
        
        return mockStats;
      }
    } catch (error) {
      console.error('Error in getStats:', error);
      
      // Final fallback
      return {
        appointmentsToday: 0,
        totalCustomers: 0,
        revenueToday: 0,
        averageWaitTime: 0
      };
    }
  },
  
  refreshStats: async (): Promise<DashboardStats> => {
    try {
      // For mock data, count customers from localStorage
      const storedMockCustomers = localStorage.getItem('mockCustomers');
      if (storedMockCustomers) {
        const customers = JSON.parse(storedMockCustomers);
        
        // Create refreshed mock stats
        const mockStats: DashboardStats = {
          appointmentsToday: Math.floor(Math.random() * 5),
          totalCustomers: customers.length,
          revenueToday: Math.floor(Math.random() * 300) + 50,
          averageWaitTime: Math.floor(Math.random() * 15) + 5
        };
        
        // Store updated stats
        localStorage.setItem('mockDashboardStats', JSON.stringify(mockStats));
        console.log('Refreshed mock dashboard stats based on customer count:', mockStats);
        return mockStats;
      }
      
      const response = await API.get<DashboardStats>('/dashboard/stats?refresh=true');
      return response.data;
    } catch (error) {
      console.error('Error refreshing dashboard stats:', error);
      // Return mock data if API fails (fallback for development)
      return {
        appointmentsToday: Math.floor(Math.random() * 5),
        totalCustomers: 0,
        revenueToday: Math.floor(Math.random() * 300) + 50,
        averageWaitTime: Math.floor(Math.random() * 15) + 5
      };
    }
  }
}; 