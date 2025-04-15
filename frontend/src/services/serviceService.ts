import API from './api';

/**
 * Fetches all services
 * @returns Array of services
 */
export const fetchServices = async () => {
  try {
    const response = await API.get('/services');
    return response.data;
  } catch (error) {
    console.error('Error fetching services:', error);
    
    // Use mock data if API call fails
    if (typeof localStorage !== 'undefined') {
      const mockData = localStorage.getItem('mockServices');
      if (mockData) {
        console.warn('Using mock service data from localStorage');
        return JSON.parse(mockData);
      }
    }
    
    throw error;
  }
};

/**
 * Creates a new service
 * @param serviceData The service data to create
 * @returns The created service
 */
export const createService = async (serviceData) => {
  try {
    const response = await API.post('/services', serviceData);
    return response.data;
  } catch (error) {
    console.error('Error creating service:', error);
    
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
 * Fetches a specific service by ID
 * @param id The service ID
 * @returns The service data
 */
export const fetchServiceById = async (id) => {
  try {
    const response = await API.get(`/services/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching service ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing service
 * @param id The service ID
 * @param serviceData The updated service data
 * @returns The updated service
 */
export const updateService = async (id, serviceData) => {
  try {
    const response = await API.put(`/services/${id}`, serviceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating service ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a service
 * @param id The service ID
 * @returns The deletion response
 */
export const deleteService = async (id) => {
  try {
    const response = await API.delete(`/services/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting service ${id}:`, error);
    throw error;
  }
}; 