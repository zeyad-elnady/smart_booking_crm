"use client";

import { useEffect, useState } from "react";
import {
   UserGroupIcon,
   CalendarIcon,
   CurrencyDollarIcon,
   ClockIcon,
   XMarkIcon,
   ArrowPathIcon,
   UsersIcon,
} from "@heroicons/react/24/outline";
import { authAPI, User, dashboardAPI } from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";
import { format } from "date-fns";

export interface DashboardStats {
   totalCustomers: number;
   averageRevenue: string;
   averageWaitTime: string;
   [key: string]: number | string;
}

interface StatDefinition {
   name: string;
   key: keyof DashboardStats;
   icon: React.ReactNode;
   color: string;
}

const statDefinitions: StatDefinition[] = [
   {
      name: "Total Customers",
      key: "totalCustomers",
      icon: <UsersIcon className="h-6 w-6" />,
      color: "bg-purple-500",
   },
   {
      name: "Average Revenue",
      key: "averageRevenue",
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: "bg-green-500",
   },
   {
      name: "Average Wait Time",
      key: "averageWaitTime",
      icon: <ClockIcon className="h-6 w-6" />,
      color: "bg-orange-500",
   },
];

interface ApiDashboardStats {
   totalCustomers: number;
   averageRevenue: number;
   averageWaitTime: number;
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

   const fetchStats = async () => {
      try {
         const response = await dashboardAPI.getStats();
         const apiStats = response as unknown as ApiDashboardStats;

         // Transform API stats to match our interface
         const formattedStats: DashboardStats = {
            totalCustomers: apiStats.totalCustomers || 0,
            averageRevenue: `$${(apiStats.averageRevenue || 0).toFixed(2)}`,
            averageWaitTime: `${(apiStats.averageWaitTime || 0).toFixed(
               0
            )} min`,
         };

         setStats(formattedStats);
         setLastUpdated(new Date());
         setLoading(false);
      } catch (error) {
         console.error("Error fetching stats:", error);
         setLoading(false);
      }
   };

   const handleRefreshStats = () => {
      fetchStats();
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

      // Fetch dashboard stats on component mount
      fetchStats();

      // Set up interval to refresh stats every 60 seconds
      const intervalId = setInterval(() => {
         fetchStats();
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

   const formatStatValue = (value: number | string | undefined): string => {
      if (value === undefined) return "-";
      if (typeof value === "number") return value.toString();
      return value;
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
                        const value = stats ? stats[stat.key] : 0;

                        return (
                           <div
                              key={stat.key}
                              className={`glass rounded-xl p-6 ${cardBgClass}`}
                           >
                              <div className="flex items-center mb-4">
                                 <div
                                    className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} mr-3`}
                                 >
                                    {stat.icon}
                                 </div>
                                 <h3 className="stat-label text-sm font-medium">
                                    {stat.name}
                                 </h3>
                              </div>
                              <div className="stat-value text-4xl">
                                 {formatStatValue(value)}
                              </div>
                           </div>
                        );
                     })}
                  </>
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
