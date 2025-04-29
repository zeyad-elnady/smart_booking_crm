import API from "./api";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";
import { Customer } from "@/types/customer";
import { Appointment } from "@/types/appointment";

/**
 * Clears all customer data from IndexedDB
 * @returns Promise that resolves when clearing is complete
 */
export const clearAllCustomers = async (): Promise<void> => {
   try {
      // Initialize database if needed
      await indexedDBService.initDB();
      
      // Clear customers from IndexedDB
      const customerStore = "customers";
      await indexedDBService.purgeStore(customerStore);
      
      // Mark customer list for refresh
      localStorage.setItem("customerListShouldRefresh", "true");
      
      console.log("All customer data cleared successfully");
      return Promise.resolve();
   } catch (error) {
      console.error("Error clearing customer data:", error);
      return Promise.reject(error);
   }
};

/**
 * Fetches all customers
 * @returns Array of customers
 */
export const fetchCustomers = async () => {
   try {
      // Try to get customers from IndexedDB first
      await indexedDBService.initDB();
      const localCustomers = await indexedDBService.getAllCustomers();
      
      if (localCustomers && localCustomers.length > 0) {
         console.log(`Found ${localCustomers.length} customers in IndexedDB`);
         return localCustomers;
      }

      // If no customers in IndexedDB, try API
      try {
         const response = await API.get("/customers");
         const apiCustomers = response.data;
         
         // Save API customers to IndexedDB
         if (apiCustomers && apiCustomers.length > 0) {
            console.log(`Saving ${apiCustomers.length} API customers to IndexedDB`);
            await indexedDBService.bulkSaveCustomers(apiCustomers);
         }
         
         return apiCustomers;
      } catch (apiError) {
         console.error("API error, trying localStorage:", apiError);
         
         // If API fails, try localStorage as last resort
         if (typeof localStorage !== "undefined") {
            const mockData = localStorage.getItem("mockCustomers");
            if (mockData) {
               console.warn("Using mock customer data from localStorage");
               const mockCustomers = JSON.parse(mockData);
               
               // Migrate mock customers to IndexedDB for future use
               await indexedDBService.migrateCustomersFromLocalStorage();
               
               return mockCustomers;
            }
         }
         
         // If no customers anywhere, return empty array
         return [];
      }
   } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
   }
};

/**
 * Creates a new customer using only IndexedDB storage
 * @param customerData The customer data to create
 * @returns The created customer
 */
export const createCustomer = async (
   customerData: Partial<Customer>
): Promise<Customer> => {
   try {
      // Initialize the database
      await indexedDBService.initDB();
      
      // Check for duplicate email
      if (customerData.email) {
         const existingCustomersByEmail = await indexedDBService.searchCustomers({ email: customerData.email });
         if (existingCustomersByEmail.length > 0) {
            throw new Error("Customer with this email already exists");
         }
      }
      
      // Check for duplicate phone
      if (customerData.phone) {
         const existingCustomersByPhone = await indexedDBService.searchCustomers({ phone: customerData.phone });
         if (existingCustomersByPhone.length > 0) {
            throw new Error("Customer with this phone number already exists");
         }
      }
      
      // Get all customers to determine the next ID
      const allCustomers = await indexedDBService.getAllCustomers();
      
      // Get only numeric IDs and find the highest one
      let highestId = 0;
      allCustomers.forEach(customer => {
         const numberId = parseInt(customer._id);
         if (!isNaN(numberId)) {
            highestId = Math.max(highestId, numberId);
         }
      });
      
      // Create sequential ID (next number after the highest existing ID)
      const nextId = String(highestId + 1);
      
      // Create the new customer object
      const newCustomer: Customer = {
         _id: nextId,
         firstName: customerData.firstName || "",
         lastName: customerData.lastName || "",
         email: customerData.email || "",
         phone: customerData.phone || "",
         address: customerData.address || "",
         notes: customerData.notes || "",
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      };
      
      // Save directly to IndexedDB
      await indexedDBService.saveCustomer(newCustomer);
      console.log('Customer saved to IndexedDB:', newCustomer);
      
      // Mark the customer list for refresh
      localStorage.setItem("customerListShouldRefresh", "true");
      
      return newCustomer;
   } catch (error: unknown) {
      console.error("Error creating customer:", error);
      throw error instanceof Error ? error : new Error("Failed to create customer");
   }
};

/**
 * Fetches a specific customer by ID
 * @param id The customer ID
 * @returns The customer data
 */
export const fetchCustomerById = async (id: string): Promise<Customer> => {
   try {
      console.log(`[customerService] Fetching customer with ID: ${id}`);
      
      // Initialize the database if needed
      await indexedDBService.initDB();
      
      // Try to get from IndexedDB first
      const localCustomer = await indexedDBService.getCustomerById(id);
      if (localCustomer) {
         console.log(`[customerService] Found customer in IndexedDB: ${JSON.stringify(localCustomer)}`);
         return localCustomer;
      }
      
      console.log(`[customerService] Customer not found in IndexedDB, trying API`);
      
      // If not in IndexedDB, try API
      try {
         const response = await API.get<Customer>(`/customers/${id}`);
         
         if (response.data) {
            console.log(`[customerService] Found customer via API: ${JSON.stringify(response.data)}`);
            
            // Save to IndexedDB for future use
            await indexedDBService.saveCustomer(response.data);
            
            return response.data;
         }
         
         throw new Error(`Customer with ID ${id} not found`);
      } catch (apiError) {
         console.error(`[customerService] API error:`, apiError);
         throw new Error(`Customer with ID ${id} not found`);
      }
   } catch (error: unknown) {
      console.error(`[customerService] Error fetching customer ${id}:`, error);
      throw error instanceof Error 
         ? error 
         : new Error(`Failed to fetch customer with ID ${id}`);
   }
};

/**
 * Updates an existing customer
 * @param id The customer ID
 * @param customerData The updated customer data
 * @returns The updated customer
 */
export const updateCustomer = async (
   id: string,
   customerData: Partial<Customer>
): Promise<Customer> => {
   try {
      // First get current customer
      const currentCustomer = await indexedDBService.getCustomerById(id);
      if (!currentCustomer) {
         throw new Error(`Customer with ID ${id} not found`);
      }
      
      // Create updated customer object
      const updatedCustomer: Customer = {
         ...currentCustomer,
         ...customerData,
         updatedAt: new Date().toISOString()
      };
      
      // Try to update via API first
      try {
         const response = await API.put<Customer>(
            `/customers/${id}`,
            customerData
         );
         
         // Save API result to IndexedDB
         await indexedDBService.saveCustomer(response.data);
         
         return response.data;
      } catch (apiError) {
         console.error("API error updating customer:", apiError);
         
         // If API fails, update locally in IndexedDB
         await indexedDBService.saveCustomer(updatedCustomer);
         toast.success("Customer updated locally");
         
         return updatedCustomer;
      }
   } catch (error: unknown) {
      console.error(`Error updating customer ${id}:`, error);
      throw new Error("Failed to update customer");
   }
};

interface AppointmentCustomer {
   _id: string;
   firstName: string;
   lastName: string;
   email: string;
   phone?: string;
}

interface DeleteCustomerResponse {
   message: string;
   affectedAppointments?: number;
   customer?: Customer;
}

/**
 * Deletes a customer and all associated appointments
 * @param id The customer ID
 * @returns The deletion response
 */
export const deleteCustomer = async (
   id: string
): Promise<DeleteCustomerResponse> => {
   try {
      // First try API
      try {
         const response = await API.delete<DeleteCustomerResponse>(
            `/customers/${id}`
         );
         
         // Delete from IndexedDB too
         await indexedDBService.deleteCustomer(id);
         
         // Clear associated appointments from IndexedDB
         const appointments: Appointment[] =
            await indexedDBService.getAllAppointments();
         const customerAppointments = appointments.filter((apt) => {
            const customer = apt.customer;
            return typeof customer === "string"
               ? customer === id
               : (customer as { _id: string })._id === id;
         });

         // Delete each appointment from IndexedDB
         for (const apt of customerAppointments) {
            await indexedDBService.deleteAppointment(apt._id);
         }

         // Trigger a refresh of the appointments list
         localStorage.setItem("appointmentListShouldRefresh", "true");

         // Show success message
         toast.success("Customer and associated appointments deleted");

         return response.data;
      } catch (apiError) {
         console.error("API error deleting customer:", apiError);
         
         // If API fails, delete locally from IndexedDB
         await indexedDBService.deleteCustomer(id);
         
         // Clear associated appointments from IndexedDB
         const appointments: Appointment[] =
            await indexedDBService.getAllAppointments();
         const customerAppointments = appointments.filter((apt) => {
            const customer = apt.customer;
            return typeof customer === "string"
               ? customer === id
               : (customer as { _id: string })._id === id;
         });

         // Delete each appointment from IndexedDB
         for (const apt of customerAppointments) {
            await indexedDBService.deleteAppointment(apt._id);
         }
         
         toast.success("Customer deleted locally");
         
         return {
            message: "Customer deleted locally",
            affectedAppointments: customerAppointments.length
         };
      }
   } catch (error: unknown) {
      console.error(`Error deleting customer ${id}:`, error);
      if (error instanceof Error) {
         toast.error(error.message);
      } else {
         toast.error("Failed to delete customer");
      }
      throw error;
   }
};
