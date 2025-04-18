"use client";

import { useState, useEffect } from "react";
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
   const { darkMode } = useTheme();
   const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
   const [calendarMode, setCalendarMode] = useState("week"); // 'week' or 'month'
   const [currentDate, setCurrentDate] = useState(new Date());
   const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
   const [monthDays, setMonthDays] = useState<(Date | null)[]>([]);
   const [selectedAppointment, setSelectedAppointment] =
      useState<Appointment | null>(null);
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [loading, setLoading] = useState(false);
   const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);

   // Initialize IndexedDB and load appointments
   useEffect(() => {
      const initializeAndLoad = async () => {
         try {
            setLoading(true);
            // Initialize IndexedDB
            await indexedDBService.initDB();

            // Load appointments
            const currentAppointments = await fetchAppointments();
            setAppointments(currentAppointments);
         } catch (error) {
            console.error(
               "Error initializing IndexedDB or loading appointments:",
               error
            );
            toast.error("Failed to load appointments");
         } finally {
            setLoading(false);
         }
      };

      initializeAndLoad();
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
      try {
         await deleteAppointment(appointmentId);
         setAppointments(
            appointments.filter((apt: Appointment) => apt._id !== appointmentId)
         );
         setSelectedAppointment(null); // Close modal if open
      } catch (error) {
         console.error("Error deleting appointment:", error);
      }
   };

   const handleRefreshAppointments = async () => {
      setLoading(true);
      try {
         const currentAppointments = await fetchAppointments();
         setAppointments(currentAppointments);
      } catch (error) {
         console.error("Error refreshing appointments:", error);
      } finally {
         setLoading(false);
      }
   };

   // Function to determine status color
   const getStatusColor = (status: string | undefined): string => {
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
   };

   const getCustomerInitial = (appointment: Appointment): string => {
      // First try to get initial from customerInfo
      if (appointment.customerInfo) {
         if (appointment.customerInfo.firstName) {
            return appointment.customerInfo.firstName[0];
         }
         if (appointment.customerInfo.name) {
            return appointment.customerInfo.name[0];
         }
      }

      // Then try to get initial from customer object
      if (
         typeof appointment.customer === "object" &&
         appointment.customer !== null
      ) {
         const customer = appointment.customer as AppointmentCustomer;
         return customer.firstName?.[0] || "?";
      }

      return "?";
   };

   const getCustomerName = (appointment: Appointment): string => {
      // First try to get name from customerInfo
      if (appointment.customerInfo) {
         if (
            appointment.customerInfo.firstName &&
            appointment.customerInfo.lastName
         ) {
            return `${appointment.customerInfo.firstName} ${appointment.customerInfo.lastName}`;
         }
         if (appointment.customerInfo.name) {
            return appointment.customerInfo.name;
         }
      }

      // Then try to get name from customer object
      if (
         typeof appointment.customer === "object" &&
         appointment.customer !== null
      ) {
         const customer = appointment.customer as AppointmentCustomer;
         return `${customer.firstName} ${customer.lastName}`;
      }

      return "Unknown Customer";
   };

   const getServiceName = (appointment: Appointment): string => {
      // First try to get name from serviceInfo
      if (appointment.serviceInfo?.name) {
         return appointment.serviceInfo.name;
      }

      // Then try to get name from service object
      if (
         typeof appointment.service === "object" &&
         appointment.service !== null
      ) {
         const service = appointment.service as { name: string };
         return service.name;
      }

      return "Unknown Service";
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
         if (!appointment) return;

         // Create the update data with all required fields
         const updatedAppointment: AppointmentData = {
            customer:
               typeof appointment.customer === "object" &&
               appointment.customer !== null
                  ? (appointment.customer as Customer)._id
                  : (appointment.customer as string),
            service:
               typeof appointment.service === "object" &&
               appointment.service !== null
                  ? (appointment.service as Service)._id
                  : (appointment.service as string),
            date: appointment.date,
            time: appointment.time,
            duration: appointment.duration,
            status: newStatus,
            notes: appointment.notes || "",
            customerInfo: appointment.customerInfo,
            serviceInfo: appointment.serviceInfo,
         };

         // Update the appointment
         const result = await updateAppointment(
            appointmentId,
            updatedAppointment
         );

         // Refresh the appointments list to get the latest data
         const refreshedAppointments = await fetchAppointments();
         setAppointments(refreshedAppointments);

         toast.success("Appointment status updated successfully");
      } catch (error) {
         console.error("Error updating appointment status:", error);
         toast.error("Failed to update appointment status");
      } finally {
         setLoading(false);
         setOpenStatusMenu(null);
      }
   };

   return (
      <div className="space-y-6 animate-fadeIn">
         <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
               <h1 className="text-2xl font-semibold text-white">
                  Appointments
               </h1>
               <p className="mt-2 text-sm text-gray-300">
                  A list of all appointments in your business including their
                  status and details.
               </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center space-x-4">
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
               <button
                  onClick={handleRefreshAppointments}
                  disabled={loading}
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:scale-105 ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100"
                  }`}
               >
                  <ArrowPathIcon
                     className={`h-5 w-5 mr-1 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "Refreshing..." : "Refresh"}
               </button>
               <Link
                  href="/dashboard/appointments/add"
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:scale-105 ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Appointment
               </Link>
            </div>
         </div>

         {loading && (
            <div className="flex justify-center items-center">
               <LoadingSpinner />
            </div>
         )}

         {viewMode === "list" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {appointments.map((appointment) => (
                  <div
                     key={appointment._id}
                     onClick={() => handleAppointmentClick(appointment)}
                     className={`rounded-lg border transition-all hover:shadow-lg cursor-pointer ${
                        darkMode
                           ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                           : "bg-white border-gray-200 hover:bg-gray-50"
                     }`}
                  >
                     <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center space-x-3">
                              <div
                                 className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                                    darkMode
                                       ? "bg-purple-600/20 text-purple-400"
                                       : "bg-purple-100 text-purple-600"
                                 }`}
                              >
                                 {getCustomerInitial(appointment)}
                              </div>
                              <div>
                                 <h3
                                    className={`text-lg font-semibold ${
                                       darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                 >
                                    {getCustomerName(appointment)}
                                 </h3>
                                 <p
                                    className={`text-sm ${
                                       darkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                    }`}
                                 >
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
                                 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    appointment.status === "Confirmed"
                                       ? "bg-green-500 text-white hover:bg-green-600"
                                       : appointment.status === "Canceled"
                                       ? "bg-red-500 text-white hover:bg-red-600"
                                       : appointment.status === "Completed"
                                       ? "bg-blue-500 text-white hover:bg-blue-600"
                                       : darkMode
                                       ? "bg-amber-500 text-white hover:bg-amber-600"
                                       : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                 } flex items-center gap-1 shadow-sm`}
                              >
                                 {appointment.status}
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
                                                   status
                                                );
                                             }}
                                             className="block w-full text-left px-2 py-1.5"
                                          >
                                             <span
                                                className={`inline-block w-full px-2 py-1 rounded text-xs font-medium ${
                                                   status === "Confirmed"
                                                      ? "bg-green-500 text-white hover:bg-green-600"
                                                      : status === "Canceled"
                                                      ? "bg-red-500 text-white hover:bg-red-600"
                                                      : status === "Completed"
                                                      ? "bg-blue-500 text-white hover:bg-blue-600"
                                                      : darkMode
                                                      ? "bg-amber-500 text-white hover:bg-amber-600"
                                                      : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                }`}
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

                        <div
                           className={`space-y-2 text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                           }`}
                        >
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

                        <div
                           className={`flex items-center justify-end space-x-2 mt-4 pt-4 border-t ${
                              darkMode ? "border-gray-700" : "border-gray-200"
                           }`}
                        >
                           <Link
                              href={`/dashboard/appointments/${appointment._id}`}
                              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                 darkMode
                                    ? "text-purple-400 hover:text-purple-300 bg-purple-600/10 hover:bg-purple-600/20"
                                    : "text-purple-600 hover:text-purple-500 bg-purple-50 hover:bg-purple-100"
                              }`}
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
                  </div>
               ))}
            </div>
         ) : (
            <div className="glass border border-white/10 rounded-xl shadow-lg overflow-hidden">
               <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-lg font-medium leading-6 text-white gradient-text">
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
                                                apt.status === "Confirmed"
                                                   ? "bg-green-500 text-white hover:bg-green-600"
                                                   : apt.status === "Canceled"
                                                   ? "bg-red-500 text-white hover:bg-red-600"
                                                   : apt.status === "Completed"
                                                   ? "bg-blue-500 text-white hover:bg-blue-600"
                                                   : darkMode
                                                   ? "bg-amber-500 text-white hover:bg-amber-600"
                                                   : "bg-amber-100 text-amber-800 hover:bg-amber-200"
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
                                                            apt.status ===
                                                            "Confirmed"
                                                               ? "bg-green-500 text-white hover:bg-green-600"
                                                               : apt.status ===
                                                                 "Canceled"
                                                               ? "bg-red-500 text-white hover:bg-red-600"
                                                               : apt.status ===
                                                                 "Completed"
                                                               ? "bg-blue-500 text-white hover:bg-blue-600"
                                                               : darkMode
                                                               ? "bg-amber-500 text-white hover:bg-amber-600"
                                                               : "bg-amber-100 text-amber-800 hover:bg-amber-200"
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

               <div className="border-t border-white/10 px-4 py-3 text-xs text-gray-400">
                  Click on any appointment to view details or{" "}
                  <Link
                     href="/dashboard/appointments/add"
                     className="text-indigo-400 hover:underline"
                  >
                     add a new one
                  </Link>
               </div>
            </div>
         )}

         {/* Appointment Detail Modal */}
         {selectedAppointment && (
            <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
               <div
                  className={`relative w-full max-w-md mx-auto p-6 rounded-lg shadow-xl ${
                     darkMode ? "bg-gray-900" : "bg-white"
                  }`}
               >
                  <button
                     className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
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
                     <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-900 font-medium text-lg">
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
                                 selectedAppointment.status === "Confirmed"
                                    ? "bg-green-500 text-white"
                                    : selectedAppointment.status === "Canceled"
                                    ? "bg-red-500 text-white"
                                    : "bg-amber-500 text-white"
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
                              darkMode ? "bg-gray-800" : "bg-gray-100"
                           }`}
                        >
                           {selectedAppointment.notes}
                        </div>
                     </div>
                  )}

                  <div className="flex justify-end space-x-3 mt-6">
                     <button
                        onClick={closeAppointmentModal}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                           darkMode
                              ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } transition-colors`}
                     >
                        Close
                     </button>
                     <Link
                        href={`/dashboard/appointments/edit/${selectedAppointment._id}`}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                           darkMode
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                        } transition-colors`}
                     >
                        Edit Appointment
                     </Link>
                     <button
                        onClick={() =>
                           handleDeleteAppointment(selectedAppointment._id)
                        }
                        className={`px-4 py-2 text-sm font-medium ${
                           darkMode
                              ? "text-red-400 hover:text-red-300"
                              : "text-red-600 hover:text-red-700"
                        } transition-colors`}
                     >
                        Delete
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
