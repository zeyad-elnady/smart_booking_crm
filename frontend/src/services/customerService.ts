import API from "./api";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";
import { Customer } from "@/types/customer";
import { Appointment } from "@/types/appointment";

/**
 * Fetches all customers
 * @returns Array of customers
 */
export const fetchCustomers = async () => {
   try {
      const response = await API.get("/customers");
      return response.data;
   } catch (error) {
      console.error("Error fetching customers:", error);

      // Use mock data if API call fails
      if (typeof localStorage !== "undefined") {
         const mockData = localStorage.getItem("mockCustomers");
         if (mockData) {
            console.warn("Using mock customer data from localStorage");
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
export const createCustomer = async (
   customerData: Partial<Customer>
): Promise<Customer> => {
   try {
      const response = await API.post<Customer>("/customers", customerData);
      return response.data;
   } catch (error: unknown) {
      console.error("Error creating customer:", error);

      if (error instanceof Error) {
         // Handle specific error cases
         if (error.message.includes("ECONNABORTED")) {
            throw new Error(
               "Connection timeout. Server may be down or overloaded."
            );
         } else if (
            error.message.includes("Network Error") ||
            error.message.includes("connect") ||
            error.message.includes("ECONNREFUSED")
         ) {
            throw new Error(
               "Network error. Please check if backend server is running."
            );
         }
      }
      throw new Error("Failed to create customer");
   }
};

/**
 * Fetches a specific customer by ID
 * @param id The customer ID
 * @returns The customer data
 */
export const fetchCustomerById = async (id: string): Promise<Customer> => {
   try {
      const response = await API.get<Customer>(`/customers/${id}`);
      return response.data;
   } catch (error: unknown) {
      console.error(`Error fetching customer ${id}:`, error);
      throw new Error("Failed to fetch customer");
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
      const response = await API.put<Customer>(
         `/customers/${id}`,
         customerData
      );
      return response.data;
   } catch (error: unknown) {
      console.error(`Error updating customer ${id}:`, error);
      throw new Error("Failed to update customer");
   }
};

/**
 * Deletes a customer and all associated appointments
 * @param id The customer ID
 * @returns The deletion response
 */
export const deleteCustomer = async (
   id: string
): Promise<{ message: string }> => {
   try {
      // Delete the customer from the server
      const response = await API.delete<{ message: string }>(
         `/customers/${id}`
      );

      // Clear associated appointments from IndexedDB
      const appointments = await indexedDBService.getAllAppointments();
      const customerAppointments = appointments.filter((apt: Appointment) =>
         typeof apt.customer === "string"
            ? apt.customer === id
            : apt.customer._id === id
      );

      // Delete each appointment from IndexedDB
      for (const apt of customerAppointments) {
         await indexedDBService.deleteAppointment(apt._id);
      }

      // Trigger a refresh of the appointments list
      localStorage.setItem("appointmentListShouldRefresh", "true");

      // Show success message
      toast.success("Customer and associated appointments deleted");

      return response.data;
   } catch (error: unknown) {
      console.error(`Error deleting customer ${id}:`, error);
      toast.error("Failed to delete customer");
      throw new Error("Failed to delete customer");
   }
};
