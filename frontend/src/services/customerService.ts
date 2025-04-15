import API from './api';

/**
 * Fetches all customers
 * @returns Array of customers
 */
export const fetchCustomers = async () => {
  try {
    const response = await API.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    
    // Use mock data if API call fails
    if (typeof localStorage !== 'undefined') {
      const mockData = localStorage.getItem('mockCustomers');
      if (mockData) {
        console.warn('Using mock customer data from localStorage');
        return JSON.parse(mockData);
      }
    }
    
    throw error;
  }
};

/**
 * Creates a new customer
 * @param customerData The customer data to create
 * @returns The created customer
 */
export const createCustomer = async (customerData) => {
  try {
    const response = await API.post('/customers', customerData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. Server may be down or overloaded.');
    } else if (error.message.includes('Network Error') || error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Network error. Please check if backend server is running.');
    }
    
    throw error;
  }
};

/**
 * Fetches a specific customer by ID
 * @param id The customer ID
 * @returns The customer data
 */
export const fetchCustomerById = async (id) => {
  try {
    const response = await API.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing customer
 * @param id The customer ID
 * @param customerData The updated customer data
 * @returns The updated customer
 */
export const updateCustomer = async (id, customerData) => {
  try {
    const response = await API.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a customer
 * @param id The customer ID
 * @returns The deletion response
 */
export const deleteCustomer = async (id) => {
  try {
    const response = await API.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error);
    throw error;
  }
}; 