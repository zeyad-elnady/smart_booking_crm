"use client";

import { useState } from "react";
import Link from "next/link";
import {
   PlusIcon,
   QueueListIcon,
   CalendarIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";

export default function Appointments() {
   const { darkMode } = useTheme();

   const appointments = [
      {
         id: 1,
         customer: { name: "John Doe", initial: "J" },
         service: "Haircut",
         time: "10:00 AM",
         duration: "30 min",
         status: "Confirmed",
         statusColor: "from-green-400 to-emerald-500",
      },
      {
         id: 2,
         customer: { name: "Jane Smith", initial: "J" },
         service: "Manicure",
         time: "11:30 AM",
         duration: "45 min",
         status: "Pending",
         statusColor: "from-amber-400 to-yellow-500",
      },
      {
         id: 3,
         customer: { name: "Mike Johnson", initial: "M" },
         service: "Massage",
         time: "2:00 PM",
         duration: "60 min",
         status: "Confirmed",
         statusColor: "from-green-400 to-emerald-500",
      },
   ];

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
               <div className="inline-flex rounded-lg shadow-sm">
                  <button
                     type="button"
                     className={`block rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition-all ${
                        darkMode
                           ? "bg-purple-600 text-white hover:bg-purple-700"
                           : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                     }`}
                  >
                     <QueueListIcon className="h-5 w-5" />
                  </button>
                  <button
                     type="button"
                     className={`block rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition-all ml-px ${
                        darkMode
                           ? "bg-purple-600 text-white hover:bg-purple-700"
                           : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                     }`}
                  >
                     <CalendarIcon className="h-5 w-5" />
                  </button>
               </div>
               <Link
                  href="/dashboard/appointments/add"
                  className={`block rounded-lg px-4 py-2 text-center text-sm font-semibold shadow-sm transition-all hover:scale-105 flex items-center ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  <PlusIcon className="h-5 w-5 inline-block mr-1" />
                  Add Appointment
               </Link>
            </div>
         </div>

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
                                 <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                       darkMode ? "bg-gray-700" : "bg-gray-200"
                                    }`}
                                 >
                                    <span
                                       className={`font-medium ${
                                          darkMode
                                             ? "text-white"
                                             : "text-gray-900"
                                       }`}
                                    >
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
                                 className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    darkMode
                                       ? `bg-gradient-to-r ${appointment.statusColor} text-white`
                                       : appointment.status === "Confirmed"
                                       ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                       : "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20"
                                 }`}
                              >
                                 {appointment.status}
                              </span>
                              <Link
                                 href={`/dashboard/appointments/edit/${appointment.id}`}
                                 className={`transition-colors ${
                                    darkMode
                                       ? "text-gray-300 hover:text-white"
                                       : "text-gray-600 hover:text-gray-900"
                                 }`}
                              >
                                 Edit
                              </Link>
                           </div>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
}
