import API from "./api";

export interface Service {
   _id: string;
   name: string;
   description: string;
   duration: string;
   price: string;
   category: string;
   isActive: boolean;
}

export interface ServiceResponse {
   message: string;
   affectedAppointments?: number;
   service?: Service;
}

export interface ServiceData {
   name: string;
   description: string;
   duration: string;
   price: string;
   category: string;
   isActive?: boolean;
}

interface ApiError {
   code?: string;
   message: string;
   response?: {
      data?: {
         message: string;
      };
   };
}

/**
 * Fetches all services
 * @returns Array of services
 */
export const fetchServices = async () => {
   try {
      const response = await API.get("/services");
      return response.data;
   } catch (error) {
      console.error("Error fetching services:", error);

      // Use mock data if API call fails
      if (typeof localStorage !== "undefined") {
         const mockData = localStorage.getItem("mockServices");
         if (mockData) {
            console.warn("Using mock service data from localStorage");
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
export const createService = async (
   serviceData: ServiceData
): Promise<Service> => {
   try {
      const response = await API.post("/services", serviceData);
      return response.data;
   } catch (error: unknown) {
      console.error("Error creating service:", error);
      const apiError = error as ApiError;
      if (apiError.code === "ECONNABORTED") {
         throw new Error(
            "Connection timeout. Server may be down or overloaded."
         );
      } else if (
         apiError.message.includes("Network Error") ||
         apiError.message.includes("connect") ||
         apiError.message.includes("ECONNREFUSED")
      ) {
         throw new Error(
            "Network error. Please check if backend server is running."
         );
      }
      throw error;
   }
};

/**
 * Fetches a specific service by ID
 * @param id The service ID
 * @returns The service data
 */
export const fetchServiceById = async (id: string): Promise<Service> => {
   try {
      const response = await API.get(`/services/${id}`);
      return response.data;
   } catch (error: unknown) {
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
export const updateService = async (
   id: string,
   serviceData: Partial<ServiceData>
): Promise<Service> => {
   try {
      const response = await API.put(`/services/${id}`, serviceData);
      return response.data;
   } catch (error: unknown) {
      console.error(`Error updating service ${id}:`, error);
      throw error;
   }
};

/**
 * Deletes a service
 * @param id The service ID
 * @param confirm Whether to confirm the deletion
 * @returns The deletion response
 */
export const deleteService = async (
   id: string,
   confirm: boolean = false
): Promise<ServiceResponse> => {
   try {
      const response = await API.delete(
         `/services/${id}${confirm ? "?confirm=true" : ""}`
      );

      // If we get a confirmation response, return it
      if (response.data.affectedAppointments !== undefined) {
         return response.data;
      }

      // If we get a success message, return it
      if (response.data.message) {
         return response.data;
      }

      throw new Error("Unexpected response format");
   } catch (error: unknown) {
      console.error("Error deleting service:", error);
      const apiError = error as ApiError;
      if (apiError.response?.data?.message) {
         throw new Error(apiError.response.data.message);
      }
      throw error;
   }
};
