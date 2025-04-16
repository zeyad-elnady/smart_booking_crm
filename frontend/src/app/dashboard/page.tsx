"use client";

import { useEffect, useState } from "react";
import {
   UserGroupIcon,
   CalendarIcon,
   CurrencyDollarIcon,
   ClockIcon,
   XMarkIcon,
   ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { authAPI, User, dashboardAPI, DashboardStats } from "@/services/api";
import { appointmentAPI } from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";

// Stats cards definitions with icons and colors
const statDefinitions = [
   {
      id: "appointmentsToday",
      name: "Today's Appointments",
      icon: CalendarIcon,
      color: "from-blue-400 to-blue-600",
      format: (value: number) => value.toString(),
   },
   {
      id: "totalCustomers",
      name: "Total Customers",
      icon: UserGroupIcon,
      color: "from-purple-400 to-purple-600",
      format: (value: number) => value.toString(),
   },
   {
      id: "revenueToday",
      name: "Revenue Today",
      icon: CurrencyDollarIcon,
      color: "from-green-400 to-green-600",
      format: (value: number) => `$${value}`,
   },
   {
      id: "averageWaitTime",
      name: "Average Wait Time",
      icon: ClockIcon,
      color: "from-amber-400 to-amber-600",
      format: (value: number) => `${value} min`,
   },
];

// Define the type for appointments
interface RecentAppointment {
   _id: string;
   customer: string;
   service: string;
   time: string;
   status: string;
}

export default function Dashboard() {
   const { darkMode } = useTheme();
   const [mounted, setMounted] = useState(false);
   const [user, setUser] = useState<User | null>(null);
   const [showServicePrompt, setShowServicePrompt] = useState(true);
   const [serviceLink, setServiceLink] = useState("");
   const [serviceName, setServiceName] = useState("");
   const [hasServiceLink, setHasServiceLink] = useState(false);

   // Stats state
   const [stats, setStats] = useState<DashboardStats | null>(null);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

   // Appointments state
   const [appointments, setAppointments] = useState<RecentAppointment[]>([]);
   const [loadingAppointments, setLoadingAppointments] = useState(true);

   const fetchStats = async (refresh = false) => {
      try {
         setRefreshing(refresh);

         // Always get current customer count first
         if (typeof window !== "undefined") {
            // Force update of customer count before fetching stats
            const storedMockCustomers = localStorage.getItem("mockCustomers");
            if (storedMockCustomers) {
               const customers = JSON.parse(storedMockCustomers);
               console.log(
                  `Dashboard detected ${customers.length} customers in localStorage`
               );

               // Update dashboard stats with current count
               const storedMockStats =
                  localStorage.getItem("mockDashboardStats");
               if (storedMockStats) {
                  const stats = JSON.parse(storedMockStats);
                  stats.totalCustomers = customers.length;
                  localStorage.setItem(
                     "mockDashboardStats",
                     JSON.stringify(stats)
                  );
               }
            }
         }

         const data = refresh
            ? await dashboardAPI.refreshStats()
            : await dashboardAPI.getStats();

         setStats(data);
         setLastUpdated(new Date());
         setLoading(false);
         setRefreshing(false);
      } catch (error) {
         console.error("Error fetching dashboard stats:", error);
         setLoading(false);
         setRefreshing(false);
      }
   };

   const fetchRecentAppointments = async () => {
      try {
         setLoadingAppointments(true);
         const data = await appointmentAPI.getRecentAppointments();
         setAppointments(data);
         setLoadingAppointments(false);
      } catch (error) {
         console.error("Error fetching recent appointments:", error);
         setLoadingAppointments(false);
      }
   };

   const handleRefreshStats = () => {
      fetchStats(true);
      fetchRecentAppointments();
   };

   useEffect(() => {
      setMounted(true);

      // Get the current user from localStorage
      const currentUser = authAPI.getCurrentUser();
      if (currentUser) {
         setUser(currentUser);
      }

      // Check for force refresh flag
      if (typeof window !== "undefined") {
         const forceRefresh = localStorage.getItem("forceRefreshDashboard");
         if (forceRefresh === "true") {
            console.log("Force refreshing dashboard stats");
            // Clear the flag
            localStorage.removeItem("forceRefreshDashboard");
            // Force refresh immediately
            setTimeout(() => {
               handleRefreshStats();
            }, 100);
         }
      }

      // Check if user has already set a service link preference
      const savedServiceLink = localStorage.getItem("serviceLink");
      const savedServiceName = localStorage.getItem("serviceName");
      const serviceChoice = localStorage.getItem("serviceChoice");

      if (serviceChoice === "no") {
         setShowServicePrompt(false);
      } else if (savedServiceLink && savedServiceName) {
         setServiceLink(savedServiceLink);
         setServiceName(savedServiceName);
         setHasServiceLink(true);
         setShowServicePrompt(false);
      }

      // Initialize mockDashboardStats if it doesn't exist
      if (typeof window !== "undefined") {
         const storedMockStats = localStorage.getItem("mockDashboardStats");
         if (!storedMockStats) {
            // Get customer count
            let totalCustomers = 0;
            const storedMockCustomers = localStorage.getItem("mockCustomers");
            if (storedMockCustomers) {
               try {
                  const customers = JSON.parse(storedMockCustomers);
                  totalCustomers = customers.length;
               } catch (e) {
                  console.error("Error parsing mock customers:", e);
               }
            }

            // Initialize stats with accurate customer count
            const initialStats = {
               appointmentsToday: Math.floor(Math.random() * 5),
               totalCustomers: totalCustomers,
               revenueToday: Math.floor(Math.random() * 300) + 50,
               averageWaitTime: Math.floor(Math.random() * 15) + 5,
            };

            localStorage.setItem(
               "mockDashboardStats",
               JSON.stringify(initialStats)
            );
            console.log(
               "Initialized dashboard stats with customer count:",
               totalCustomers
            );
         }
      }

      // Fetch dashboard stats and recent appointments on component mount
      fetchStats();
      fetchRecentAppointments();

      // Set up interval to refresh stats every 60 seconds
      const intervalId = setInterval(() => {
         fetchStats(true);
         fetchRecentAppointments();
      }, 60000);

      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
   }, []);

   const handleServiceLinkSave = () => {
      if (serviceLink && serviceName) {
         localStorage.setItem("serviceLink", serviceLink);
         localStorage.setItem("serviceName", serviceName);
         localStorage.setItem("serviceChoice", "yes");
         setHasServiceLink(true);
         setShowServicePrompt(false);
      }
   };

   const handleDeclineServiceLink = () => {
      localStorage.setItem("serviceChoice", "no");
      setShowServicePrompt(false);
   };

   if (!mounted) return null;

   return (
      <div className="space-y-10 animate-fadeIn">
         <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold mb-2 gradient-text">
                  Welcome back{user?.name ? `, ${user.name}` : ""}
               </h1>
               <p className="text-white/80 dark:text-white/80 light:text-gray-600">
                  Here's an overview of {user?.businessName || "your business"}{" "}
                  today
               </p>
            </div>
            <div className="glass p-4 mt-4 md:mt-0 rounded-lg">
               <p className="text-sm dark:text-white/80 light:text-gray-600">
                  Today's Date
               </p>
               <p className="text-xl font-bold dark:text-white light:text-gray-800">
                  {new Date().toLocaleDateString("en-US", {
                     weekday: "long",
                     year: "numeric",
                     month: "long",
                     day: "numeric",
                  })}
               </p>
            </div>
         </div>

         {showServicePrompt && (
            <div
               className={`p-6 rounded-lg ${
                  darkMode ? "glass-dark" : "glass-light"
               }`}
            >
               <div className="flex justify-between items-start">
                  <h3
                     className={`text-xl font-semibold mb-3 ${
                        darkMode ? "text-white" : "text-gray-800"
                     }`}
                  >
                     Add a Direct Link to Your Service
                  </h3>
                  <button
                     onClick={() => setShowServicePrompt(false)}
                     className={`${
                        darkMode
                           ? "text-gray-400 hover:text-white"
                           : "text-gray-600 hover:text-gray-800"
                     }`}
                  >
                     <XMarkIcon className="h-5 w-5" />
                  </button>
               </div>
               <p
                  className={`mb-4 ${
                     darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
               >
                  Would you like to add a quick access link to your service
                  website?
               </p>

               <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                     <label
                        htmlFor="serviceName"
                        className={`text-sm ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Service Name
                     </label>
                     <input
                        type="text"
                        id="serviceName"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="My Salon Website"
                        className={`px-3 py-2 border rounded-md ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                        }`}
                     />
                  </div>

                  <div className="flex flex-col space-y-2">
                     <label
                        htmlFor="serviceLink"
                        className={`text-sm ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Service URL
                     </label>
                     <input
                        type="url"
                        id="serviceLink"
                        value={serviceLink}
                        onChange={(e) => setServiceLink(e.target.value)}
                        placeholder="https://your-website.com"
                        className={`px-3 py-2 border rounded-md ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                        }`}
                     />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                     <button
                        onClick={handleServiceLinkSave}
                        disabled={!serviceLink || !serviceName}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md disabled:opacity-50"
                     >
                        Save Link
                     </button>

                     <button
                        onClick={handleDeclineServiceLink}
                        className={`px-4 py-2 rounded-md ${
                           darkMode
                              ? "bg-gray-700 text-white"
                              : "bg-gray-200 text-gray-800"
                        }`}
                     >
                        No Thanks
                     </button>
                  </div>
               </div>
            </div>
         )}

         {hasServiceLink && (
            <div className="flex justify-center">
               <a
                  href={serviceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg"
               >
                  Go to {serviceName}
               </a>
            </div>
         )}

         <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-semibold dark:text-white light:text-gray-800">
                  Business Statistics
               </h2>
               <div className="flex items-center">
                  <div className="text-sm mr-4 dark:text-gray-300 light:text-gray-600">
                     {lastUpdated ? (
                        <>Last Updated: {lastUpdated.toLocaleTimeString()}</>
                     ) : (
                        "Loading..."
                     )}
                  </div>
                  <button
                     onClick={handleRefreshStats}
                     className="p-2 rounded-full hover:bg-gray-700/20 transition-colors"
                     disabled={refreshing}
                     aria-label="Refresh stats"
                  >
                     <ArrowPathIcon
                        className={`h-5 w-5 dark:text-white light:text-gray-700 ${
                           refreshing ? "animate-spin" : ""
                        }`}
                     />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {loading ? (
                  // Loading skeleton
                  <>
                     {[...Array(4)].map((_, i) => (
                        <div
                           key={i}
                           className="glass p-6 rounded-xl h-40 animate-pulse"
                        >
                           <div className="h-6 bg-gray-300/10 rounded w-1/2 mb-4"></div>
                           <div className="h-10 bg-gray-300/10 rounded w-1/3"></div>
                        </div>
                     ))}
                  </>
               ) : (
                  <>
                     {statDefinitions.map((stat, index) => {
                        // Determine CSS class for card background based on color
                        let cardBgClass = "";
                        if (stat.color.includes("blue"))
                           cardBgClass = "card-blue-bg";
                        else if (stat.color.includes("purple"))
                           cardBgClass = "card-purple-bg";
                        else if (stat.color.includes("green"))
                           cardBgClass = "card-green-bg";
                        else if (stat.color.includes("amber"))
                           cardBgClass = "card-amber-bg";

                        // Get stat value
                        const value = stats ? stats[stat.id] : 0;

                        return (
                           <div
                              key={stat.id}
                              className={`glass rounded-xl p-6 ${cardBgClass}`}
                           >
                              <div className="flex items-center mb-4">
                                 <div
                                    className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} mr-3`}
                                 >
                                    <stat.icon
                                       className="h-6 w-6 text-white"
                                       aria-hidden="true"
                                    />
                                 </div>
                                 <h3 className="stat-label text-sm font-medium">
                                    {stat.name}
                                 </h3>
                              </div>
                              <div className="stat-value text-4xl">
                                 {stat.format(value)}
                              </div>
                           </div>
                        );
                     })}
                  </>
               )}
            </div>
         </div>

         {/* Recent Appointments */}
         <div
            className={`rounded-lg shadow-sm ${
               darkMode
                  ? "glass border border-white/10"
                  : "bg-white border border-gray-200"
            }`}
         >
            <div className="px-6 py-4">
               <h3
                  className={`text-lg font-medium ${
                     darkMode ? "text-white" : "text-gray-900"
                  }`}
               >
                  Recent Appointments
               </h3>
            </div>
            <div
               className={`border-t ${
                  darkMode ? "border-white/10" : "border-gray-200"
               }`}
            >
               {loadingAppointments ? (
                  <div className="p-6 text-center">
                     <div
                        className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${
                           darkMode ? "text-white/30" : "text-gray-300"
                        }`}
                        role="status"
                     >
                        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                           Loading...
                        </span>
                     </div>
                  </div>
               ) : appointments.length > 0 ? (
                  <ul
                     role="list"
                     className={`divide-y ${
                        darkMode ? "divide-white/10" : "divide-gray-200"
                     }`}
                  >
                     {appointments.map((appointment) => (
                        <li
                           key={appointment._id}
                           className={`px-6 py-4 ${
                              darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                           } transition-colors`}
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                 <div className="flex-shrink-0">
                                    <div
                                       className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                          darkMode
                                             ? "bg-gray-700"
                                             : "bg-gray-100"
                                       }`}
                                    >
                                       <span
                                          className={`text-sm font-medium ${
                                             darkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                          }`}
                                       >
                                          {appointment.customer.charAt(0)}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="ml-4">
                                    <div
                                       className={`text-sm font-medium ${
                                          darkMode
                                             ? "text-white"
                                             : "text-gray-900"
                                       }`}
                                    >
                                       {appointment.customer}
                                    </div>
                                    <div
                                       className={`text-sm ${
                                          darkMode
                                             ? "text-gray-400"
                                             : "text-gray-500"
                                       }`}
                                    >
                                       {appointment.service}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                 <div
                                    className={`text-sm ${
                                       darkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                    }`}
                                 >
                                    {appointment.time}
                                 </div>
                                 <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                       darkMode
                                          ? appointment.status === "Confirmed"
                                             ? "bg-green-500/20 text-green-400"
                                             : "bg-yellow-500/20 text-yellow-400"
                                          : appointment.status === "Confirmed"
                                          ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                          : "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20"
                                    }`}
                                 >
                                    {appointment.status}
                                 </span>
                              </div>
                           </div>
                        </li>
                     ))}
                  </ul>
               ) : (
                  <div
                     className={`p-6 text-center ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                     }`}
                  >
                     No recent appointments
                  </div>
               )}
            </div>
         </div>

         <style jsx>{`
            @keyframes fadeIn {
               from {
                  opacity: 0;
                  transform: translateY(20px);
               }
               to {
                  opacity: 1;
                  transform: translateY(0);
               }
            }
         `}</style>
      </div>
   );
}
