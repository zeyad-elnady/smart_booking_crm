"use client";

import { useEffect, useState } from "react";
import {
   CalendarIcon,
   CurrencyDollarIcon,
   XMarkIcon,
   ArrowPathIcon,
   UsersIcon,
   ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { authAPI, dashboardAPI } from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";
import { format } from "date-fns";
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { indexedDBService } from '@/services/indexedDB';
import type { Appointment } from '@/types/appointment';
import type { Service } from '@/types/service';
import { toast } from "react-hot-toast";

// Create a formatCurrency utility function
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Extend User interface to include firstName
interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  businessName?: string;
  businessType?: string;
  token?: string;
  firstName?: string;
}

interface DashboardStats {
   averageWaitTime: number;
   totalRevenue: number;
   averageRevenue: number;
   totalCustomers: number;
   completedAppointments: number;
   weeklyRevenue: number;
   monthlyRevenue: number;
   totalAppointments?: number;
   pendingAppointments?: number;
}

interface StatDefinition {
   name: string;
   key: keyof DashboardStats;
   icon: React.ReactNode;
   color: string;
   prefix?: string;
   suffix?: string;
   revenuePeriod?: boolean;
}

type RevenuePeriod = 'day' | 'week' | 'month';

// Add a new type and state for revenue trend period
type RevenueTrendPeriod = 'week' | 'month' | 'year';

const statDefinitions: StatDefinition[] = [
   {
      name: "Revenue",
      key: "totalRevenue",
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      color: "bg-blue-500",
      prefix: "$",
      revenuePeriod: true,
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

// New interface for chart data
interface ChartData {
   revenueData: { name: string; value: number }[];
   appointmentsByStatus: { name: string; value: number; color: string }[];
   weeklyRevenue: { day: string; revenue: number }[];
   servicePopularity: { name: string; value: number; color: string }[];
   confirmedAppointmentsRevenue: number;
}

// Add this helper function to extract prices safely
const getAppointmentPrice = (appointment: Appointment): number => {
  let price = 0;
  let source = 'unknown';
  
  if (appointment.price !== undefined && appointment.price !== null) {
    price = typeof appointment.price === 'number' ? appointment.price : parseFloat(appointment.price);
    source = 'direct price';
  } else if (appointment.serviceInfo?.price !== undefined && appointment.serviceInfo.price !== null) {
    price = typeof appointment.serviceInfo.price === 'number' ? appointment.serviceInfo.price : parseFloat(appointment.serviceInfo.price);
    source = 'serviceInfo.price';
  } else if (typeof appointment.service === 'object' && appointment.service) {
    const servicePrice = (appointment.service as any).price;
    if (servicePrice !== undefined && servicePrice !== null) {
      price = typeof servicePrice === 'number' ? servicePrice : parseFloat(servicePrice);
      source = 'service object price';
    } else {
      // Try to load the service by ID
      console.log(`No price found in service object, need to check service ID later`);
      source = 'no price found';
    }
  } else if (typeof appointment.service === 'string') {
    // Will be handled later when we load service details
    console.log(`Service is an ID (${appointment.service}), need to load service details to get price`);
    source = 'service ID reference';
  }
  
  // Ensure we return a valid number
  const finalPrice = isNaN(price) ? 0 : price;
  console.log(`Appointment ${appointment._id} price: ${finalPrice} (source: ${source})`);
  return finalPrice;
};

// Define a const for the localStorage key
const SERVICE_COLORS_STORAGE_KEY = 'serviceCustomColors';

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
   const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
   const [dbInitError, setDbInitError] = useState<string | null>(null);

   const [chartData, setChartData] = useState<ChartData>({
      revenueData: [
         { name: 'Today', value: 0 },
      ],
      appointmentsByStatus: [
         { name: 'Pending', value: 0, color: '#FFBB28' },
         { name: 'Confirmed', value: 0, color: '#00C49F' },
         { name: 'Canceled', value: 0, color: '#FF8042' },
         { name: 'Completed', value: 0, color: '#0088FE' },
      ],
      weeklyRevenue: [
         { day: 'Mon', revenue: 0 },
         { day: 'Tue', revenue: 0 },
         { day: 'Wed', revenue: 0 },
         { day: 'Thu', revenue: 0 },
         { day: 'Fri', revenue: 0 },
         { day: 'Sat', revenue: 0 },
         { day: 'Sun', revenue: 0 },
      ],
      servicePopularity: [
         { name: 'Loading...', value: 0, color: '#CBD5E1' }
      ],
      confirmedAppointmentsRevenue: 0
   });

   const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('day');

   // Add a new type and state for revenue trend period
   const [revenueTrendPeriod, setRevenueTrendPeriod] = useState<RevenueTrendPeriod>('week');
   const [revenueTrendDropdown, setRevenueTrendDropdown] = useState<boolean>(false);

   // Add a new function to get the selected revenue data for the chart
   const getRevenueChartData = () => {
      return [
         { name: getRevenuePeriodName(), value: getRevenueForPeriod() }
      ];
   };

   // Function to get the appropriate revenue value based on the selected period
   const getRevenueForPeriod = (): number => {
      switch (revenuePeriod) {
         case 'day':
            return stats.totalRevenue;
         case 'week':
            return stats.weeklyRevenue;
         case 'month':
            return stats.monthlyRevenue;
         default:
            return stats.totalRevenue;
      }
   };
   
   // Function to get the display name for the revenue period
   const getRevenuePeriodName = (): string => {
      switch (revenuePeriod) {
         case 'day':
            return 'Today';
         case 'week':
            return 'This Week';
         case 'month':
            return 'This Month';
         default:
            return 'Today';
      }
   };

   // Add function to get name for the trend period
   const getTrendPeriodName = (): string => {
      switch (revenueTrendPeriod) {
         case 'week':
            return 'Weekly';
         case 'month':
            return 'Monthly'; 
         case 'year':
            return 'Yearly';
         default:
            return 'Weekly';
      }
   };

   // Add a new function to generate label based on trend period
   const getChartLabel = () => {
      switch (revenueTrendPeriod) {
         case 'week':
            return 'Weekly Revenue (Last 7 Days)';
         case 'month':
            return 'Monthly Revenue (Last 4 Weeks)';
         case 'year':
            return 'Yearly Revenue (Last 12 Months)';
         default:
            return 'Revenue Trend';
      }
   };

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
         
         // After updating stats, update chart data
         await updateChartData();
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
      try {
         setRefreshing(true);
         
         // Recalculate all stats
         calculateDashboardStats();
         
         // Update chart data
         updateChartData();
         
         // Load recent appointments
         loadRecentAppointments();
         
         // Update timestamp
         setLastUpdated(new Date());
         
         toast.success("Dashboard refreshed successfully!");
      } catch (error) {
         console.error("Error refreshing stats:", error);
         toast.error("Failed to refresh dashboard");
      } finally {
         // Stop the loading indicator
         setTimeout(() => {
            setRefreshing(false);
         }, 600);
      }
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

      // Fetch dashboard stats on component mount
      fetchStats();

      // Set up interval to refresh stats every 60 seconds
      const intervalId = setInterval(() => {
         fetchStats();
      }, 60000);
      
      // Set up event listeners for data changes
      const handleStorageChange = (e: StorageEvent) => {
         if (
            e.key === 'customerListShouldRefresh' || 
            e.key === 'appointmentListShouldRefresh' || 
            e.key === 'serviceListShouldRefresh'
         ) {
            console.log(`Refreshing dashboard stats due to ${e.key} change`);
            fetchStats();
         }
      };
      
      window.addEventListener('storage', handleStorageChange);

      // Clean up interval and event listeners on component unmount
      return () => {
         clearInterval(intervalId);
         window.removeEventListener('storage', handleStorageChange);
      };
   }, []);

   // Move the initDatabase function to component scope so it's available in all useEffects
   const initDatabase = async () => {
      try {
         console.log("Dashboard: Initializing database manually");
         await indexedDBService.initDB();
         console.log("Dashboard: Database initialized successfully");
         
         // Try to save a test setting to verify database works
         await indexedDBService.saveSetting('dashboard_init_test', 'success');
         console.log("Dashboard: Test setting saved successfully");
         
         // If we get here, the database is working
         setDbInitError(null);
      } catch (error) {
         console.error("Dashboard: Failed to initialize database:", error);
         setDbInitError(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }
   };

   // Update the first useEffect that used initDatabase
   useEffect(() => {
      // Attempt to manually initialize the database
      initDatabase();
      calculateDashboardStats();
      loadRecentAppointments();
   }, []);

   // Now the loadInitialData function in the other useEffect will work
   const loadInitialData = async () => {
      initDatabase();
      calculateDashboardStats();
      loadRecentAppointments();
      updateChartData();
      countNewCustomersThisMonth();
   };

   // Update the updateChartData function to also calculate confirmed appointments revenue
   const updateChartData = async () => {
      try {
         // Update revenue data with selected period only
         const updatedRevenueData = getRevenueChartData();

         // Get all appointments to calculate status distribution
         const allAppointments = await indexedDBService.getAllAppointments();
         console.log(`Loaded ${allAppointments.length} appointments for chart data`);
         
         // Count appointments by status
         const statusCounts = {
            Pending: 0,
            Confirmed: 0,
            Canceled: 0,
            Completed: 0
         };
         
         // Calculate total revenue from confirmed and completed appointments for the goal
         let confirmedAppointmentsRevenue = 0;
         let confirmedCount = 0;
         
         // Process appointments in a loop to handle async service lookups
         for (const app of allAppointments) {
            if (app.status && statusCounts.hasOwnProperty(app.status)) {
               statusCounts[app.status as keyof typeof statusCounts]++;
               
               // Calculate revenue from confirmed and completed appointments for the goal
               if (app.status === 'Confirmed' || app.status === 'Completed') {
                  let price = 0;
                  
                  // Try direct price properties first
                  if (app.price !== undefined && app.price !== null) {
                     price = typeof app.price === 'number' ? app.price : parseFloat(app.price);
                  } else if (app.serviceInfo?.price !== undefined && app.serviceInfo.price !== null) {
                     price = typeof app.serviceInfo.price === 'number' ? app.serviceInfo.price : parseFloat(app.serviceInfo.price);
                  } else if (typeof app.service === 'object' && app.service) {
                     const servicePrice = (app.service as any).price;
                     if (servicePrice !== undefined && servicePrice !== null) {
                        price = typeof servicePrice === 'number' ? servicePrice : parseFloat(servicePrice);
                     }
                  } else if (typeof app.service === 'string') {
                     // Load the service to get its price
                     try {
                        const service = await indexedDBService.getServiceById(app.service);
                        if (service && service.price !== undefined) {
                           price = typeof service.price === 'number' ? service.price : parseFloat(service.price);
                           console.log(`Loaded service ${service.name} with price ${price} for appointment ${app._id}`);
                        } else {
                           console.log(`Service not found or has no price for appointment ${app._id}`);
                        }
                     } catch (err) {
                        console.error(`Error loading service for appointment ${app._id}:`, err);
                     }
                  }
                  
                  // Ensure price is a valid number
                  price = isNaN(price) ? 0 : price;
                  
                  confirmedAppointmentsRevenue += price;
                  confirmedCount++;
                  
                  // Log each appointment and its price
                  console.log(`${app.status} appointment: ID=${app._id}, Price=${price}, Date=${app.date}`);
               }
            }
         }
         
         // Log the total revenue for goals
         console.log(`Total confirmed/completed appointments: ${confirmedCount}`);
         console.log(`Total revenue for goals: ${confirmedAppointmentsRevenue}`);
         
         const updatedStatusData = [
            { name: 'Pending', value: statusCounts.Pending, color: '#FFBB28' },
            { name: 'Confirmed', value: statusCounts.Confirmed, color: '#00C49F' },
            { name: 'Canceled', value: statusCounts.Canceled, color: '#FF8042' },
            { name: 'Completed', value: statusCounts.Completed, color: '#0088FE' },
         ];

         // Generate trend data based on selected period
         type TrendDataItem = { 
            day: string; 
            fullDay?: string;
            weekStart?: Date;
            weekEnd?: Date;
            fullMonth?: string;
            monthIndex?: number;
            revenue: number 
         };
         
         let trendData: TrendDataItem[] = [];
         const today = new Date();
         
         if (revenueTrendPeriod === 'week') {
            // Weekly data - unique styling for days of week
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const shortDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            trendData = shortDayNames.map((day, index) => ({ 
               day: day,
               fullDay: dayNames[index], 
               revenue: 0 
            }));
            
            // The day mapping maps JavaScript's day index (0=Sunday, 1=Monday, etc.) to our array index
            const dayMapping = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
            
            // Keep track of appointments counted for debugging
            let countedAppointments = 0;
            
            // Calculate the start of the current week (Monday)
            const startOfWeek = new Date(today);
            const dayOfWeek = today.getDay();
            startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            startOfWeek.setHours(0, 0, 0, 0);
            
            // Calculate the end of the current week (Sunday)
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            console.log(`Processing appointments for current week: ${startOfWeek.toDateString()} to ${endOfWeek.toDateString()}`);
            
            // Process only current week appointments
            for (const appointment of allAppointments) {
               if (!appointment.date || !appointment.service) continue;
               
               const appDate = new Date(appointment.date);
               
               // Skip appointments outside the current week
               if (appDate < startOfWeek || appDate > endOfWeek) continue;
               
               const dayIndex = appDate.getDay(); // Get day of week (0-6)
               
               // Only count revenue for completed/confirmed appointments
               if (appointment.status === 'Completed' || appointment.status === 'Confirmed') {
                  const price = getAppointmentPrice(appointment);
                  const mappedIndex = dayMapping[dayIndex as keyof typeof dayMapping];
                  if (mappedIndex !== undefined) {
                     trendData[mappedIndex].revenue += Number(price);
                     countedAppointments++;
                  }
               }
            }
            
            console.log(`Found ${countedAppointments} appointments in the current week for the revenue chart`);
         } 
         else if (revenueTrendPeriod === 'month') {
            // Monthly data - show last 4 weeks with more descriptive labels
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            // Get the first day of the current month
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            // Get the last day of the current month
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            console.log(`Month starts on: ${startOfMonth.toISOString().split('T')[0]}, with ${lastDayOfMonth} days`);
            
            // Calculate week ranges for better labels and data visualization
            const weeks = [];
            for (let i = 0; i < 4; i++) {
               const weekStart = i * 7 + 1;
               const weekEnd = Math.min((i + 1) * 7, lastDayOfMonth);
               weeks.push({
                  start: new Date(currentYear, currentMonth, weekStart),
                  end: new Date(currentYear, currentMonth, weekEnd),
                  label: `Week ${i + 1}`
               });
            }
            
            // Initialize trend data with the calculated week labels
            trendData = weeks.map(week => ({ 
               day: week.label, 
               weekStart: week.start,
               weekEnd: week.end,
               revenue: 0 
            }));
            
            // Keep track of appointments counted for debugging
            let countedAppointments = 0;
            
            // Process all appointments to find those that fall within each week of the current month
            for (const appointment of allAppointments) {
               if (!appointment.date || !appointment.service) continue;
               
               const appDate = new Date(appointment.date);
               
               // Skip appointments outside current month - make sure to check year too
               if (appDate.getMonth() !== currentMonth || appDate.getFullYear() !== currentYear) continue;
               
               // Find which week this appointment belongs to
               const dayOfMonth = appDate.getDate();
               const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
               
               let revenue = 0;
               if (typeof appointment.service === 'string') {
                  const service = await indexedDBService.getServiceById(appointment.service);
                  if (service) {
                     revenue = service.price || 0;
                  }
               } else if (appointment.service && typeof appointment.service === 'object') {
                  revenue = (appointment.service as any).price || 0;
               }
               
               // Only count revenue for completed/confirmed appointments
               if (appointment.status === 'Completed' || appointment.status === 'Confirmed') {
                  const price = getAppointmentPrice(appointment);
                  trendData[weekIndex].revenue += Number(price);
                  countedAppointments++;
               }
            }
            
            console.log(`Counted ${countedAppointments} appointments for the monthly revenue chart`);
         } 
         else if (revenueTrendPeriod === 'year') {
            // Yearly data - show months with full names for clarity
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            
            console.log(`Calculating yearly revenue for ${currentYear}`);
            
            // Initialize trend data for all months in the current year
            trendData = shortMonthNames.map((month, index) => ({ 
               day: month, 
               fullMonth: monthNames[index],
               monthIndex: index,
               revenue: 0 
            }));
            
            // Keep track of appointments counted for debugging
            let countedAppointments = 0;
            
            // Process all appointments to find those that fall within the current year
            for (const appointment of allAppointments) {
               if (!appointment.date || !appointment.service) continue;
               
               const appDate = new Date(appointment.date);
               
               // Skip appointments outside current year
               if (appDate.getFullYear() !== currentYear) continue;
               
               const monthIndex = appDate.getMonth();
               
               let revenue = 0;
               if (typeof appointment.service === 'string') {
                  const service = await indexedDBService.getServiceById(appointment.service);
                  if (service) {
                     revenue = service.price || 0;
                  }
               } else if (appointment.service && typeof appointment.service === 'object') {
                  revenue = (appointment.service as any).price || 0;
               }
               
               // Only count revenue for completed/confirmed appointments
               if (appointment.status === 'Completed' || appointment.status === 'Confirmed') {
                  const price = getAppointmentPrice(appointment);
                  trendData[monthIndex].revenue += Number(price);
                  countedAppointments++;
               }
            }
            
            console.log(`Counted ${countedAppointments} appointments for the yearly revenue chart`);
         }

         // Calculate service popularity
         const services = await indexedDBService.getAllServices();
         const serviceUsage: Record<string, { count: number; name: string; color: string }> = {};
         
         // Initialize with all services
         services.forEach((service, index) => {
            const colorIndex = index % 6;
            const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A267AC', '#6699CC'];
            
            serviceUsage[service._id] = {
               count: 0,
               name: service.name,
               color: colors[colorIndex]
            };
         });
         
         // Count service usage in appointments
         for (const appointment of allAppointments) {
            if (!appointment.service) continue;
            
            const serviceId = typeof appointment.service === 'string' 
               ? appointment.service 
               : (appointment.service as any)._id;
               
            if (serviceUsage[serviceId]) {
               serviceUsage[serviceId].count++;
            }
         }
         
         // Convert to array and sort by popularity
         const servicePopularity = Object.values(serviceUsage)
            .map(item => ({
               name: item.name,
               value: item.count,
               color: item.color
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 services
         
         setChartData({
            revenueData: updatedRevenueData,
            appointmentsByStatus: updatedStatusData,
            weeklyRevenue: trendData,
            servicePopularity: servicePopularity.length ? servicePopularity : [{ name: 'No data', value: 1, color: '#CBD5E1' }],
            confirmedAppointmentsRevenue
         });
      } catch (error) {
         console.error("Error updating chart data:", error);
      }
   };

   // Update useEffect to add revenueTrendPeriod as a dependency
   useEffect(() => {
      // Whenever recent appointments are loaded or period changes, also update chart data
      if (recentAppointments.length > 0 || revenueTrendPeriod) {
         updateChartData();
      }
   }, [recentAppointments, revenuePeriod, revenueTrendPeriod]);

   // Add a dedicated effect for handling revenueTrendPeriod changes
   useEffect(() => {
      // Force update chart data whenever trend period changes
      updateChartData();
   }, [revenueTrendPeriod]);

   // Add a dedicated effect for handling revenuePeriod changes
   useEffect(() => {
      // Force update chart data whenever revenue period changes
      updateChartData();
      calculateDashboardStats();
   }, [revenuePeriod]);

   // Add a hook to refresh the charts when all data is loaded
   useEffect(() => {
      // Wait for all data to be loaded
      if (!loading && recentAppointments.length > 0) {
         console.log('Refreshing chart data after all data is loaded');
         updateChartData();
      }
   }, [loading, recentAppointments.length]);

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

   async function calculateDashboardStats() {
      try {
         setLoading(true);
         // Fetch appointments from database
         const appointments = await indexedDBService.getAllAppointments();
         console.log(`Loaded ${appointments.length} appointments for dashboard stats`);
         
         // Basic stats calculation
         const totalAppointments = appointments.length;
         const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
         const completedAppointments = appointments.filter(a => a.status === 'Completed').length;
         
         // Calculate daily revenue
         let totalRevenue = 0;
         
         // Weekly revenue calculation
         let weeklyRevenue = 0;
         const today = new Date();
         
         // Calculate the start of the current week (Monday)
         const startOfWeek = new Date(today);
         const dayOfWeek = today.getDay();
         startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
         startOfWeek.setHours(0, 0, 0, 0);
         
         // Monthly revenue calculation
         let monthlyRevenue = 0;
         const currentMonth = today.getMonth();
         const currentYear = today.getFullYear();
         
         // Process all appointments
         for (const appointment of appointments) {
            if (appointment.status === 'Completed') {
               // Get price from either the appointment price property, serviceInfo, or the service object
               let price = 0;
               if (appointment.price) {
                  price = appointment.price;
               } else if (appointment.serviceInfo?.price) {
                  price = appointment.serviceInfo.price;
               } else if (typeof appointment.service === 'object' && appointment.service) {
                  price = (appointment.service as any).price || 0;
               }
               
               const numericPrice = Number(price);
               
               // Today's revenue
               const appDate = new Date(appointment.date);
               const isToday = appDate.getDate() === today.getDate() && 
                              appDate.getMonth() === today.getMonth() && 
                              appDate.getFullYear() === today.getFullYear();
               
               if (isToday) {
                  totalRevenue += numericPrice;
               }
               
               // This week's revenue
               if (appDate >= startOfWeek) {
                  weeklyRevenue += numericPrice;
               }
               
               // This month's revenue
               if (appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear) {
                  monthlyRevenue += numericPrice;
               }
            }
         }
         
         setStats({
            ...stats,
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            totalRevenue,
            weeklyRevenue,
            monthlyRevenue
         });
      } catch (error) {
         console.error("Error calculating dashboard stats:", error);
      } finally {
         setLoading(false);
      }
   }

   async function loadRecentAppointments() {
      try {
         const allAppointments = await indexedDBService.getAllAppointments();
         // Sort by date descending and take the 5 most recent
         const sortedAppointments = allAppointments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
         
         setRecentAppointments(sortedAppointments);
      } catch (error) {
         console.error("Error loading recent appointments:", error);
      }
   }

   // Initialize data on mount
   useEffect(() => {
      setMounted(true);
      
      // Function to handle storage changes
      const handleStorageChange = (e: StorageEvent) => {
         if (e.key === "appointmentListShouldRefresh") {
            calculateDashboardStats();
            updateChartData();
            loadRecentAppointments();
         } else if (e.key === "serviceListShouldRefresh") {
            updateChartData();
         } else if (e.key === 'newCustomerAdded') {
            console.log("New customer added (storage event), incrementing count...");
            setMonthlyNewCustomers(prevCount => prevCount + 1);
         }
      };
      
      // Function to handle customer data changes
      const handleCustomerAdded = (e: CustomEvent) => {
         console.log("New customer added, incrementing count...");
         setMonthlyNewCustomers(prevCount => prevCount + 1);
      };
      
      // Function to handle bulk customer additions
      const handleCustomersBulkAdded = (e: CustomEvent) => {
         const { count } = e.detail;
         console.log(`${count} new customers added in bulk, incrementing count...`);
         setMonthlyNewCustomers(prevCount => prevCount + count);
      };
      
      // Function to handle appointment data changes
      const handleAppointmentChanges = () => {
         console.log("Appointment data changed, updating charts...");
         updateChartData();
      };
      
      // Set up event listeners
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener('appointmentAdded', handleAppointmentChanges);
      window.addEventListener('appointmentUpdated', handleAppointmentChanges);
      window.addEventListener('appointmentDeleted', handleAppointmentChanges);
      window.addEventListener('customerAdded', handleCustomerAdded as EventListener);
      window.addEventListener('customersBulkAdded', handleCustomersBulkAdded as EventListener);
      
      const loadInitialData = async () => {
         initDatabase();
         calculateDashboardStats();
         loadRecentAppointments();
         updateChartData();
         countNewCustomersThisMonth();
      };
      
      loadInitialData();
      
      // Check for user data in localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         try {
            setUser(JSON.parse(storedUser));
         } catch (error) {
            console.error("Error parsing user data:", error);
         }
      }
      
      // Check if a service link preference has already been set
      const serviceChoice = localStorage.getItem("serviceChoice");
      if (serviceChoice) {
         setShowServicePrompt(false);
      }
      
      return () => {
         // Clean up event listeners
         window.removeEventListener("storage", handleStorageChange);
         window.removeEventListener('appointmentAdded', handleAppointmentChanges);
         window.removeEventListener('appointmentUpdated', handleAppointmentChanges);
         window.removeEventListener('appointmentDeleted', handleAppointmentChanges);
         window.removeEventListener('customerAdded', handleCustomerAdded as EventListener);
         window.removeEventListener('customersBulkAdded', handleCustomersBulkAdded as EventListener);
      };
   }, []);
   
   // Function to count new customers created in the current month
   const countNewCustomersThisMonth = async () => {
      try {
         const customers = await indexedDBService.getAllCustomers();
         const now = new Date();
         const currentMonth = now.getMonth();
         const currentYear = now.getFullYear();
         
         // Count customers created this month
         const newCustomersCount = customers.filter(customer => {
            if (!customer.createdAt) return false;
            
            const createdDate = new Date(customer.createdAt);
            return createdDate.getMonth() === currentMonth && 
                   createdDate.getFullYear() === currentYear;
         }).length;
         
         console.log(`Found ${newCustomersCount} new customers for current month`);
         setMonthlyNewCustomers(newCustomersCount);
      } catch (error) {
         console.error("Error counting new customers:", error);
      }
   };

   // Add state for monthly new customers count
   const [monthlyNewCustomers, setMonthlyNewCustomers] = useState<number>(0);

   // Add a console log to debug chart data after updates
   useEffect(() => {
      if (chartData.weeklyRevenue && chartData.weeklyRevenue.length > 0) {
         console.log("Weekly Revenue Chart Data:", chartData.weeklyRevenue);
         const totalRevenue = chartData.weeklyRevenue.reduce((sum, day) => sum + day.revenue, 0);
         console.log(`Total revenue in chart: ${totalRevenue}`);
      }
   }, [chartData.weeklyRevenue]);

   // Add state for custom service colors
   const [customServiceColors, setCustomServiceColors] = useState<{ [key: string]: string }>({});

   // Load custom colors from localStorage on initial render
   useEffect(() => {
      try {
         const savedColors = localStorage.getItem(SERVICE_COLORS_STORAGE_KEY);
         if (savedColors) {
            setCustomServiceColors(JSON.parse(savedColors));
         }
      } catch (err) {
         console.error('Error loading custom service colors:', err);
      }
   }, []);

   // Handle service color change
   const handleServiceColorChange = (serviceColors: { [key: string]: string }) => {
      try {
         setCustomServiceColors(serviceColors);
         localStorage.setItem(SERVICE_COLORS_STORAGE_KEY, JSON.stringify(serviceColors));
      } catch (err) {
         console.error('Error saving custom service colors:', err);
         toast.error('Failed to save custom service colors');
      }
   };

   if (!mounted) return null;

   return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
         {/* Decorative element */}
         <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
         
         <div className="relative p-6 max-w-7xl mx-auto">
            <div className="mb-6">
               <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Welcome{user && user.firstName ? ", " + user.firstName : ""}!
               </h1>
               <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Here's how your business is doing today
               </p>
            </div>

            {/* Business Link Prompt */}
            {showServicePrompt && (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl mb-6`}>
                  <div className="flex justify-between">
                     <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                        Setup Your Booking Page
                     </h2>
                     <button
                        onClick={() => setShowServicePrompt(false)}
                        className={`text-sm p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                     >
                        <XMarkIcon className="h-5 w-5" />
                     </button>
                  </div>
                  <p className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                     Would you like to set up a direct link to your most popular
                     service? This makes it easy to share with your customers.
                  </p>
                  <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label
                              htmlFor="serviceName"
                              className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                           >
                              Service Name
                           </label>
                           <input
                              type="text"
                              id="serviceName"
                              value={serviceName}
                              onChange={(e) => setServiceName(e.target.value)}
                              className={`w-full px-4 py-2 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-300"} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? "text-white" : "text-gray-800"}`}
                           />
                        </div>
                        <div>
                           <label
                              htmlFor="serviceLink"
                              className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                           >
                              Service Link
                           </label>
                           <input
                              type="text"
                              id="serviceLink"
                              value={serviceLink}
                              onChange={(e) => setServiceLink(e.target.value)}
                              className={`w-full px-4 py-2 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-300"} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? "text-white" : "text-gray-800"}`}
                           />
                        </div>
                     </div>
                     <div className="flex justify-end space-x-3">
                        <button
                           onClick={handleDeclineServiceLink}
                           className={`px-4 py-2 text-sm rounded-lg transition ${darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                           Not Now
                        </button>
                        <button
                           onClick={handleServiceLinkSave}
                           className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                        >
                           Save Service Link
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Stats Overview */}
            <div className="mb-6">
               <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                     Stats Overview
                  </h2>
                  <button
                     onClick={handleRefreshStats}
                     className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition ${
                        darkMode
                           ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                           : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200"
                     }`}
                  >
                     <ArrowPathIcon
                        className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                     />
                     {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
               </div>

               <div className="flex flex-wrap justify-center gap-8 mx-auto max-w-5xl">
                  {statDefinitions.map((stat) => (
                     <div
                        key={stat.key}
                        className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl transition-transform hover:scale-105 relative w-[280px]`}
                     >
                        <div className="flex items-center justify-start w-full">
                           <div className={`rounded-full p-3 ${darkMode ? "bg-opacity-20" : "bg-opacity-10"} ${stat.color}`}>
                              {stat.icon}
                           </div>
                           <div className="ml-4">
                              <div className="flex items-center">
                                 <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    {stat.name}
                                 </p>
                                 
                                 {stat.revenuePeriod && (
                                    <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500">
                                       Today
                                    </span>
                                 )}
                              </div>
                              
                              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                                 {loading
                                    ? "..."
                                    : stat.revenuePeriod
                                       ? formatStatValue(stats.totalRevenue, stat)
                                       : formatStatValue(stats[stat.key as keyof DashboardStats], stat)
                                 }
                              </p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
               
               {lastUpdated && (
                  <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                     Last updated: {format(lastUpdated, "MMM d, yyyy h:mm a")}
                  </p>
               )}
            </div>
            
            {/* Personal Service Link */}
            {hasServiceLink && (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl mb-6`}>
                  <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                     Your Personal Booking Link
                  </h2>
                  <p className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                     Use this link to let customers book "{serviceName}" directly.
                  </p>
                  <div className={`p-4 rounded-lg border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-300"}`}>
                     <span className={darkMode ? "text-white" : "text-gray-800"}>
                        {serviceLink}
                     </span>
                  </div>
               </div>
            )}
            
            {/* Database Error Message */}
            {dbInitError && (
               <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  <p className="font-bold">Database Error</p>
                  <p>{dbInitError}</p>
                  <button 
                     className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                     onClick={() => {
                        indexedDBService.resetDatabase()
                           .then(() => window.location.reload())
                           .catch(err => console.error("Failed to reset database:", err));
                     }}
                  >
                     Reset Database
                  </button>
               </div>
            )}

            {/* Add the chart component after the stats grid */}
            <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                  <button
                     onClick={handleRefreshStats}
                     className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
                        darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-gray-700 hover:bg-gray-100'
                     } transition-colors duration-200`}
                  >
                     <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                     Refresh
                  </button>
               </div>
               
               <DashboardCharts 
                  revenueData={chartData.revenueData}
                  appointmentsByStatus={chartData.appointmentsByStatus}
                  weeklyRevenue={chartData.weeklyRevenue}
                  servicePopularity={chartData.servicePopularity}
                  revenueTrendPeriod={revenueTrendPeriod}
                  setRevenueTrendPeriod={setRevenueTrendPeriod}
                  darkMode={darkMode}
                  monthlyNewCustomers={monthlyNewCustomers}
                  confirmedAppointmentsRevenue={chartData.confirmedAppointmentsRevenue}
                  onServiceColorChange={handleServiceColorChange}
               />
            </div>
         </div>
      </div>
   );
}
