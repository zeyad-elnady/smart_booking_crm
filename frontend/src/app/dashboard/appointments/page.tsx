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
import { useLanguage } from "@/context/LanguageContext";
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
   Day
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
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
import { toast } from "react-hot-toast";
import { testConnections } from "@/services/api";
import { indexedDBService } from "@/services/indexedDB";
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
   const { t, language } = useLanguage();
   const isRTL = language === 'ar';
   const locale = language === 'ar' ? ar : enUS;
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
   const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));
   const [error, setError] = useState<string | null>(null);
   const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);

   // Initialize IndexedDB and load appointments
   useEffect(() => {
      const initializeAndLoad = async () => {
         try {
            setLoading(true);
            setError(null);
            console.log("Initializing IndexedDB and loading appointments");
            
            // Initialize IndexedDB
            await indexedDBService.initDB();
            
            // First ensure we've removed any mock appointments from localStorage
            if (localStorage.getItem("mockAppointments")) {
               console.log("Removing legacy mock appointments data from localStorage");
               localStorage.removeItem("mockAppointments");
            }

            // Check if there are appointments marked as sample data in IndexedDB
            const allAppointments = await indexedDBService.getAllAppointments();
            console.log(`Found ${allAppointments.length} appointments in IndexedDB`);
            
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
            console.log("Fetching appointments from service");
            const currentAppointments = await fetchAppointments();
            
            // Make sure to filter out any appointments that might be marked for deletion
            const filteredAppointments = currentAppointments.filter(apt => !apt.pendingDelete);
            console.log(`Setting ${filteredAppointments.length} appointments to state`);
            
            setAppointments(filteredAppointments);
            if (filteredAppointments.length === 0) {
               console.log("No appointments found");
            }
         } catch (error) {
            console.error(
               "Error initializing IndexedDB or loading appointments:",
               error
            );
            setError("Failed to load appointments. Please try again later.");
         } finally {
            console.log("Finished loading appointments");
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
      // Use the weekStartsOn property from the locale or fallback to Monday (1)
      const weekStartsOption = { weekStartsOn: 1 as Day, locale };
      const startDate = startOfWeek(currentDate, weekStartsOption);
      const weekDays = Array.from({ length: 7 }).map((_, i) =>
         addDays(startDate, i)
      );
      setCurrentWeek(weekDays);

      // Generate month grid with locale
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate2 = startOfWeek(monthStart, weekStartsOption);

      const days = [];
      // Create a 6-week grid (42 days) to ensure we cover the whole month
      for (let i = 0; i < 42; i++) {
         const day = addDays(startDate2, i);
         days.push(day);
      }

      setMonthDays(days);
   }, [currentDate, language]);

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
      ? appointments.filter(appointment => appointment.date === selectedDate)
      : appointments;

   // Use locale in format functions
   const formatWithLocale = (date: Date, formatStr: string) => {
      return format(date, formatStr, { locale });
   };

   return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 overflow-x-hidden relative`}>
         {/* Decorative element */}
         <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`} />
         <div className="relative p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
               <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                     {t("appointments")}
                  </h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                     {t("appointments_list_description")}
                  </p>
               </div>
               <div className="flex items-center space-x-2">
                  <Link
                     href="/dashboard/appointments/add"
                     className={`px-4 py-2 rounded-lg transition flex items-center ${
                        darkMode
                           ? "bg-purple-600 hover:bg-purple-700 text-white"
                           : "bg-purple-600 hover:bg-purple-700 text-white"
                     }`}
                  >
                     <PlusIcon className="h-5 w-5 mr-2" />
                     {t("add_appointment")}
                  </Link>
               </div>
            </div>

            {/* View toggle */}
            <div className="mb-6">
               <div className={`inline-flex rounded-lg overflow-hidden border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                     onClick={switchToListView}
                     className={`px-4 py-2 flex items-center transition ${
                        viewMode === "list"
                           ? darkMode
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-900"
                           : darkMode
                           ? "bg-gray-900 text-gray-400 hover:text-white"
                           : "bg-white text-gray-500 hover:text-gray-700"
                     }`}
                  >
                     <QueueListIcon className="h-5 w-5 mr-2" />
                     {t("list_view")}
                  </button>
                  <button
                     onClick={switchToCalendarView}
                     className={`px-4 py-2 flex items-center transition ${
                        viewMode === "calendar"
                           ? darkMode
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-900"
                           : darkMode
                           ? "bg-gray-900 text-gray-400 hover:text-white"
                           : "bg-white text-gray-500 hover:text-gray-700"
                     }`}
                  >
                     <CalendarIcon className="h-5 w-5 mr-2" />
                     {t("calendar_view")}
                  </button>
               </div>
            </div>

            {/* List view date filtering */}
            {viewMode === "list" && (
               <div className="mb-6 flex flex-wrap items-center gap-4">
                  <div className={`rounded-lg overflow-hidden border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                     <div className="flex items-center">
                        <input
                           type="date"
                           value={selectedDate || format(new Date(), "yyyy-MM-dd")}
                           onChange={(e) => setSelectedDate(e.target.value)}
                           className={`px-4 py-2 ${
                              darkMode
                                 ? "bg-gray-800 text-white border-gray-700"
                                 : "bg-white text-gray-800 border-gray-200"
                           } border-r`}
                        />
                        <button
                           onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
                           className={`px-4 py-2 ${
                              darkMode
                                 ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                 : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                           }`}
                        >
                           {t('today')}
                        </button>
                     </div>
                  </div>
                  <button
                     onClick={() => setSelectedDate(null)}
                     className={`px-4 py-2 rounded-lg transition flex items-center ${
                        !selectedDate
                           ? darkMode
                              ? "bg-purple-600 text-white"
                              : "bg-purple-600 text-white"
                           : darkMode
                           ? "bg-gray-700 text-gray-300"
                           : "bg-gray-100 text-gray-600"
                     }`}
                  >
                     {t('show_all')}
                  </button>
                  <button
                     onClick={handleRefreshAppointments}
                     className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition ${
                        darkMode
                           ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                           : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200"
                     }`}
                  >
                     <ArrowPathIcon
                        className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                     />
                     {loading ? t("refreshing") : t("refresh")}
                  </button>
                  <div className="text-sm ml-2">
                     {selectedDate ? (
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                           {t('showing_appointments_for')} {format(parseISO(selectedDate), "MMMM d, yyyy")}
                        </span>
                     ) : (
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                           {t('showing_all_appointments')}
                        </span>
                     )}
                  </div>
               </div>
            )}

            {/* Calendar view controls */}
            {viewMode === "calendar" && (
               <div className="mb-6">
                  <div className="flex justify-between items-center">
                     <div className={`inline-flex rounded-lg overflow-hidden border ${darkMode ? "border-gray-700" : "border-gray-200"} mr-4`}>
                        <button
                           onClick={() => setCalendarMode("week")}
                           className={`px-4 py-2 flex items-center transition ${
                              calendarMode === "week"
                                 ? darkMode
                                    ? "bg-gray-800 text-white"
                                    : "bg-gray-100 text-gray-900"
                                 : darkMode
                                 ? "bg-gray-900 text-gray-400 hover:text-white"
                                 : "bg-white text-gray-500 hover:text-gray-700"
                           }`}
                        >
                           {t("week_view")}
                        </button>
                        <button
                           onClick={() => setCalendarMode("month")}
                           className={`px-4 py-2 flex items-center transition ${
                              calendarMode === "month"
                                 ? darkMode
                                    ? "bg-gray-800 text-white"
                                    : "bg-gray-100 text-gray-900"
                                 : darkMode
                                 ? "bg-gray-900 text-gray-400 hover:text-white"
                                 : "bg-white text-gray-500 hover:text-gray-700"
                           }`}
                        >
                           {t("month_view")}
                        </button>
                     </div>
                     <div className="flex items-center">
                        {calendarMode === "week" ? (
                           <>
                              <button
                                 onClick={goToPrevWeek}
                                 className={`p-2 rounded-full ${
                                    darkMode
                                       ? "hover:bg-gray-800"
                                       : "hover:bg-gray-100"
                                 }`}
                              >
                                 <ChevronLeftIcon className="h-5 w-5" />
                              </button>
                              <span className={`mx-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                                 {format(currentWeek[0], "MMMM d")} - {format(currentWeek[6], "MMMM d, yyyy")}
                              </span>
                              <button
                                 onClick={goToNextWeek}
                                 className={`p-2 rounded-full ${
                                    darkMode
                                       ? "hover:bg-gray-800"
                                       : "hover:bg-gray-100"
                                 }`}
                              >
                                 <ChevronRightIcon className="h-5 w-5" />
                              </button>
                           </>
                        ) : (
                           <>
                              <button
                                 onClick={goToPrevMonth}
                                 className={`p-2 rounded-full ${
                                    darkMode
                                       ? "hover:bg-gray-800"
                                       : "hover:bg-gray-100"
                                 }`}
                              >
                                 <ChevronLeftIcon className="h-5 w-5" />
                              </button>
                              <span className={`mx-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                                 {format(currentDate, "MMMM yyyy")}
                              </span>
                              <button
                                 onClick={goToNextMonth}
                                 className={`p-2 rounded-full ${
                                    darkMode
                                       ? "hover:bg-gray-800"
                                       : "hover:bg-gray-100"
                                 }`}
                              >
                                 <ChevronRightIcon className="h-5 w-5" />
                              </button>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {/* Content */}
            {error ? (
               <div className={`p-4 rounded-lg ${darkMode ? "bg-red-900/20 text-red-200" : "bg-red-100 text-red-600"}`}>
                  {error}
               </div>
            ) : loading ? (
               <div className="flex justify-center py-12">
                  <LoadingSpinner size="large" />
               </div>
            ) : appointments.length === 0 ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden`}>
                  {viewMode === "calendar" ? (
                     <>
                        {calendarMode === "week" ? (
                           // Week view with no appointments
                           <>
                              <div className={`grid grid-cols-7 border-b ${darkMode ? "border-white/10" : "border-gray-200"} ${isRTL ? "direction-rtl" : ""}`}>
                                 {currentWeek.map((day, i) => (
                                    <div
                                       key={i}
                                       className={`px-2 py-3 text-center ${
                                          isSameDay(day, new Date())
                                             ? darkMode 
                                               ? "bg-indigo-900/30 text-white font-medium" 
                                               : "bg-indigo-50 text-indigo-800 font-medium"
                                             : darkMode 
                                               ? "text-gray-400" 
                                               : "text-gray-600"
                                       }`}
                                    >
                                       <p className="text-xs uppercase">
                                          {formatWithLocale(day, "EEE")}
                                       </p>
                                       <p className="text-sm mt-1">{formatWithLocale(day, "d")}</p>
                                    </div>
                                 ))}
                              </div>
                              <div className={`grid grid-cols-7 min-h-[400px] ${isRTL ? "direction-rtl" : ""}`}>
                                 {currentWeek.map((_, i) => (
                                    <div key={i} className={`border-r ${darkMode ? "border-white/10" : "border-gray-200"} last:border-r-0 min-h-[350px]`}>
                                       <div className="h-full flex items-center justify-center">
                                          <div className="text-center">
                                             <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                             <p className="text-sm text-gray-500">{t("no_appointments")}</p>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </>
                        ) : (
                           // Month view with no appointments
                           <>
                              <div className={`grid grid-cols-7 border-b ${darkMode ? "border-white/10" : "border-gray-200"} ${isRTL ? "direction-rtl" : ""}`}>
                                 {isRTL ? 
                                   ["الأحد", "السبت", "الجمعة", "الخميس", "الأربعاء", "الثلاثاء", "الإثنين"].map(
                                      (day, i) => (
                                         <div
                                            key={i}
                                            className={`px-2 py-3 text-center ${
                                               darkMode ? "text-gray-400" : "text-gray-600"
                                            }`}
                                         >
                                            <p className="text-xs uppercase">{day}</p>
                                         </div>
                                      )
                                   ) :
                                   ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                                      (day, i) => (
                                         <div
                                            key={i}
                                            className={`px-2 py-3 text-center ${
                                               darkMode ? "text-gray-400" : "text-gray-600"
                                            }`}
                                         >
                                            <p className="text-xs uppercase">{day}</p>
                                         </div>
                                      )
                                   )
                                 }
                              </div>
                              
                              {/* Month Grid for Empty State - Calculate and show the actual month grid */}
                              <div className={`grid grid-cols-7 grid-rows-6 min-h-[500px] relative ${isRTL ? "direction-rtl" : ""}`}>
                                 {Array(42).fill(null).map((_, index) => {
                                    // Calculate the day for this cell
                                    const startOfMonthDate = startOfMonth(currentDate);
                                    const startDate = startOfWeek(startOfMonthDate, { weekStartsOn: 1 as Day, locale });
                                    const day = addDays(startDate, index);
                                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                    const isToday = isSameDay(day, new Date());
                                    
                                    return (
                                       <div
                                          key={index}
                                          className={`border-r border-b min-h-[80px] ${darkMode ? "border-white/10" : "border-gray-200"} 
                                             ${isToday ? (darkMode ? "bg-indigo-900/10" : "bg-indigo-50/30") : ""} 
                                             ${!isCurrentMonth ? (darkMode ? "opacity-30 bg-gray-800/20" : "opacity-30 bg-gray-100") : ""}`}
                                       >
                                          {/* Date number */}
                                          <div className={`p-1 text-right ${
                                             isToday
                                                ? darkMode ? "text-white font-medium" : "text-indigo-800 font-medium"
                                                : !isCurrentMonth
                                                   ? darkMode ? "text-gray-600" : "text-gray-400"
                                                   : darkMode ? "text-gray-400" : "text-gray-600"
                                          }`}>
                                             <span className="text-xs">{format(day, "d")}</span>
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           </>
                        )}
                     </>
                  ) : (
                     // List view with no appointments
                     <div className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">{t("no_appointments")}</h3>
                        <p className="mb-6">{t("add_your_first_appointment")}</p>
                        <Link
                           href="/dashboard/appointments/add"
                           className={`px-4 py-2 rounded-lg transition inline-flex items-center ${
                              darkMode
                                 ? "bg-purple-600 hover:bg-purple-700 text-white"
                                 : "bg-purple-600 hover:bg-purple-700 text-white"
                           }`}
                        >
                           <PlusIcon className="h-5 w-5 mr-2" />
                           {t("add_appointment")}
                        </Link>
                     </div>
                  )}
               </div>
            ) : viewMode === "list" && filteredAppointments.length === 0 ? (
               <div className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                     {selectedDate ? `${t("no_appointments_for_date")} ${format(parseISO(selectedDate), "MMMM d, yyyy")}` : t("no_appointments")}
                  </h3>
                  <p className="mb-6">{t("try_different_date")}</p>
                  <Link
                     href="/dashboard/appointments/add"
                     className={`px-4 py-2 rounded-lg transition inline-flex items-center ${
                        darkMode
                           ? "bg-purple-600 hover:bg-purple-700 text-white"
                           : "bg-purple-600 hover:bg-purple-700 text-white"
                     }`}
                  >
                     <PlusIcon className="h-5 w-5 mr-2" />
                     {t("add_appointment")}
                  </Link>
               </div>
            ) : (
               viewMode === "list" ? (
                  // List view implementation
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
                                    {t(appointment.status?.toLowerCase() || 'pending')}
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
                                                   {t(status.toLowerCase())}
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
                                 href={`/dashboard/appointments/edit/${appointment._id}`}
                                 className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                    darkMode
                                       ? "text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20"
                                       : "text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100"
                                 }`}
                                 onClick={(e) => e.stopPropagation()}
                              >
                                 <PencilIcon className="h-4 w-4 mr-1.5" />
                                 {t("edit")}
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
                                 {t("delete")}
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  // Calendar view implementation
                  <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden`}>
                     {/* Calendar Week Header */}
                     {calendarMode === "week" ? (
                        <>
                           <div className={`grid grid-cols-7 border-b ${darkMode ? "border-white/10" : "border-gray-200"} ${isRTL ? "direction-rtl" : ""}`}>
                              {currentWeek.map((day, i) => (
                                 <div
                                    key={i}
                                    className={`px-2 py-3 text-center ${
                                       isSameDay(day, new Date())
                                          ? darkMode 
                                            ? "bg-indigo-900/30 text-white font-medium" 
                                            : "bg-indigo-50 text-indigo-800 font-medium"
                                          : darkMode 
                                            ? "text-gray-400" 
                                            : "text-gray-600"
                                    }`}
                                 >
                                    <p className="text-xs uppercase">
                                       {formatWithLocale(day, "EEE")}
                                    </p>
                                    <p className="text-sm mt-1">{formatWithLocale(day, "d")}</p>
                                 </div>
                              ))}
                           </div>

                           {/* Calendar Week Content */}
                           <div className={`grid grid-cols-7 min-h-[400px] ${isRTL ? "direction-rtl" : ""}`}>
                              {currentWeek.map((day, dayIndex) => {
                                 const dayAppointments = getAppointmentsForDay(day);

                                 return (
                                    <div
                                       key={dayIndex}
                                       className={`border-r ${darkMode ? "border-white/10" : "border-gray-200"} last:border-r-0 ${
                                          isSameDay(day, new Date())
                                             ? darkMode ? "bg-indigo-900/10" : "bg-indigo-50/30"
                                             : ""
                                       } min-h-[350px]`}
                                    >
                                       {dayAppointments.length > 0 ? (
                                          <div className="p-2 space-y-2">
                                             {dayAppointments.map((apt, i) => (
                                                <div
                                                   key={i}
                                                   onClick={() =>
                                                      handleAppointmentClick(
                                                         apt
                                                      )
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
                                                   <div className="mt-1 text-white/80">
                                                      {apt.time} - {getServiceName(apt)}
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       ) : (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-500 p-2 text-center">
                                             {t("no_appointments")}
                                          </div>
                                       )}
                                    </div>
                                 );
                              })}
                           </div>
                        </>
                     ) : (
                        <>
                           {/* Month Calendar Header */}
                           <div className={`grid grid-cols-7 border-b ${darkMode ? "border-white/10" : "border-gray-200"} ${isRTL ? "direction-rtl" : ""}`}>
                              {isRTL ? 
                                ["الأحد", "السبت", "الجمعة", "الخميس", "الأربعاء", "الثلاثاء", "الإثنين"].map(
                                   (day, i) => (
                                      <div
                                         key={i}
                                         className={`px-2 py-3 text-center ${
                                            darkMode ? "text-gray-400" : "text-gray-600"
                                         }`}
                                      >
                                         <p className="text-xs uppercase">{day}</p>
                                      </div>
                                   )
                                ) :
                                ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                                   (day, i) => (
                                      <div
                                         key={i}
                                         className={`px-2 py-3 text-center ${
                                            darkMode ? "text-gray-400" : "text-gray-600"
                                         }`}
                                      >
                                         <p className="text-xs uppercase">{day}</p>
                                      </div>
                                   )
                                )
                              }
                           </div>

                           {/* Month Calendar Grid */}
                           <div className={`grid grid-cols-7 grid-rows-6 ${isRTL ? "direction-rtl" : ""}`}>
                              {Array(42).fill(null).map((_, index) => {
                                 // Calculate the day for this cell
                                 const startOfMonthDate = startOfMonth(currentDate);
                                 const startDate = startOfWeek(startOfMonthDate, { weekStartsOn: 1 as Day, locale });
                                 const day = addDays(startDate, index);
                                 const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                 const isToday = isSameDay(day, new Date());
                                 const dayAppointments = getAppointmentsForDay(day);
                                 
                                 return (
                                    <div
                                       key={index}
                                       className={`border-r border-b min-h-[90px] ${darkMode ? "border-white/10" : "border-gray-200"} 
                                          ${isToday ? (darkMode ? "bg-indigo-900/10" : "bg-indigo-50/30") : ""} 
                                          ${!isCurrentMonth ? (darkMode ? "opacity-30 bg-gray-800/20" : "opacity-30 bg-gray-100") : ""}`}
                                    >
                                       {/* Date number */}
                                       <div className={`p-1 text-right ${
                                          isToday
                                             ? darkMode ? "text-white font-medium" : "text-indigo-800 font-medium"
                                             : !isCurrentMonth
                                                ? darkMode ? "text-gray-600" : "text-gray-400"
                                                : darkMode ? "text-gray-400" : "text-gray-600"
                                       }`}>
                                          <span className="text-xs">{format(day, "d")}</span>
                                       </div>

                                       {/* Appointments for this day */}
                                       <div className="p-1">
                                          {dayAppointments.length > 0 ? (
                                             <div className="space-y-1">
                                                {dayAppointments
                                                   .slice(0, 2)
                                                   .map((apt, i) => (
                                                      <div
                                                         key={i}
                                                         onClick={() => handleAppointmentClick(apt)}
                                                         className={`p-1 rounded-sm text-xs cursor-pointer transition-colors shadow-sm ${getStatusColor(apt.status)} truncate`}
                                                      >
                                                         <div className="flex items-center space-x-1">
                                                            <div className="h-3 w-3 rounded-full bg-white border border-gray-200 flex items-center justify-center"></div>
                                                            <p className="font-medium text-white truncate text-[10px]">
                                                               {getCustomerName(apt)}
                                                            </p>
                                                         </div>
                                                      </div>
                                                   ))
                                                }
                                                {dayAppointments.length > 2 && (
                                                   <div className="text-[10px] text-center text-indigo-400">
                                                      +{dayAppointments.length - 2} {t("more")}
                                                   </div>
                                                )}
                                             </div>
                                          ) : null}
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </>
                     )}

                     {/* Calendar footer */}
                     <div className={`border-t ${darkMode ? "border-white/10" : "border-gray-200"} px-4 py-3 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {t("click_appointment_to_view")}{" "}
                        <Link
                           href="/dashboard/appointments/add"
                           className={`${darkMode ? "text-purple-400" : "text-purple-600"} hover:underline`}
                        >
                           {t("add_appointment")}
                        </Link>
                     </div>
                  </div>
               )
            )}

            {/* Appointment Details Modal */}
            {selectedAppointment && (
               <div className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-0">
                  <div
                     className="absolute inset-0 bg-black/50"
                     onClick={closeAppointmentModal}
                  ></div>
                  <div
                     className={`relative rounded-2xl shadow-xl max-w-2xl w-full mx-auto overflow-hidden ${
                        darkMode ? "bg-gray-900" : "bg-white"
                     }`}
                  >
                     {/* Appointment details content */}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}