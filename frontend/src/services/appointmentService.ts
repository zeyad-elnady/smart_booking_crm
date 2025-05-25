import axios from "../services/axiosConfig";
import { Appointment, AppointmentData, AppointmentStatus } from "@/types/appointment";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";
import API from "./api";
import { getBusinessSettings, isWithinWorkingHours } from "@/services/businessSettingsService";

// Helper function to generate a unique ID
const generateId = () =>
   `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to check internet connection
const isOnline = (): boolean => navigator.onLine;

// Check if we're in a development environment
const isDevelopmentMode = () => {
  if (typeof window !== 'undefined') {
    // Check for localhost or other indicators of development
    return window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.includes('192.168.') ||
      window.location.hostname.includes('.local') ||
      process.env.NODE_ENV === 'development';
  }
  return process.env.NODE_ENV === 'development';
};

/**
 * Automatically mark appointments as completed if they are in the past by at least one minute
 * and not already canceled or completed
 * @returns Promise that resolves when the process is complete
 */
export const autoCompleteExpiredAppointments = async (): Promise<void> => {
   try {
      // Ensure database is initialized
      await indexedDBService.initDB();
      
      // Get all appointments
      const appointments = await indexedDBService.getAllAppointments();
      
      // Filter out any appointments marked for deletion
      const activeAppointments = appointments.filter(appointment => !appointment.pendingDelete);
      
      // Get current date and time
      const now = new Date();
      // Subtract 1 minute to allow for slight buffer
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      
      let updatedCount = 0;
      
      // Check each appointment
      for (const appointment of activeAppointments) {
         // Parse appointment date and time
         const appointmentDate = appointment.date;
         const appointmentTime = appointment.time;
         const [hours, minutes] = appointmentTime.split(':').map(Number);
         
         // Create Date object for appointment
         const appointmentDateTime = new Date(appointmentDate);
         appointmentDateTime.setHours(hours, minutes, 0, 0);
         
         // Check if appointment is in the past by at least 1 minute
         // and not already canceled or completed
         if (
            appointmentDateTime < oneMinuteAgo && 
            appointment.status !== 'Canceled' &&
            appointment.status !== 'Completed'
         ) {
            // Mark as completed
            const updatedAppointment: Appointment = {
               ...appointment,
               status: 'Completed' as AppointmentStatus,
               updatedAt: new Date().toISOString(),
               pendingSync: true
            };
            
            // Save to IndexedDB
            await indexedDBService.saveAppointment(updatedAppointment);
            updatedCount++;
            
            console.log(`Auto-completed appointment: ${appointment._id} (${appointmentDate} ${appointmentTime})`);
         }
      }
      
      if (updatedCount > 0) {
         console.log(`Auto-completed ${updatedCount} expired appointments`);
         // Mark appointment list for refresh
         localStorage.setItem("appointmentListShouldRefresh", "true");
      }
      
      return Promise.resolve();
   } catch (error) {
      console.error("Error auto-completing appointments:", error);
      return Promise.reject(error);
   }
};

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
 * Fetch appointments within a date range
 */
export const fetchAppointments = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Appointment[]> => {
  try {
    // First ensure the database is initialized
    console.log("Initializing database before fetching appointments");
    await indexedDBService.initDB();
    
    console.log("Fetching appointments from IndexedDB");
    // Get appointments from IndexedDB
    let appointments: Appointment[] = [];
    try {
      appointments = await indexedDBService.getAllAppointments();
      console.log(`Fetched ${appointments.length} appointments from IndexedDB`);
    } catch (dbError) {
      console.error("Error fetching from IndexedDB:", dbError);
      appointments = [];
    }
    
    // Filter by date range if provided
    if (params?.startDate || params?.endDate) {
      appointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        const start = params.startDate ? new Date(params.startDate) : new Date(0);
        const end = params.endDate ? new Date(params.endDate) : new Date(8640000000000000); // Max date
        
        // Set hours to 0 for date-only comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return appointmentDate >= start && appointmentDate <= end;
      });
    }
    
    return appointments;
  } catch (error) {
    console.error("Error in fetchAppointments:", error);
    toast.error("Failed to fetch appointments");
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
      // Validate appointment against business settings
      const businessSettings = await getBusinessSettings();
      const appointmentDate = new Date(appointmentData.date);
      const dayOfWeek = appointmentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Map day number to day name
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = dayNames[dayOfWeek];
      
      // Check if this day is a day off
      const dayConfig = businessSettings.daysOpen[dayName as keyof typeof businessSettings.daysOpen];
      if (!dayConfig?.open) {
         toast.error("Cannot book on days off");
         throw new Error("Cannot book appointments on days off");
      }
      
      // Check if the time is within working hours
      const withinHours = isWithinWorkingHours(
         appointmentDate,
         appointmentData.time,
         businessSettings
      );
      
      if (!withinHours) {
         toast.error("Cannot book outside of business hours");
         throw new Error("Cannot book appointments outside of business hours");
      }
      
      // Get the current user from localStorage
      let currentUser = null;
      try {
         const storedUser = localStorage.getItem("user");
         if (storedUser) {
            currentUser = JSON.parse(storedUser);
         }
      } catch (error) {
         console.error("Error getting user from localStorage:", error);
      }
      
      // Check if the appointment is in the past
      const now = new Date();
      const appointmentTime = appointmentData.time.split(':').map(Number);
      const appointmentDateTime = new Date(appointmentData.date);
      appointmentDateTime.setHours(appointmentTime[0], appointmentTime[1], 0, 0);
      
      if (appointmentDateTime < now) {
         toast.error("Cannot book appointments in the past");
         throw new Error("Cannot book appointments in the past");
      }
      
      // Check if current user already has a booking at this time
      if (currentUser && currentUser._id) {
         // Fetch existing appointments for this date
         const existingAppointments = await indexedDBService.getAppointmentsByDateRange(
            appointmentData.date,
            appointmentData.date
         );
         
         // Check if user already has an appointment at this time
         const hasExistingAppointment = existingAppointments.some(
            (appointment) => {
               const sameUser = appointment.userId === currentUser?._id || appointment.user?._id === currentUser?._id;
               const sameTime = appointment.time === appointmentData.time;
               const sameDate = appointment.date === appointmentData.date;
               
               return sameUser && sameTime && sameDate;
            }
         );
         
         if (hasExistingAppointment) {
            toast.error("You already have an appointment at this time");
            throw new Error("User already has an appointment at this time");
         }
      }
      
      // Check for overlapping appointments considering service duration
      // Fetch all appointments for this date
      const existingAppointments = await indexedDBService.getAppointmentsByDateRange(
         appointmentData.date,
         appointmentData.date
      );
      
      // Convert the selected time to minutes for easier comparison
      const [selectedHours, selectedMinutes] = appointmentData.time.split(':').map(Number);
      const selectedTimeInMinutes = selectedHours * 60 + selectedMinutes;
      
      // Get the service duration in minutes
      const serviceDuration = parseInt(appointmentData.duration, 10) || 60; // Default to 60 minutes
      
      // Check if there's an overlap with any existing appointment
      const hasOverlap = existingAppointments.some(existingApp => {
         // Get the existing appointment time in minutes
         const [existingHours, existingMinutes] = existingApp.time.split(':').map(Number);
         const existingTimeInMinutes = existingHours * 60 + existingMinutes;
         
         // Get the existing service duration
         const existingDuration = parseInt(existingApp.duration, 10) || 60; // Default to 60 minutes
         
         // Calculate end times
         const existingEndTime = existingTimeInMinutes + existingDuration;
         const selectedEndTime = selectedTimeInMinutes + serviceDuration;
         
         // Check for overlap:
         // 1. New appointment starts during an existing one, or
         // 2. New appointment ends during an existing one, or
         // 3. New appointment completely contains an existing one
         return (
            (selectedTimeInMinutes >= existingTimeInMinutes && selectedTimeInMinutes < existingEndTime) ||
            (selectedEndTime > existingTimeInMinutes && selectedEndTime <= existingEndTime) ||
            (selectedTimeInMinutes <= existingTimeInMinutes && selectedEndTime >= existingEndTime)
         );
      });
      
      if (hasOverlap) {
         toast.error("This time slot is already booked");
         throw new Error("This time slot overlaps with an existing appointment");
      }
      
      // Generate a temporary ID for offline functionality
      const tempId = `temp_${Date.now()}`;

      // Create the appointment object with offline sync flags and user ID
      const appointment: Appointment = {
         ...appointmentData,
         _id: tempId,
         pendingSync: true,
         pendingDelete: false,
         userId: currentUser?._id,
         status: appointmentData.status || 'Pending'
      };

      // Save to IndexedDB
      await indexedDBService.saveAppointment(appointment);

      // If online and not in development mode, sync with server immediately
      const isDevMode = isDevelopmentMode();
      if (navigator.onLine && !isDevMode) {
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
               userId: currentUser?._id, // Ensure we keep the user ID
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

      // If online and not in development mode, sync with server immediately
      const isDevMode = isDevelopmentMode();
      if (isOnline() && !isDevMode) {
         try {
            // Extract ID and convert date for sending to server
            const { _id, pendingSync, pendingDelete, ...dataForServer } = updatedAppointment;
            
            const serverResponse = await axios.put(
               `/appointments/${id}`,
               dataForServer
            );
            const serverAppointment = serverResponse.data;

            // Update the local appointment with server data
            await indexedDBService.saveAppointment({
               ...serverAppointment,
               pendingSync: false,
               pendingDelete: false,
            });

            toast.success("Appointment updated successfully");
            return serverAppointment;
         } catch (serverError) {
            console.error("Error syncing with server:", serverError);
            // No error toast since we're only using local data
            toast.success("Appointment updated successfully");
            return updatedAppointment;
         }
      } else {
         toast.success("Appointment updated locally");
      }

      return updatedAppointment;
   } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
      throw error;
   }
};

/**
 * Deletes an appointment by ID
 */
export const deleteAppointment = async (id: string, showNotification = false): Promise<void> => {
   try {
      // Always delete from IndexedDB first
      await indexedDBService.deleteAppointment(id);
      
      // If online and not in development mode, try to delete from server also
      const isDevMode = isDevelopmentMode();
      if (navigator.onLine && !isDevMode) {
         try {
            await axios.delete(`/appointments/${id}`);
            if (showNotification) {
               toast.success("Appointment deleted successfully");
            }
         } catch (serverError) {
            console.error("Error deleting from server:", serverError);
            // Only show notification if explicitly requested
            if (showNotification) {
               toast.success("Appointment deleted successfully");
            }
         }
      } else {
         if (showNotification) {
            toast.success("Appointment deleted successfully");
         }
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
         
         // Process appointment data to ensure consistent format for editing
         return normalizeAppointmentData(localAppointment);
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
            
            return normalizeAppointmentData(serverAppointment);
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
               
               return normalizeAppointmentData(legacyAppointment);
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
 * Normalize appointment data to ensure consistent format for customer and service references
 */
function normalizeAppointmentData(appointment: any): Appointment {
   // Create a copy of the appointment to avoid modifying the original
   const normalizedAppointment = { ...appointment };
   
   // Handle customer field
   if (normalizedAppointment.customer) {
      // If customer is an object with _id, ensure it's properly formatted
      if (typeof normalizedAppointment.customer === 'object' && normalizedAppointment.customer._id) {
         // Save the customer object temporarily
         normalizedAppointment._customerObject = normalizedAppointment.customer;
         // Set the customer field to just the ID for form processing
         normalizedAppointment.customer = normalizedAppointment.customer._id;
      }
   }
   
   // Handle service field
   if (normalizedAppointment.service) {
      // If service is an object with _id, ensure it's properly formatted
      if (typeof normalizedAppointment.service === 'object' && normalizedAppointment.service._id) {
         // Save the service object temporarily
         normalizedAppointment._serviceObject = normalizedAppointment.service;
         // Set the service field to just the ID for form processing
         normalizedAppointment.service = normalizedAppointment.service._id;
      }
   }
   
   return normalizedAppointment;
}

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
