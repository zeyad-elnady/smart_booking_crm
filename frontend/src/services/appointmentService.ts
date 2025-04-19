import axios from "../services/axiosConfig";
import { Appointment, AppointmentData } from "@/types/appointment";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";
import API from "./api";

// Helper function to generate a unique ID
const generateId = () =>
   `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to check internet connection
const isOnline = (): boolean => navigator.onLine;

/**
 * Clears all appointment data from both IndexedDB and localStorage
 * @returns Promise that resolves when clearing is complete
 */
export const clearAllAppointments = async (): Promise<void> => {
   try {
      // Initialize database if needed
      await indexedDBService.initDB();
      
      // Clear appointments from IndexedDB
      const appointmentStore = "appointments";
      await indexedDBService.purgeStore(appointmentStore);
      
      // Remove appointments from localStorage
      localStorage.removeItem("mockAppointments");
      
      // Mark appointment list for refresh
      localStorage.setItem("appointmentListShouldRefresh", "true");
      
      console.log("All appointment data cleared successfully");
      return Promise.resolve();
   } catch (error) {
      console.error("Error clearing appointment data:", error);
      return Promise.reject(error);
   }
};

/**
 * Fetches all appointments
 * @returns Array of appointments sorted by date and time
 */
export const fetchAppointments = async (): Promise<Appointment[]> => {
   try {
      // First try to get appointments from IndexedDB
      await indexedDBService.initDB();
      let localAppointments = await indexedDBService.getAllAppointments();
      
      // Filter out any appointments marked for deletion
      localAppointments = localAppointments.filter(appointment => !appointment.pendingDelete);
      
      if (localAppointments && localAppointments.length > 0) {
         console.log(`Found ${localAppointments.length} appointments in IndexedDB`);
      } else {
         // If no appointments in IndexedDB, try API
         try {
            const response = await API.get("/appointments");
            const apiAppointments = response.data;
            
            // Save API appointments to IndexedDB for offline access
            if (apiAppointments && apiAppointments.length > 0) {
               console.log(`Saving ${apiAppointments.length} API appointments to IndexedDB`);
               await indexedDBService.bulkSaveAppointments(apiAppointments);
               localAppointments = apiAppointments;
            }
         } catch (apiError) {
            console.error("API error, trying localStorage:", apiError);
            
            // If API fails, try localStorage as last resort
            if (typeof localStorage !== "undefined") {
               const mockData = localStorage.getItem("mockAppointments");
               if (mockData) {
                  console.warn("Using mock appointment data from localStorage");
                  const mockAppointments = JSON.parse(mockData);
                  
                  // Migrate mock appointments to IndexedDB for future use
                  if (Array.isArray(mockAppointments) && mockAppointments.length > 0) {
                     await indexedDBService.bulkSaveAppointments(mockAppointments);
                     // Clear from localStorage after migration
                     localStorage.removeItem("mockAppointments");
                     localAppointments = mockAppointments;
                  }
               }
            }
         }
      }
      
      // Sort appointments by date and time
      if (localAppointments && localAppointments.length > 0) {
         return localAppointments.sort((a, b) => {
            // First sort by date
            const dateComparison = a.date.localeCompare(b.date);
            if (dateComparison !== 0) return dateComparison;
            
            // If dates are the same, sort by time
            return a.time.localeCompare(b.time);
         });
      }
      
      // If no appointments found anywhere, return empty array
      return [];
   } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
   }
};

/**
 * Creates a new appointment in IndexedDB
 */
export const createAppointment = async (
   appointmentData: AppointmentData
): Promise<Appointment> => {
   try {
      // Generate a temporary ID for offline functionality
      const tempId = `temp_${Date.now()}`;

      // Create the appointment object with offline sync flags
      const appointment: Appointment = {
         ...appointmentData,
         _id: tempId,
         pendingSync: true,
         pendingDelete: false,
      };

      // Store in IndexedDB for offline functionality
      await indexedDBService.saveAppointment(appointment);

      // If online, sync with server immediately
      if (navigator.onLine) {
         try {
            const serverResponse = await axios.post(
               "/appointments",
               appointmentData
            );
            const serverAppointment = serverResponse.data;

            // Update the local appointment with server data
            await indexedDBService.deleteAppointment(tempId);
            await indexedDBService.saveAppointment({
               ...serverAppointment,
               pendingSync: false,
               pendingDelete: false,
            });

            toast.success("Appointment created successfully");
            return serverAppointment;
         } catch (serverError) {
            console.error("Error syncing with server:", serverError);
            // Keep the local version if server sync fails
            return appointment;
         }
      }

      toast.success("Appointment created successfully");
      return appointment;
   } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to create appointment");
      throw error;
   }
};

/**
 * Updates an existing appointment in IndexedDB and syncs with server if online
 */
export const updateAppointment = async (
   id: string,
   appointmentData: Partial<Appointment>
): Promise<Appointment> => {
   try {
      console.log(`Starting update for appointment with ID: ${id}`);
      console.log("Update data:", appointmentData);
      
      // Ensure database is initialized
      await indexedDBService.initDB();
      
      // Get the existing appointment
      const existingAppointment = await indexedDBService.getAppointmentById(id);
      if (!existingAppointment) {
         console.error(`Appointment with ID ${id} not found in IndexedDB`);
         throw new Error("Appointment not found");
      }
      
      console.log("Found existing appointment:", existingAppointment);

      // Create the updated appointment object, preserving important fields
      const updatedAppointment: Appointment = {
         ...existingAppointment,
         ...appointmentData,
         pendingSync: true,
         updatedAt: new Date().toISOString()
      };
      
      console.log("Saving updated appointment:", updatedAppointment);

      // Save to IndexedDB first
      await indexedDBService.saveAppointment(updatedAppointment);
      console.log("Successfully saved to IndexedDB");

      // If online, sync with server immediately
      if (navigator.onLine) {
         try {
            console.log("Attempting to sync with server...");
            const serverResponse = await axios.put(
               `/appointments/${id}`,
               appointmentData
            );
            const serverAppointment = serverResponse.data;
            console.log("Server response:", serverAppointment);

            // Update the local appointment with server data
            const finalAppointment = {
               ...serverAppointment,
               pendingSync: false,
            };
            await indexedDBService.saveAppointment(finalAppointment);
            console.log("Updated local appointment with server data");

            toast.success("Appointment updated successfully");
            return finalAppointment;
         } catch (serverError) {
            console.error("Error syncing with server:", serverError);
            return updatedAppointment;
         }
      } else {
         toast.success("Appointment updated successfully (offline)");
      }

      return updatedAppointment;
   } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error(`Failed to update appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
   }
};

/**
 * Deletes an appointment from both IndexedDB and server
 */
export const deleteAppointment = async (id: string): Promise<void> => {
   try {
      const appointment = await indexedDBService.getAppointmentById(id);
      if (!appointment) {
         throw new Error("Appointment not found");
      }

      // Always delete from IndexedDB first
      await indexedDBService.deleteAppointment(id);
      
      // If online, try to delete from server also
      if (navigator.onLine) {
         try {
            await axios.delete(`/appointments/${id}`);
            toast.success("Appointment deleted successfully");
         } catch (serverError) {
            console.error("Error deleting from server:", serverError);
            // Don't need to handle this specially since we've already deleted from IndexedDB
            toast.success("Appointment deleted locally");
         }
      } else {
         toast.success("Appointment deleted locally (offline)");
      }
      
      // Flag to refresh appointment list
      localStorage.setItem("appointmentListShouldRefresh", "true");
   } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
      throw error;
   }
};

/**
 * Fetches a specific appointment by ID from IndexedDB
 */
export const fetchAppointmentById = async (
   id: string
): Promise<Appointment | null> => {
   try {
      console.log(`Attempting to fetch appointment with ID: ${id}`);
      
      // First ensure database is initialized
      await indexedDBService.initDB();

      // Try to fetch directly from IndexedDB first (most reliable)
      console.log("Checking IndexedDB for appointment...");
      const localAppointment = await indexedDBService.getAppointmentById(id);
      
      if (localAppointment) {
         console.log("Appointment found in IndexedDB:", localAppointment);
         return localAppointment;
      }
      
      console.log("Appointment not found in IndexedDB, trying server...");
      
      // If not in IndexedDB and we're online, try the server
      if (navigator.onLine) {
         try {
            console.log("Fetching from server API...");
            const response = await axios.get(`/appointments/${id}`);
            const serverAppointment = response.data;
            console.log("Appointment found on server:", serverAppointment);

            // Save to IndexedDB for future access
            await indexedDBService.saveAppointment({
               ...serverAppointment,
               pendingSync: false,
               pendingDelete: false,
            });
            
            return serverAppointment;
         } catch (serverError) {
            console.error("Error fetching from server:", serverError);
         }
      } else {
         console.log("Currently offline, only IndexedDB data is available");
      }
      
      // As a last resort, check localStorage for legacy data
      console.log("Checking localStorage as last resort...");
      const storedAppointments = localStorage.getItem("storedAppointments");
      if (storedAppointments) {
         try {
            const appointments = JSON.parse(storedAppointments);
            const legacyAppointment = appointments.find((a: any) => a._id === id);
            
            if (legacyAppointment) {
               console.log("Found appointment in localStorage:", legacyAppointment);
               
               // Save to IndexedDB for future access
               await indexedDBService.saveAppointment({
                  ...legacyAppointment,
                  pendingSync: true,
                  pendingDelete: false,
               });
               
               return legacyAppointment;
            }
         } catch (parseError) {
            console.error("Error parsing localStorage appointments:", parseError);
         }
      }
      
      console.error(`Appointment with ID ${id} not found in any storage location`);
      return null;
   } catch (error) {
      console.error("Error in fetchAppointmentById:", error);
      throw error;
   }
};

/**
 * Syncs local appointments with the server when online
 * This function would be called when internet connection is restored
 * or when user explicitly requests a sync
 */
export const syncAppointments = async (): Promise<void> => {
   if (!isOnline()) {
      toast.error("Cannot sync appointments while offline");
      return;
   }

   try {
      // Get all appointments from IndexedDB
      const localAppointments = await indexedDBService.getAllAppointments();

      // Handle appointments marked for deletion
      const appointmentsToDelete = localAppointments.filter(
         (appointment) => appointment.pendingDelete
      );
      for (const appointment of appointmentsToDelete) {
         try {
            if (!appointment._id.startsWith("local_")) {
               await axios.delete(`/appointments/${appointment._id}`);
            }
            await indexedDBService.deleteAppointment(appointment._id);
         } catch (error) {
            console.error(
               `Failed to delete appointment ${appointment._id}:`,
               error
            );
         }
      }

      // Handle appointments that need to be synced
      const appointmentsToSync = localAppointments.filter(
         (appointment) => appointment.pendingSync && !appointment.pendingDelete
      );
      for (const appointment of appointmentsToSync) {
         try {
            let serverAppointment;
            if (
               appointment._id.startsWith("local_") ||
               appointment._id.startsWith("temp_")
            ) {
               // This is a new appointment that hasn't been synced yet
               const { _id, pendingSync, pendingDelete, ...appointmentData } =
                  appointment;
               const response = await axios.post(
                  "/appointments",
                  appointmentData
               );
               serverAppointment = response.data;
               await indexedDBService.deleteAppointment(appointment._id);
            } else {
               // This is an existing appointment that needs to be updated
               const { pendingSync, pendingDelete, ...appointmentData } =
                  appointment;
               const response = await axios.put(
                  `/appointments/${appointment._id}`,
                  appointmentData
               );
               serverAppointment = response.data;
            }

            // Save the server response to IndexedDB
            await indexedDBService.saveAppointment({
               ...serverAppointment,
               pendingSync: false,
               pendingDelete: false,
            });
         } catch (error) {
            console.error(
               `Failed to sync appointment ${appointment._id}:`,
               error
            );
         }
      }

      // Fetch all appointments from server to ensure we have the latest data
      const response = await axios.get("/appointments");
      const serverAppointments = response.data;

      // Update IndexedDB with server data
      await indexedDBService.bulkSaveAppointments(
         serverAppointments.map((appointment: Appointment) => ({
            ...appointment,
            pendingSync: false,
            pendingDelete: false,
         }))
      );

      toast.success("Appointments synced successfully");
   } catch (error) {
      console.error("Error syncing appointments:", error);
      toast.error("Failed to sync appointments");
      throw error;
   }
};

// Add event listeners for online/offline status
if (typeof window !== "undefined") {
   window.addEventListener("online", () => {
      toast.success("Internet connection restored");
      // Automatically trigger sync when connection is restored
      syncAppointments().catch((error) => {
         console.error("Failed to sync appointments:", error);
         toast.error("Failed to sync appointments");
      });
   });

   window.addEventListener("offline", () => {
      toast.error("Working offline - changes will be saved locally");
   });
}

/**
 * Fetches recent appointments
 * @returns Array of recent appointments
 */
export const fetchRecentAppointments = async () => {
   try {
      const response = await axios.get("/appointments/recent");
      return response.data;
   } catch (error) {
      console.error("Error fetching recent appointments:", error);
      throw error;
   }
};
