"use client";

import { useState, useEffect } from "react";
import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface RevenueData {
   date: string;
   revenue: number;
}

const RevenueChart = () => {
   const { darkMode } = useTheme();
   const [data, setData] = useState<RevenueData[]>([]);
   const [period, setPeriod] = useState<"day" | "week" | "month">("day");
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchRevenueData();
   }, [period]);

   const fetchRevenueData = async () => {
      try {
         setLoading(true);
         const response = await fetch(
            `/api/dashboard/revenue-stats?period=${period}`
         );
         if (!response.ok) {
            throw new Error("Failed to fetch revenue data");
         }
         const result = await response.json();
         console.log("Revenue API Response:", result); // Debug log

         if (result.success && Array.isArray(result.data)) {
            const formattedData = result.data.map(
               (item: { date: string; revenue: number | string }) => ({
                  date: item.date,
                  revenue: Number(item.revenue) || 0,
               })
            );
            console.log("Formatted Revenue Data:", formattedData); // Debug log
            setData(formattedData);
         } else {
            console.error("Invalid data format received:", result);
            setData([]);
         }
      } catch (error) {
         console.error("Error fetching revenue data:", error);
         setData([]);
      } finally {
         setLoading(false);
      }
   };

   const formatDate = (date: string) => {
      try {
         switch (period) {
            case "day":
               return new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
               });
            case "week":
               return `Week ${date.split("-W")[1]}`;
            case "month":
               return new Date(date + "-01").toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
               });
            default:
               return date;
         }
      } catch (error) {
         console.error("Error formatting date:", date, error);
         return date;
      }
   };

   const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: "USD",
         minimumFractionDigits: 0,
         maximumFractionDigits: 0,
      }).format(value);
   };

   if (loading) {
      return (
         <div
            className={`w-full h-[400px] flex items-center justify-center ${
               darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg`}
         >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
         </div>
      );
   }

   if (!data || data.length === 0) {
      return (
         <div
            className={`w-full h-[400px] flex items-center justify-center ${
               darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg`}
         >
            <p
               className={`text-lg ${
                  darkMode ? "text-gray-400" : "text-gray-500"
               }`}
            >
               No revenue data available for this period
            </p>
         </div>
      );
   }

   return (
      <div
         className={`w-full space-y-4 p-4 rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
         }`}
      >
         <div className="flex justify-between items-center">
            <h3
               className={`text-lg font-semibold ${
                  darkMode ? "text-gray-200" : "text-gray-800"
               }`}
            >
               Revenue Trend
            </h3>
            <div className="flex gap-2">
               <button
                  onClick={() => setPeriod("day")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                     period === "day"
                        ? darkMode
                           ? "bg-blue-600 text-white"
                           : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
               >
                  Daily
               </button>
               <button
                  onClick={() => setPeriod("week")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                     period === "week"
                        ? darkMode
                           ? "bg-blue-600 text-white"
                           : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
               >
                  Weekly
               </button>
               <button
                  onClick={() => setPeriod("month")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                     period === "month"
                        ? darkMode
                           ? "bg-blue-600 text-white"
                           : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
               >
                  Monthly
               </button>
            </div>
         </div>

         <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart
                  data={data}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
               >
                  <CartesianGrid
                     strokeDasharray="3 3"
                     stroke={darkMode ? "#374151" : "#f0f0f0"}
                  />
                  <XAxis
                     dataKey="date"
                     tickFormatter={formatDate}
                     tick={{ fill: darkMode ? "#9CA3AF" : "#666666" }}
                     stroke={darkMode ? "#4B5563" : "#E5E7EB"}
                  />
                  <YAxis
                     tickFormatter={formatCurrency}
                     tick={{ fill: darkMode ? "#9CA3AF" : "#666666" }}
                     stroke={darkMode ? "#4B5563" : "#E5E7EB"}
                  />
                  <Tooltip
                     formatter={(value: number) => [
                        formatCurrency(value),
                        "Revenue",
                     ]}
                     labelFormatter={formatDate}
                     contentStyle={{
                        backgroundColor: darkMode ? "#1F2937" : "white",
                        border: `1px solid ${darkMode ? "#374151" : "#E5E7EB"}`,
                        color: darkMode ? "#E5E7EB" : "#1F2937",
                     }}
                  />
                  <Line
                     type="monotone"
                     dataKey="revenue"
                     stroke={darkMode ? "#60A5FA" : "#3B82F6"}
                     strokeWidth={2}
                     dot={{ fill: darkMode ? "#60A5FA" : "#3B82F6", r: 4 }}
                     activeDot={{ r: 6 }}
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
   );
};

export default RevenueChart;
