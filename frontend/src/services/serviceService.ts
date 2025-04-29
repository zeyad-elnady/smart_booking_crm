import API from "./api";
import { Service, ServiceData } from "@/types/service";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";

export interface ServiceResponse {
   message: string;
   affectedAppointments?: number;
   service?: Service;
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

// Add a flag to track if services have been loaded already
let servicesLoaded = false;

/**
 * Clears all service data from IndexedDB
 * @returns Promise that resolves when clearing is complete
 */
export const clearAllServices = async (): Promise<void> => {
   try {
      // Initialize database if needed
      await indexedDBService.initDB();
      
      // Clear services from IndexedDB
      const serviceStore = "services";
      await indexedDBService.purgeStore(serviceStore);
      
      // Mark service list for refresh
      localStorage.setItem("serviceListShouldRefresh", "true");
      
      // Reset the loaded flag since all services were deleted
      servicesLoaded = false;
      
      console.log("All service data cleared successfully");
      return Promise.resolve();
   } catch (error) {
      console.error("Error clearing service data:", error);
      return Promise.reject(error);
   }
};

/**
 * Fetches all services from IndexedDB
 * @returns Array of services
 */
export const fetchServices = async (): Promise<Service[]> => {
   try {
      // Get services from IndexedDB
      await indexedDBService.initDB();
      const localServices = await indexedDBService.getAllServices();
      
      if (localServices && localServices.length > 0) {
         console.log(`Found ${localServices.length} services in IndexedDB`);
         servicesLoaded = true;
         return localServices;
      }
      
      // No services were found - return empty array
      return [];
   } catch (error) {
      console.error("Error fetching services:", error);
      return [];
   }
};

/**
 * Enable fetching services from API (removed API functionality)
 */
export const enableServicesFetching = (): void => {
   // This function now does nothing since we skip API calls
   console.log("Using local storage only, API calls disabled");
};

/**
 * Creates a new service using IndexedDB only
 */
export async function createService(serviceData: ServiceData): Promise<Service> {
   try {
      await indexedDBService.initDB();
      
      // Generate a unique local ID for the service
      const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newService: Service = {
         ...serviceData,
         id: localId,
         _id: localId, // Make sure we have _id field as well
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      };
      
      // Save to IndexedDB
      await indexedDBService.addItem('services', newService);
      console.log('Service saved to IndexedDB:', newService);
      
      // Mark the list for refresh
      localStorage.setItem("serviceListShouldRefresh", "true");
      
      return newService;
   } catch (error) {
      console.error('Error creating service:', error);
      toast.error("Failed to create service");
      throw error;
   }
}

/**
 * Updates an existing service using IndexedDB only
 */
export async function updateService(serviceId: string, serviceData: Partial<ServiceData>): Promise<Service> {
   try {
      await indexedDBService.initDB();
      
      // First check if the service exists in IndexedDB
      let existingService: Service | null = await indexedDBService.getItem('services', serviceId);
      
      if (!existingService) {
         throw new Error('Service not found in local database');
      }
      
      const updatedService: Service = {
         ...existingService,
         ...serviceData,
         updatedAt: new Date().toISOString(),
      };
      
      // Update in IndexedDB
      await indexedDBService.updateItem('services', serviceId, updatedService);
      console.log('Service updated in IndexedDB:', updatedService);
      
      // Mark the list for refresh
      localStorage.setItem("serviceListShouldRefresh", "true");
      
      return updatedService;
   } catch (error) {
      console.error('Error updating service:', error);
      throw error;
   }
}

/**
 * Deletes a service using IndexedDB only
 */
export async function deleteService(serviceId: string): Promise<void> {
   try {
      await indexedDBService.initDB();
      
      // Delete the service and all related appointments using the enhanced indexedDB method
      await indexedDBService.deleteService(serviceId);
      console.log('Service and related appointments deleted from IndexedDB:', serviceId);
      
      // Mark the appointment list for refresh too
      localStorage.setItem("appointmentListShouldRefresh", "true");
      localStorage.setItem("serviceListShouldRefresh", "true");
   } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
   }
}

/**
 * Gets all services from IndexedDB only
 */
export async function getServices(): Promise<Service[]> {
   try {
      await indexedDBService.initDB();
      
      // Get from IndexedDB
      const localServices = await indexedDBService.getAllItems('services');
      
      if (localServices && localServices.length > 0) {
         console.log('Found services in IndexedDB:', localServices.length);
         return localServices;
      }
      
      console.log('No services found in IndexedDB, returning empty array');
      return [];
   } catch (error) {
      console.error('Error getting services:', error);
      return [];
   }
}

/**
 * Gets a service by ID from IndexedDB only
 */
export async function getServiceById(serviceId: string): Promise<Service | null> {
   try {
      await indexedDBService.initDB();
      
      // Get from IndexedDB
      const localService = await indexedDBService.getItem('services', serviceId);
      
      if (localService) {
         console.log('Found service in IndexedDB:', localService);
         return localService;
      }
      
      console.log('Service not found in IndexedDB, returning null');
      return null;
   } catch (error) {
      console.error('Error getting service by ID:', error);
      return null;
   }
}
