import axios from "../services/axiosConfig";
import { Appointment, AppointmentData } from "@/types/appointment";
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
 * Updates an existing appointment in IndexedDB and syncs with server if online
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

      // Save to IndexedDB first
      await indexedDBService.saveAppointment(updatedAppointment);

      // If online, sync with server immediately
      if (navigator.onLine) {
         try {
            const serverResponse = await axios.put(
               `/appointments/${id}`,
               appointmentData
            );
            const serverAppointment = serverResponse.data;

            // Update the local appointment with server data
            const finalAppointment = {
               ...serverAppointment,
               pendingSync: false,
            };
            await indexedDBService.saveAppointment(finalAppointment);

            return finalAppointment;
         } catch (serverError) {
            console.error("Error syncing with server:", serverError);
            toast.error("Updated locally, will sync when online");
            return updatedAppointment;
         }
      }

      toast.success("Appointment updated locally");
      return updatedAppointment;
   } catch (error) {
      console.error("Error updating appointment:", error);
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
      // Try to fetch from server first if online
      if (navigator.onLine) {
         try {
            const response = await axios.get(`/appointments/${id}`);
            const serverAppointment = response.data;

            // Update IndexedDB with server data
            await indexedDBService.saveAppointment({
               ...serverAppointment,
               pendingSync: false,
               pendingDelete: false,
            });

            return serverAppointment;
         } catch (serverError) {
            console.error(
               "Error fetching from server, falling back to IndexedDB:",
               serverError
            );
         }
      }

      // Fallback to IndexedDB
      const localAppointment = await indexedDBService.getAppointmentById(id);
      if (!localAppointment) {
         throw new Error("Appointment not found");
      }
      return localAppointment;
   } catch (error) {
      console.error("Error fetching appointment:", error);
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
