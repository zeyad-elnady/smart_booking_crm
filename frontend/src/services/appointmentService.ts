import axios from "../services/axiosConfig";
import { Appointment, AppointmentData } from "./api";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";

// Helper function to generate a unique ID
const generateId = () =>
   `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to check internet connection
const isOnline = (): boolean => navigator.onLine;

/**
 * Fetches all appointments from IndexedDB
 */
export const fetchAppointments = async (): Promise<Appointment[]> => {
   try {
      // Try to fetch from server first if online
      if (navigator.onLine) {
         try {
            const response = await axios.get("/appointments");
            const serverAppointments = response.data;

            // Update IndexedDB with server data
            for (const appointment of serverAppointments) {
               await indexedDBService.saveAppointment(appointment);
            }

            return serverAppointments;
         } catch (serverError) {
            console.error(
               "Error fetching from server, falling back to IndexedDB:",
               serverError
            );
         }
      }

      // Fallback to IndexedDB
      return await indexedDBService.getAllAppointments();
   } catch (error) {
      console.error("Error fetching appointments:", error);
      throw error;
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

            toast.success("Appointment created and synced with server");
            return serverAppointment;
         } catch (serverError) {
            console.error("Error syncing with server:", serverError);
            // Keep the local version if server sync fails
            toast.error("Created locally, will sync when online");
            return appointment;
         }
      }

      toast.success("Appointment created locally");
      return appointment;
   } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to create appointment");
      throw error;
   }
};

/**
 * Updates an existing appointment in IndexedDB
 */
export const updateAppointment = async (
   id: string,
   appointmentData: Partial<Appointment>
): Promise<Appointment> => {
   try {
      const existingAppointment = await indexedDBService.getAppointmentById(id);
      if (!existingAppointment) {
         throw new Error("Appointment not found");
      }

      const updatedAppointment: Appointment = {
         ...existingAppointment,
         ...appointmentData,
         pendingSync: true,
      };

      await indexedDBService.saveAppointment(updatedAppointment);
      toast.success("Appointment updated locally");
      return updatedAppointment;
   } catch (error) {
      console.error("Error updating appointment in IndexedDB:", error);
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

      // If online, try to delete from server first
      if (navigator.onLine) {
         try {
            await axios.delete(`/appointments/${id}`);
            // If server deletion successful, delete from IndexedDB
            await indexedDBService.deleteAppointment(id);
            toast.success("Appointment deleted successfully");
         } catch (serverError) {
            console.error("Error deleting from server:", serverError);
            // If it's a local appointment that hasn't been synced, delete it directly
            if (appointment._id.startsWith("local_")) {
               await indexedDBService.deleteAppointment(id);
               toast.success("Local appointment deleted");
            } else {
               // For server-synced appointments that failed to delete, mark for deletion
               await indexedDBService.saveAppointment({
                  ...appointment,
                  pendingDelete: true,
                  pendingSync: true,
               });
               toast.error(
                  "Appointment marked for deletion, will sync when online"
               );
            }
         }
      } else {
         // If offline, mark for deletion or delete local
         if (appointment._id.startsWith("local_")) {
            await indexedDBService.deleteAppointment(id);
            toast.success("Local appointment deleted");
         } else {
            await indexedDBService.saveAppointment({
               ...appointment,
               pendingDelete: true,
               pendingSync: true,
            });
            toast.error(
               "Appointment marked for deletion, will sync when online"
            );
         }
      }
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
      return await indexedDBService.getAppointmentById(id);
   } catch (error) {
      console.error("Error fetching appointment from IndexedDB:", error);
      throw error;
   }
};

/**
 * Syncs local appointments with the server when online
 * This function would be called when internet connection is restored
 * or when user explicitly requests a sync
 */
export const syncAppointments = async (): Promise<void> => {
   // This function would be implemented later when server sync is needed
   // It would handle:
   // 1. Uploading appointments with pendingSync = true
   // 2. Deleting appointments with pendingDelete = true
   // 3. Updating local appointments with server responses
   // 4. Handling conflicts
};

// Add event listeners for online/offline status
if (typeof window !== "undefined") {
   window.addEventListener("online", () => {
      toast.success("Internet connection restored");
      // Could trigger sync here if desired
      // syncAppointments();
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
