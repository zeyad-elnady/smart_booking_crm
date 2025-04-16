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
import { appointmentService, Appointment } from "@/lib/appointmentService";

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

   // Load appointments
   useEffect(() => {
      const loadAppointments = () => {
         const allAppointments = appointmentService.getAll();
         setAppointments(allAppointments);
      };

      loadAppointments();
      // Refresh appointments every minute
      const interval = setInterval(loadAppointments, 60000);
      return () => clearInterval(interval);
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
         await appointmentService.delete(appointmentId);
         setAppointments(
            appointments.filter((apt) => apt.id !== appointmentId)
         );
         setSelectedAppointment(null); // Close modal if open
      } catch (error) {
         console.error("Error deleting appointment:", error);
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
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3">
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
               <Link
                  href="/dashboard/appointments/add"
                  className={`block rounded-full px-4 py-2 text-center text-sm font-semibold shadow-sm transition-all hover:scale-105 flex items-center ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200"
                  }`}
               >
                  <PlusIcon className="h-5 w-5 inline-block mr-1" />
                  Add Appointment
               </Link>
            </div>
         </div>

         {viewMode === "list" ? (
            <div className="glass border border-white/10 rounded-xl shadow-lg">
               <div className="px-5 py-5">
                  <h3 className="text-lg font-medium leading-6 text-white gradient-text">
                     Today's Schedule
                  </h3>
               </div>
               <div className="border-t border-white/10">
                  <ul role="list" className="divide-y divide-white/10">
                     {appointments.map((appointment) => (
                        <li
                           key={appointment.id}
                           className="px-5 py-5 hover:bg-white/5 transition-colors"
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                 <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                       <span className="text-gray-900 font-medium">
                                          {appointment.customer.initial}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="ml-4">
                                    <div className="text-sm font-medium text-white">
                                       {appointment.customer.name}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                       {appointment.service}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                 <div className="text-sm text-gray-400">
                                    {appointment.time} ({appointment.duration})
                                 </div>
                                 <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r ${appointment.statusColor} text-white`}
                                 >
                                    {appointment.status}
                                 </span>
                                 <Link
                                    href={`/dashboard/appointments/edit/${appointment.id}`}
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                 >
                                    Edit
                                 </Link>
                                 <button
                                    onClick={() =>
                                       handleDeleteAppointment(appointment.id)
                                    }
                                    className={`transition-colors ${
                                       darkMode
                                          ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                          : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                    }`}
                                 >
                                    Delete
                                 </button>
                              </div>
                           </div>
                        </li>
                     ))}
                  </ul>
               </div>
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
                                             className={`p-2 rounded-md text-xs bg-gradient-to-r ${apt.statusColor} bg-opacity-20 hover:bg-opacity-30 cursor-pointer transition-all`}
                                          >
                                             <div className="flex items-center space-x-1">
                                                <div className="h-5 w-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 text-xs">
                                                   {apt.customer.initial}
                                                </div>
                                                <p className="font-medium text-white truncate">
                                                   {apt.customer.name}
                                                </p>
                                             </div>
                                             <div className="mt-1 text-gray-300">
                                                {apt.time} - {apt.service}
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
                                                         className={`p-1 rounded-sm text-xs bg-gradient-to-r ${apt.statusColor} bg-opacity-20 hover:bg-opacity-30 cursor-pointer transition-all truncate`}
                                                      >
                                                         <div className="flex items-center space-x-1">
                                                            <div className="h-3 w-3 rounded-full bg-white border border-gray-200 flex items-center justify-center"></div>
                                                            <p className="font-medium text-white truncate text-[10px]">
                                                               {apt.time}{" "}
                                                               {
                                                                  apt.customer
                                                                     .name
                                                               }
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
                           {selectedAppointment.customer.initial}
                        </span>
                     </div>
                     <div className="ml-4">
                        <div
                           className={`text-lg font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                           }`}
                        >
                           {selectedAppointment.customer.name}
                        </div>
                        <div
                           className={`${
                              darkMode ? "text-gray-400" : "text-gray-600"
                           }`}
                        >
                           {selectedAppointment.service}
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
                        <div className="font-medium mb-1">Duration</div>
                        <div>{selectedAppointment.duration}</div>
                     </div>
                     <div>
                        <div className="font-medium mb-1">Status</div>
                        <div>
                           <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r ${selectedAppointment.statusColor} text-white`}
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
                        href={`/dashboard/appointments/edit/${selectedAppointment.id}`}
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
                           handleDeleteAppointment(selectedAppointment.id)
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                           darkMode
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-red-100 text-red-600 hover:bg-red-200"
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
