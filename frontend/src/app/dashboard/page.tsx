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
import RevenueChart from "@/components/RevenueChart";

interface DashboardStats {
   averageWaitTime: number;
   totalRevenue: number;
   averageRevenue: number;
   totalCustomers: number;
   completedAppointments: number;
   weeklyRevenue: number;
   monthlyRevenue: number;
}

interface StatDefinition {
   name: string;
   key: keyof DashboardStats;
   icon: React.ReactNode;
   color: string;
   prefix?: string;
   suffix?: string;
}

const statDefinitions: StatDefinition[] = [
   {
      name: "Daily Revenue",
      key: "totalRevenue",
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: "bg-blue-500",
      prefix: "$",
   },
   {
      name: "Weekly Revenue",
      key: "weeklyRevenue",
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: "bg-green-500",
      prefix: "$",
   },
   {
      name: "Monthly Revenue",
      key: "monthlyRevenue",
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: "bg-purple-500",
      prefix: "$",
   },
   {
      name: "Average Wait Time",
      key: "averageWaitTime",
      icon: <ClockIcon className="h-6 w-6" />,
      color: "bg-orange-500",
      suffix: " min",
   },
   {
      name: "Total Customers",
      key: "totalCustomers",
      icon: <UsersIcon className="h-6 w-6" />,
      color: "bg-teal-500",
   },
   {
      name: "Completed Today",
      key: "completedAppointments",
      icon: <CalendarIcon className="h-6 w-6" />,
      color: "bg-pink-500",
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
   const [stats, setStats] = useState<DashboardStats>({
      averageWaitTime: 0,
      totalRevenue: 0,
      averageRevenue: 0,
      totalCustomers: 0,
      completedAppointments: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
   });
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

   const fetchStats = async () => {
      try {
         setLoading(true);
         setRefreshing(true);

         const response = await dashboardAPI.getStats();

         if (!response || typeof response !== "object") {
            throw new Error("Invalid response from server");
         }

         const formattedStats: DashboardStats = {
            totalCustomers: response.totalCustomers || 0,
            averageRevenue: response.averageRevenue || 0,
            averageWaitTime: response.averageWaitTime || 0,
            totalRevenue: response.totalRevenue || 0,
            completedAppointments: response.completedAppointments || 0,
            weeklyRevenue: response.weeklyRevenue || 0,
            monthlyRevenue: response.monthlyRevenue || 0,
         };

         console.log("Received stats:", response);
         console.log("Formatted stats:", formattedStats);

         setStats(formattedStats);
         setLastUpdated(new Date());
      } catch (error) {
         console.error("Error fetching dashboard stats:", error);
         // Show error in stats
         setStats({
            totalCustomers: 0,
            averageRevenue: 0,
            averageWaitTime: 0,
            totalRevenue: 0,
            completedAppointments: 0,
            weeklyRevenue: 0,
            monthlyRevenue: 0,
         });
      } finally {
         setLoading(false);
         setRefreshing(false);
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

   const formatStatValue = (
      value: number | string | undefined,
      stat: StatDefinition
   ): string => {
      if (value === undefined) return "-";

      let formattedValue =
         typeof value === "number"
            ? stat.prefix === "$"
               ? value.toFixed(2)
               : value.toString()
            : value;

      return `${stat.prefix || ""}${formattedValue}${stat.suffix || ""}`;
   };

   if (!mounted) return null;

   return (
      <div className="min-h-screen p-8 space-y-8">
         {/* Welcome Section */}
         <div className="flex justify-between items-start">
            <div>
               <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Welcome back, {user?.name || "Guest"}
               </h1>
               <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Here's an overview of 3bass today
               </p>
            </div>
            <div className="text-right">
               <div className="text-sm text-gray-500 dark:text-gray-400">
                  Today's Date
               </div>
               <div className="text-lg font-semibold">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
               </div>
            </div>
         </div>

         {/* Stats Section */}
         <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Business Statistics
               </h2>
               <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                     Last Updated:{" "}
                     {lastUpdated ? format(lastUpdated, "h:mm:ss a") : "Never"}
                  </span>
                  <button
                     onClick={handleRefreshStats}
                     className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                     disabled={refreshing}
                  >
                     <ArrowPathIcon
                        className={`h-5 w-5 text-gray-500 dark:text-gray-400 ${
                           refreshing ? "animate-spin" : ""
                        }`}
                     />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {statDefinitions.map((stat) => (
                  <div
                     key={stat.key}
                     className={`p-6 rounded-lg shadow-sm ${
                        darkMode
                           ? "bg-gray-800 text-white"
                           : "bg-white text-gray-800"
                     }`}
                  >
                     <div className="flex items-center gap-4">
                        <div
                           className={`p-3 rounded-full ${stat.color} bg-opacity-10`}
                        >
                           {stat.icon}
                        </div>
                        <div>
                           <div className="text-sm text-gray-500 dark:text-gray-400">
                              {stat.name}
                           </div>
                           <div className="text-2xl font-bold">
                              {formatStatValue(stats[stat.key], stat)}
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Revenue Chart */}
         <div className={`rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <RevenueChart />
         </div>

         {/* Rest of your dashboard content */}
      </div>
   );
}
