import API from './api';

/**
 * Fetches all appointments
 * @returns Array of appointments
 */
export const fetchAppointments = async () => {
  try {
    const response = await API.get('/appointments');
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    
    // Use mock data if API call fails
    if (typeof localStorage !== 'undefined') {
      const mockData = localStorage.getItem('mockAppointments');
      if (mockData) {
        console.warn('Using mock appointment data from localStorage');
        return JSON.parse(mockData);
      }
    }
    
    throw error;
  }
};

/**
 * Creates a new appointment
 * @param appointmentData The appointment data to create
 * @returns The created appointment
 */
export const createAppointment = async (appointmentData) => {
  try {
    const response = await API.post('/appointments', appointmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    
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
 * Fetches a specific appointment by ID
 * @param id The appointment ID
 * @returns The appointment data
 */
export const fetchAppointmentById = async (id) => {
  try {
    const response = await API.get(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching appointment ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing appointment
 * @param id The appointment ID
 * @param appointmentData The updated appointment data
 * @returns The updated appointment
 */
export const updateAppointment = async (id, appointmentData) => {
  try {
    const response = await API.put(`/appointments/${id}`, appointmentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating appointment ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes an appointment
 * @param id The appointment ID
 * @returns The deletion response
 */
export const deleteAppointment = async (id) => {
  try {
    const response = await API.delete(`/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting appointment ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches recent appointments
 * @returns Array of recent appointments
 */
export const fetchRecentAppointments = async () => {
  try {
    const response = await API.get('/appointments/recent');
    return response.data;
  } catch (error) {
    console.error('Error fetching recent appointments:', error);
    throw error;
  }
}; 