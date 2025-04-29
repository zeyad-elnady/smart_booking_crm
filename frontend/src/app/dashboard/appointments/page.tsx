"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
   PlusIcon,
   QueueListIcon,
   CalendarIcon,
   ChevronLeftIcon,
   ChevronRightIcon,
   XMarkIcon,
   ArrowPathIcon,
   ClockIcon,
   ChatBubbleLeftIcon,
   TrashIcon,
   PencilIcon,
   ChevronDownIcon,
   XCircleIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";
import {
   format,
   startOfWeek,
   addDays,
   isSameDay,
   parseISO,
   addWeeks,
   subWeeks,
   startOfMonth,
   endOfMonth,
   getDay,
   getDate,
   addMonths,
   subMonths,
} from "date-fns";
import {
   fetchAppointments,
   deleteAppointment,
   updateAppointment,
   autoCompleteExpiredAppointments
} from "@/services/appointmentService";
import type {
   Appointment,
   AppointmentStatus,
   AppointmentData,
} from "@/types/appointment";
import type { Customer } from "@/types/customer";
import type { Service } from "@/types/service";
import type { Service as ServiceType } from "@/types/service";
import { toast } from "react-hot-toast";
import { testConnections } from "@/services/api";
import { indexedDBService } from "@/services/indexedDB";
import { useDarkMode } from "@/context/DarkModeContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import DeleteAppointmentDialog from "@/components/DeleteAppointmentDialog";

interface AppointmentCustomer {
   _id: string;
   firstName: string;
   lastName: string;
   name: string;
}

const statusOptions: AppointmentStatus[] = [
   "Pending",
   "Confirmed",
   "Canceled",
   "Completed",
];

export default function Appointments() {
   const router = useRouter();
   const { darkMode } = useTheme();
   const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
   const [calendarMode, setCalendarMode] = useState("week"); // 'week' or 'month'
   const [currentDate, setCurrentDate] = useState(new Date());
   const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
   const [monthDays, setMonthDays] = useState<(Date | null)[]>([]);
   const [selectedAppointment, setSelectedAppointment] =
      useState<Appointment | null>(null);
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [loading, setLoading] = useState(true);
   const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
   const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
   const [error, setError] = useState<string | null>(null);
   const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);

   // Initialize IndexedDB and load appointments
   useEffect(() => {
      const initializeAndLoad = async () => {
         try {
            setLoading(true);
            // Initialize IndexedDB
            await indexedDBService.initDB();
            
            // First ensure we've removed any mock appointments from localStorage
            if (localStorage.getItem("mockAppointments")) {
               console.log("Removing legacy mock appointments data from localStorage");
               localStorage.removeItem("mockAppointments");
            }

            // Check if there are appointments marked as sample data in IndexedDB
            const allAppointments = await indexedDBService.getAllAppointments();
            const sampleAppointments = allAppointments.filter(
               apt => apt._id.startsWith('sample_') || apt._id.startsWith('mock_')
            );
            
            // Remove any sample appointments that might exist
            if (sampleAppointments.length > 0) {
               console.log(`Removing ${sampleAppointments.length} sample appointments from database`);
               for (const apt of sampleAppointments) {
                  await indexedDBService.deleteAppointment(apt._id);
               }
            }

            // Auto-complete any past appointments that should be marked as completed
            await autoCompleteExpiredAppointments();

            // Load appointments
            const currentAppointments = await fetchAppointments();
            
            // Make sure to filter out any appointments that might be marked for deletion
            const filteredAppointments = currentAppointments.filter(apt => !apt.pendingDelete);
            
            setAppointments(filteredAppointments);
         } catch (error) {
            console.error(
               "Error initializing IndexedDB or loading appointments:",
               error
            );
            setError("Failed to load appointments. Please try again later.");
         } finally {
            setLoading(false);
         }
      };

      initializeAndLoad();

      // Set up a listener for the refresh flag
      const checkForRefresh = () => {
         const shouldRefresh = localStorage.getItem("appointmentListShouldRefresh");
         if (shouldRefresh === "true") {
            localStorage.removeItem("appointmentListShouldRefresh");
            handleRefreshAppointments();
         }
      };

      // Check for refresh every 2 seconds
      const refreshInterval = setInterval(checkForRefresh, 2000);

      // Set up a periodic check to auto-complete past appointments
      const checkForPastAppointments = async () => {
         try {
            await autoCompleteExpiredAppointments();
            // If any appointments were updated, they will trigger a refresh through localStorage
         } catch (error) {
            console.error("Error in auto-complete past appointments:", error);
         }
      };

      // Check for past appointments every 60 seconds
      const pastAppointmentsInterval = setInterval(checkForPastAppointments, 60000);

      // Clean up
      return () => {
         clearInterval(refreshInterval);
         clearInterval(pastAppointmentsInterval);
      };
   }, []);

   // Generate week days
   useEffect(() => {
      const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekDays = Array.from({ length: 7 }).map((_, i) =>
         addDays(startDate, i)
      );
      setCurrentWeek(weekDays);

      // Generate month grid
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate2 = startOfWeek(monthStart, { weekStartsOn: 1 });

      const days = [];
      let day = startDate2;

      // Create a 6-week grid (42 days) to ensure we cover the whole month
      for (let i = 0; i < 42; i++) {
         // If the day is from the previous or next month, push null
         const month = day.getMonth();
         const isCurrentMonth = month === monthStart.getMonth();
         days.push(isCurrentMonth ? day : null);
         day = addDays(day, 1);
      }

      setMonthDays(days);
   }, [currentDate]);

   // Navigate functions
   const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
   const goToPrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
   const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
   const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));

   // Function to get appointments for a specific day
   const getAppointmentsForDay = (day: Date | null) => {
      if (!day) return [];

      const dayStr = format(day, "yyyy-MM-dd");
      return appointments.filter((a) => a.date === dayStr);
   };

   // Function to handle switching between list and calendar views
   const switchToListView = () => setViewMode("list");
   const switchToCalendarView = () => setViewMode("calendar");

   // Function to handle appointment click
   const handleAppointmentClick = (appointment: Appointment) => {
      setSelectedAppointment(appointment);
   };

   // Function to close appointment modal
   const closeAppointmentModal = () => {
      setSelectedAppointment(null);
   };

   const handleDeleteAppointment = async (appointmentId: string) => {
      // Show confirmation dialog instead of immediate deletion
      setAppointmentToDelete(appointmentId);
   };

   const handleConfirmDelete = async () => {
      if (!appointmentToDelete) return;
      
      try {
         setIsDeleting(true);
         
         await deleteAppointment(appointmentToDelete, true);
         
         // Update the appointments list
         setAppointments(appointments.filter((apt) => apt._id !== appointmentToDelete));
         
         // Close the modal if the deleted appointment was being viewed
         if (selectedAppointment && selectedAppointment._id === appointmentToDelete) {
            setSelectedAppointment(null);
         }
      } catch (error) {
         console.error(`Error deleting appointment ${appointmentToDelete}:`, error);
         toast.error("Failed to delete appointment");
      } finally {
         setIsDeleting(false);
         setAppointmentToDelete(null); // Close dialog
      }
   };

   const handleCancelDelete = () => {
      setAppointmentToDelete(null);
   };

   const handleRefreshAppointments = async () => {
      try {
         setLoading(true);
         
         // Auto-complete any past appointments
         await autoCompleteExpiredAppointments();
         
         // Then fetch the updated appointments list
         const currentAppointments = await fetchAppointments();
         setAppointments(currentAppointments.filter(apt => !apt.pendingDelete));
      } catch (error) {
         console.error("Error refreshing appointments:", error);
         toast.error("Failed to refresh appointments");
      } finally {
         setLoading(false);
      }
   };

   // Function to determine status color
   const getStatusColor = (status: string | undefined): string => {
      try {
         switch (status) {
            case "Confirmed":
               return "bg-green-500 text-white hover:bg-green-600";
            case "Canceled":
               return "bg-red-500 text-white hover:bg-red-600";
            case "Completed":
               return "bg-blue-500 text-white hover:bg-blue-600";
            case "Pending":
            default:
               return darkMode
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200";
         }
      } catch (error) {
         console.error("Error determining status color:", error);
         return darkMode
            ? "bg-gray-500 text-white hover:bg-gray-600"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200";
      }
   };

   // Function to ensure appointment has a valid status
   const getAppointmentStatus = (appointment: Appointment): AppointmentStatus => {
      // If the appointment has a valid status, return it
      if (appointment.status && statusOptions.includes(appointment.status as AppointmentStatus)) {
         return appointment.status as AppointmentStatus;
      }
      
      // Default to Pending if no valid status
      return "Pending";
   };

   const getCustomerInitial = (appointment: Appointment): string => {
      try {
         // First try to get initial from customerInfo
         if (appointment.customerInfo) {
            if (appointment.customerInfo.firstName && appointment.customerInfo.firstName.length > 0) {
               return appointment.customerInfo.firstName[0].toUpperCase();
            }
            if (appointment.customerInfo.name && appointment.customerInfo.name.length > 0) {
               return appointment.customerInfo.name[0].toUpperCase();
            }
         }

         // Then try to get initial from customer object
         if (typeof appointment.customer === "object" && appointment.customer !== null) {
            const customer = appointment.customer as AppointmentCustomer;
            if (customer.firstName && customer.firstName.length > 0) {
               return customer.firstName[0].toUpperCase();
            }
            if (customer.name && customer.name.length > 0) {
               return customer.name[0].toUpperCase();
            }
         }

         // If all else fails, return first character of the string or default
         if (typeof appointment.customer === 'string' && appointment.customer.length > 0) {
            return appointment.customer[0].toUpperCase();
         }
         
         return "?";
      } catch (error) {
         console.error("Error getting customer initial:", error);
         return "?";
      }
   };

   const getCustomerName = (appointment: Appointment): string => {
      try {
         // First try to get name from customerInfo
         if (appointment.customerInfo) {
            if (appointment.customerInfo.firstName && appointment.customerInfo.lastName) {
               return `${appointment.customerInfo.firstName} ${appointment.customerInfo.lastName}`;
            }
            if (appointment.customerInfo.name) {
               return appointment.customerInfo.name;
            }
         }

         // Then try to get name from customer object
         if (typeof appointment.customer === "object" && appointment.customer !== null) {
            const customer = appointment.customer as AppointmentCustomer;
            if (customer.firstName && customer.lastName) {
               return `${customer.firstName} ${customer.lastName}`;
            }
            if (customer.name) {
               return customer.name;
            }
         }

         // If customer is just a string, return it
         if (typeof appointment.customer === 'string') {
            return appointment.customer;
         }

         return "Unknown Customer";
      } catch (error) {
         console.error("Error getting customer name:", error);
         return "Unknown Customer";
      }
   };

   const getServiceName = (appointment: Appointment): string => {
      try {
         // First try to get name from serviceInfo
         if (appointment.serviceInfo?.name) {
            return appointment.serviceInfo.name;
         }

         // Then try to get name from service object
         if (typeof appointment.service === "object" && appointment.service !== null) {
            const service = appointment.service as { name: string };
            if (service.name) {
               return service.name;
            }
         }

         // If service is just a string, return it
         if (typeof appointment.service === 'string') {
            return appointment.service;
         }

         return "Unknown Service";
      } catch (error) {
         console.error("Error getting service name:", error);
         return "Unknown Service";
      }
   };

   const handleStatusChange = async (
      appointmentId: string,
      newStatus: AppointmentStatus
   ) => {
      try {
         setLoading(true);
         const appointment = appointments.find(
            (apt) => apt._id === appointmentId
         );
         if (!appointment) {
            toast.error("Appointment not found");
            return;
         }

         // Create the update data with all required fields
         const updatedAppointment: AppointmentData = {
            customer: 
               typeof appointment.customer === "object" && appointment.customer !== null
                  ? (appointment.customer as any)._id || appointment.customer
                  : appointment.customer,
            service:
               typeof appointment.service === "object" && appointment.service !== null
                  ? (appointment.service as any)._id || appointment.service
                  : appointment.service,
            date: appointment.date,
            time: appointment.time,
            duration: appointment.duration || "30",
            status: newStatus,
            notes: appointment.notes || "",
            customerInfo: appointment.customerInfo || undefined,
            serviceInfo: appointment.serviceInfo || undefined,
         };

         // Update the appointment
         await updateAppointment(appointmentId, updatedAppointment);

         // Update the local state without requiring a full refresh
         setAppointments(
            appointments.map((apt) => 
               apt._id === appointmentId 
                  ? { ...apt, status: newStatus, pendingSync: true } 
                  : apt
            )
         );

         toast.success("Appointment status updated successfully");
      } catch (error) {
         console.error("Error updating appointment status:", error);
         toast.error("Failed to update appointment status");
      } finally {
         setLoading(false);
         setOpenStatusMenu(null);
      }
   };

   // Filter appointments by selected date
   const filteredAppointments = selectedDate
      ? appointments.filter(
         (appointment) => appointment.date === selectedDate
      )
      : appointments;

   return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
         {/* Decorative element */}
         <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
         
         <div className="relative p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
               <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                     Appointments
                  </h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                     A list of all appointments in your business including their status and details.
                  </p>
               </div>
               <div className="mt-4 sm:mt-0 flex flex-wrap gap-3 items-center">
                  <div className="inline-flex rounded-full shadow-sm">
                     <button
                        type="button"
                        onClick={switchToListView}
                        className={`px-3 py-2 text-sm font-medium rounded-full ${
                           viewMode === "list"
                              ? darkMode
                                 ? "bg-purple-600 text-white hover:bg-purple-700"
                                 : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                              : darkMode
                              ? "glass text-white hover:bg-white/10"
                              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        } transition-all`}
                     >
                        <QueueListIcon className="h-5 w-5" />
                     </button>
                     <button
                        type="button"
                        onClick={switchToCalendarView}
                        className={`px-3 py-2 text-sm font-medium rounded-full ml-2 ${
                           viewMode === "calendar"
                              ? darkMode
                                 ? "bg-purple-600 text-white hover:bg-purple-700"
                                 : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                              : darkMode
                              ? "glass text-white hover:bg-white/10"
                              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        } transition-all`}
                     >
                        <CalendarIcon className="h-5 w-5" />
                     </button>
                  </div>
                  <div
                     className={`border rounded-lg ${
                        darkMode
                           ? "bg-gray-800/50 border-gray-700"
                           : "bg-gray-50 border-gray-300"
                     } p-2`}
                  >
                     <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={`outline-none ${
                           darkMode ? "bg-gray-800/50 text-white" : "bg-gray-50 text-gray-900"
                        }`}
                     />
                  </div>
                  
                  <button
                     onClick={handleRefreshAppointments}
                     disabled={loading}
                     className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                        darkMode
                           ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                           : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                     } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                     <ArrowPathIcon 
                        className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} 
                     />
                     {loading ? "Loading..." : "Refresh"}
                  </button>
                  <Link
                     href="/dashboard/appointments/add"
                     className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                        darkMode
                           ? "bg-purple-600 text-white hover:bg-purple-700"
                           : "bg-purple-600 text-white hover:bg-purple-700"
                     }`}
                  >
                     <PlusIcon className="h-5 w-5 mr-2" />
                     Add Appointment
                  </Link>
               </div>
            </div>

            {/* Loading State */}
            {loading && (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl flex justify-center items-center py-12`}>
                  <LoadingSpinner />
               </div>
            )}

            {/* Error State */}
            {error && (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl`}>
                  <div className={`text-center py-8 ${darkMode ? "text-red-400" : "text-red-600"}`}>
                     {error}
                  </div>
               </div>
            )}

            {/* List View */}
            {!loading && !error && viewMode === "list" ? (
               filteredAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredAppointments.map((appointment) => (
                        <div
                           key={appointment._id}
                           onClick={() => handleAppointmentClick(appointment)}
                           className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl transition-all hover:shadow-lg cursor-pointer`}
                        >
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                 <div
                                    className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-semibold ${
                                       darkMode
                                          ? "bg-purple-600/20 text-purple-400"
                                          : "bg-purple-100 text-purple-600"
                                    }`}
                                 >
                                    {getCustomerInitial(appointment)}
                                 </div>
                                 <div>
                                    <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                                       {getCustomerName(appointment)}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                       {getServiceName(appointment)}
                                    </p>
                                 </div>
                              </div>
                              <div className="relative">
                                 <button
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       setOpenStatusMenu(
                                          openStatusMenu === appointment._id
                                             ? null
                                             : appointment._id
                                       );
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${getStatusColor(appointment.status)} flex items-center gap-1 shadow-sm`}
                                 >
                                    {getAppointmentStatus(appointment)}
                                    <ChevronDownIcon className="h-3 w-3" />
                                 </button>

                                 {openStatusMenu === appointment._id && (
                                    <div
                                       className={`absolute right-0 mt-1 w-32 rounded-md shadow-lg z-50 ${
                                          darkMode
                                             ? "bg-gray-800 border border-gray-700"
                                             : "bg-white border border-gray-200"
                                       }`}
                                    >
                                       <div className="py-1">
                                          {statusOptions.map((status) => (
                                             <button
                                                key={status}
                                                onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleStatusChange(
                                                      appointment._id,
                                                      status as AppointmentStatus
                                                   );
                                                }}
                                                className="block w-full text-left px-2 py-1.5"
                                             >
                                                <span
                                                   className={`inline-block w-full px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}
                                                >
                                                   {status}
                                                </span>
                                             </button>
                                          ))}
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className={`space-y-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              <div className="flex items-center space-x-2">
                                 <CalendarIcon className="h-4 w-4" />
                                 <span>
                                    {format(
                                       parseISO(appointment.date),
                                       "MMMM d, yyyy"
                                    )}
                                 </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                 <ClockIcon className="h-4 w-4" />
                                 <span>{appointment.time}</span>
                              </div>
                              {appointment.notes && (
                                 <div className="flex items-start space-x-2 mt-2">
                                    <ChatBubbleLeftIcon className="h-4 w-4 mt-0.5" />
                                    <span className="text-sm line-clamp-2">
                                       {appointment.notes}
                                    </span>
                                 </div>
                              )}
                           </div>

                           <div className={`flex items-center justify-end space-x-2 mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                              <Link
                                 href={`/dashboard/appointments/${appointment._id}`}
                                 className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                    darkMode
                                       ? "text-purple-400 hover:text-purple-300 bg-purple-600/10 hover:bg-purple-600/20"
                                       : "text-purple-600 hover:text-purple-500 bg-purple-50 hover:bg-purple-100"
                                 }`}
                                 onClick={(e) => e.stopPropagation()}
                              >
                                 <PencilIcon className="h-4 w-4 mr-1.5" />
                                 Edit
                              </Link>
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAppointment(appointment._id);
                                 }}
                                 className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                    darkMode
                                       ? "text-red-400 hover:text-red-300 bg-red-600/10 hover:bg-red-600/20"
                                       : "text-red-600 hover:text-red-500 bg-red-50 hover:bg-red-100"
                                 }`}
                              >
                                 <TrashIcon className="h-4 w-4 mr-1.5" />
                                 Delete
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl`}>
                     <div className="text-center py-12">
                        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                           {selectedDate
                              ? "No appointments found for the selected date."
                              : "No appointments found."}
                        </p>
                     </div>
                  </div>
               )
            ) : !loading && !error && viewMode === "calendar" ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden`}>
                  <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
                     <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {calendarMode === "week"
                           ? "Week Calendar"
                           : `${format(currentDate, "MMMM yyyy")}`}
                     </h3>

                     <div className="flex items-center">
                        {/* Calendar Mode Toggle */}
                        <div className="mr-4 inline-flex space-x-2">
                           <button
                              type="button"
                              onClick={() => setCalendarMode("week")}
                              className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                                 calendarMode === "week"
                                    ? darkMode
                                       ? "bg-purple-600 text-white hover:bg-purple-700"
                                       : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                                    : darkMode
                                    ? "glass text-white hover:bg-white/10"
                                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                              } transition-all`}
                           >
                              Week
                           </button>
                           <button
                              type="button"
                              onClick={() => setCalendarMode("month")}
                              className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                                 calendarMode === "month"
                                    ? darkMode
                                       ? "bg-purple-600 text-white hover:bg-purple-700"
                                       : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                                    : darkMode
                                    ? "glass text-white hover:bg-white/10"
                                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                              } transition-all`}
                           >
                              Month
                           </button>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex space-x-2">
                           <button
                              onClick={
                                 calendarMode === "week"
                                    ? goToPrevWeek
                                    : goToPrevMonth
                              }
                              className={`p-1.5 rounded-full ${
                                 darkMode
                                    ? "hover:bg-white/10"
                                    : "bg-white hover:bg-gray-50 border border-gray-200"
                              } transition-colors`}
                           >
                              <ChevronLeftIcon
                                 className={`h-5 w-5 ${
                                    darkMode ? "text-gray-300" : "text-gray-600"
                                 }`}
                              />
                           </button>
                           <button
                              onClick={
                                 calendarMode === "week"
                                    ? goToNextWeek
                                    : goToNextMonth
                              }
                              className={`p-1.5 rounded-full ${
                                 darkMode
                                    ? "hover:bg-white/10"
                                    : "bg-white hover:bg-gray-50 border border-gray-200"
                              } transition-colors`}
                           >
                              <ChevronRightIcon
                                 className={`h-5 w-5 ${
                                    darkMode ? "text-gray-300" : "text-gray-600"
                                 }`}
                              />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Week or Month Calendar Rendering - Keeping the original implementation for now */}
                  {/* ... existing calendar code continues here ... */}
                  {calendarMode === "week" ? (
                     <>
                        {/* Week Calendar View */}
                        {/* Calendar Week Header */}
                        <div className="grid grid-cols-7 border-b border-white/10">
                           {currentWeek.map((day, i) => (
                              <div
                                 key={i}
                                 className={`px-2 py-3 text-center ${
                                    isSameDay(day, new Date())
                                       ? "bg-indigo-900/30 text-white font-medium"
                                       : "text-gray-400"
                                 }`}
                              >
                                 <p className="text-xs uppercase">
                                    {format(day, "EEE")}
                                 </p>
                                 <p className="text-sm mt-1">{format(day, "d")}</p>
                              </div>
                           ))}
                        </div>

                        {/* Calendar Content */}
                        <div className="grid grid-cols-7 min-h-[300px]">
                           {currentWeek.map((day, dayIndex) => {
                              const dayAppointments = getAppointmentsForDay(day);

                              return (
                                 <div
                                    key={dayIndex}
                                    className={`border-r border-white/10 last:border-r-0 ${
                                       isSameDay(day, new Date())
                                          ? "bg-indigo-900/10"
                                          : ""
                                    }`}
                                 >
                                    {dayAppointments.length > 0 ? (
                                       <div className="p-2 space-y-2">
                                          {dayAppointments.map((apt, i) => (
                                             <div
                                                key={i}
                                                onClick={() =>
                                                   handleAppointmentClick(apt)
                                                }
                                                className={`p-2 rounded-md text-xs cursor-pointer transition-colors shadow-sm ${
                                                   getStatusColor(apt.status)
                                                }`}
                                             >
                                                <div className="flex items-center space-x-1">
                                                   <div className="h-5 w-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 text-xs">
                                                      {getCustomerInitial(apt)}
                                                   </div>
                                                   <p className="font-medium text-white truncate">
                                                      {getCustomerName(apt)}
                                                   </p>
                                                </div>
                                                <div className="mt-1 text-gray-300">
                                                   {getServiceName(apt)}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    ) : (
                                       <div className="h-full flex items-center justify-center text-xs text-gray-500 p-2 text-center">
                                          No appointments
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </>
                  ) : (
                     <>
                        {/* Month Calendar View */}
                        {/* Calendar Month Header */}
                        <div className="grid grid-cols-7 border-b border-white/10">
                           {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                              (day, i) => (
                                 <div
                                    key={i}
                                    className="px-2 py-3 text-center text-gray-400"
                                 >
                                    <p className="text-xs uppercase">{day}</p>
                                 </div>
                              )
                           )}
                        </div>

                        {/* Calendar Month Content */}
                        <div className="grid grid-cols-7 grid-rows-6 min-h-[500px]">
                           {monthDays.map((day, dayIndex) => {
                              const dayAppointments = getAppointmentsForDay(day);
                              const isToday = day
                                 ? isSameDay(day, new Date())
                                 : false;

                              return (
                                 <div
                                    key={dayIndex}
                                    className={`border-r border-b border-white/10 last:border-r-0 ${
                                       isToday ? "bg-indigo-900/10" : ""
                                    } ${day ? "" : "opacity-30 bg-gray-800/20"}`}
                                 >
                                    {day && (
                                       <>
                                          <div
                                             className={`p-1 text-right ${
                                                isToday
                                                   ? "text-white font-medium"
                                                   : "text-gray-400"
                                             }`}
                                          >
                                             <span className="text-xs">
                                                {format(day, "d")}
                                             </span>
                                          </div>

                                          <div className="p-1">
                                             {dayAppointments.length > 0 ? (
                                                <div className="space-y-1">
                                                   {dayAppointments
                                                      .slice(0, 2)
                                                      .map((apt, i) => (
                                                         <div
                                                            key={i}
                                                            onClick={() =>
                                                               handleAppointmentClick(
                                                                  apt
                                                               )
                                                            }
                                                            className={`p-1 rounded-sm text-xs cursor-pointer transition-colors shadow-sm ${
                                                               getStatusColor(apt.status)
                                                            } truncate`}
                                                         >
                                                            <div className="flex items-center space-x-1">
                                                               <div className="h-3 w-3 rounded-full bg-white border border-gray-200 flex items-center justify-center"></div>
                                                               <p className="font-medium text-white truncate text-[10px]">
                                                                  {getCustomerName(
                                                                     apt
                                                                  )}
                                                               </p>
                                                            </div>
                                                         </div>
                                                      ))}
                                                   {dayAppointments.length > 2 && (
                                                      <div className="text-[10px] text-center text-indigo-400">
                                                         +
                                                         {dayAppointments.length -
                                                             2}{" "}
                                                         more
                                                      </div>
                                                   )}
                                                </div>
                                             ) : (
                                                <div className="h-full"></div>
                                             )}
                                          </div>
                                       </>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </>
                  )}

                  {/* End of calendar view */}
                  <div className={`border-t ${darkMode ? "border-white/10" : "border-gray-200"} px-4 py-3 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                     Click on any appointment to view details or{" "}
                     <Link
                        href="/dashboard/appointments/add"
                        className={`${darkMode ? "text-purple-400" : "text-purple-600"} hover:underline`}
                     >
                        add a new one
                     </Link>
                  </div>
               </div>
            ) : null}

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
               <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
                  <div
                     className={`relative w-full max-w-md mx-auto p-6 rounded-lg shadow-xl ${
                        darkMode ? "bg-gray-900/90 border border-white/10" : "bg-white border border-gray-200"
                     }`}
                  >
                     <button
                        className={`absolute top-3 right-3 ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                        onClick={closeAppointmentModal}
                     >
                        <XMarkIcon className="h-6 w-6" />
                     </button>

                     <h3
                        className={`text-xl font-bold mb-4 ${
                           darkMode ? "text-white" : "text-gray-900"
                        }`}
                     >
                        Appointment Details
                     </h3>

                     <div className="mb-4 flex items-center">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                           darkMode
                              ? "bg-purple-600/20 text-purple-400"
                              : "bg-purple-100 text-purple-600"
                        }`}>
                           <span className="text-xl font-semibold">
                              {getCustomerInitial(selectedAppointment)}
                           </span>
                        </div>
                        <div className="ml-4">
                           <div
                              className={`text-lg font-medium ${
                                 darkMode ? "text-white" : "text-gray-900"
                              }`}
                           >
                              {getCustomerName(selectedAppointment)}
                           </div>
                           <div
                              className={`${
                                 darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                           >
                              {getServiceName(selectedAppointment)}
                           </div>
                        </div>
                     </div>

                     <div
                        className={`grid grid-cols-2 gap-4 mb-4 text-sm ${
                           darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                     >
                        <div>
                           <div className="font-medium mb-1">Date</div>
                           <div>{selectedAppointment.date}</div>
                        </div>
                        <div>
                           <div className="font-medium mb-1">Time</div>
                           <div>{selectedAppointment.time}</div>
                        </div>
                        <div>
                           <div className="font-medium mb-1">Status</div>
                           <div>
                              <span
                                 className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ${
                                    getStatusColor(selectedAppointment.status)
                                 }`}
                              >
                                 {selectedAppointment.status}
                              </span>
                           </div>
                        </div>
                     </div>

                     {selectedAppointment.notes && (
                        <div
                           className={`mb-4 text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                           }`}
                        >
                           <div className="font-medium mb-1">Notes</div>
                           <div
                              className={`p-3 rounded-md ${
                                 darkMode ? "bg-gray-800/70" : "bg-gray-50"
                              }`}
                           >
                              {selectedAppointment.notes}
                           </div>
                        </div>
                     )}

                     <div className="flex justify-end space-x-3 mt-6">
                        <button
                           onClick={closeAppointmentModal}
                           className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              darkMode
                                 ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                 : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                           } transition-colors`}
                        >
                           Close
                        </button>
                        <Link
                           href={`/dashboard/appointments/${selectedAppointment._id}`}
                           className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              darkMode
                                 ? "bg-purple-600 text-white hover:bg-purple-700"
                                 : "bg-purple-600 text-white hover:bg-purple-700"
                           } transition-colors`}
                        >
                           Edit Appointment
                        </Link>
                        <button
                           onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                           className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              darkMode
                                 ? "bg-red-600/20 text-red-400 hover:bg-red-600/40"
                                 : "bg-red-50 text-red-600 hover:bg-red-100"
                           } transition-colors`}
                        >
                           Delete
                        </button>
                     </div>
                  </div>
               </div>
            )}

            <DeleteAppointmentDialog
               isOpen={appointmentToDelete !== null}
               onClose={handleCancelDelete}
               onConfirm={handleConfirmDelete}
               darkMode={darkMode}
               isDeleting={isDeleting}
            />
         </div>
      </div>
   );
}
