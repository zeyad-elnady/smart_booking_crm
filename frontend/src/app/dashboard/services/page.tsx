"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { serviceAPI, Service, testConnections } from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "react-hot-toast";

const TestConnectionButton = () => {
   const { darkMode } = useTheme();
   const [testing, setTesting] = useState(false);

   const handleTest = async () => {
      try {
         setTesting(true);
         const result = await testConnections();
         console.log("Connection test results:", result);
         if (result.success) {
            toast.success("All connections working properly!");
         } else {
            toast.error(`Connection test failed: ${result.error}`);
         }
      } catch (error) {
         console.error("Test failed:", error);
         toast.error("Connection test failed");
      } finally {
         setTesting(false);
      }
   };

   return (
      <button
         onClick={handleTest}
         disabled={testing}
         className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
            darkMode
               ? "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400"
               : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100"
         }`}
      >
         {testing ? "Testing..." : "Test Connections"}
      </button>
   );
};

export default function Services() {
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [debugInfo, setDebugInfo] = useState<string | null>(null);
   const { darkMode } = useTheme();

   // Fetch services on component mount
   useEffect(() => {
      const fetchServices = async () => {
         try {
            setLoading(true);
            setDebugInfo("Fetching services...");
            const data = await serviceAPI.getServices();
            setServices(data);
            setDebugInfo(`Fetched ${data.length} services successfully`);
            setLoading(false);
         } catch (err: any) {
            console.error("Services fetch error:", err);
            setError(err.response?.data?.message || "Failed to fetch services");
            setDebugInfo(`Error: ${JSON.stringify(err.message || err)}`);
            setLoading(false);
         }
      };

      fetchServices();
   }, []);

   // Handle loading state
   if (loading) {
      return (
         <div className="flex flex-col justify-center items-center h-96">
            <div
               className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                  darkMode ? "border-purple-500" : "border-gray-300"
               } mb-4`}
            ></div>
            {debugInfo && (
               <div
                  className={`text-sm ${
                     darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
               >
                  {debugInfo}
               </div>
            )}
         </div>
      );
   }

   // Handle error state
   if (error) {
      return (
         <div className="text-center py-10">
            <div className="text-red-500 text-xl">{error}</div>
            {debugInfo && (
               <div
                  className={`text-sm mt-2 ${
                     darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
               >
                  {debugInfo}
               </div>
            )}
            <div className="mt-4 flex justify-center space-x-4">
               <button
                  onClick={() => window.location.reload()}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  Try Again
               </button>
               <Link
                  href="/dashboard/services"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                     darkMode
                        ? "bg-gray-800 text-white hover:bg-gray-700"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  Direct Link
               </Link>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-fadeIn">
         <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
               <h1
                  className={`text-2xl font-semibold ${
                     darkMode ? "text-white" : "text-gray-900"
                  }`}
               >
                  Services
               </h1>
               <p
                  className={`mt-2 text-sm ${
                     darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
               >
                  A list of all services offered by your business including
                  pricing and duration.
               </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-4">
               <TestConnectionButton />
               <Link
                  href="/dashboard/services/add"
                  className={`inline-block rounded-lg px-4 py-2 text-center text-sm font-semibold shadow-sm transition-all hover:scale-105 ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  <PlusIcon className="h-5 w-5 inline-block mr-1" />
                  Add Service
               </Link>
            </div>
         </div>

         <div
            className={`rounded-lg overflow-hidden shadow-sm ${
               darkMode
                  ? "glass border border-white/10"
                  : "bg-white border border-gray-200"
            }`}
         >
            <table
               className={`min-w-full divide-y ${
                  darkMode ? "divide-white/10" : "divide-gray-200"
               }`}
            >
               <thead>
                  <tr>
                     <th
                        scope="col"
                        className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                           darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                     >
                        Service
                     </th>
                     <th
                        scope="col"
                        className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                           darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                     >
                        Duration
                     </th>
                     <th
                        scope="col"
                        className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                           darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                     >
                        Price
                     </th>
                     <th
                        scope="col"
                        className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                           darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                     >
                        Status
                     </th>
                     <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                     </th>
                  </tr>
               </thead>
               <tbody
                  className={`divide-y ${
                     darkMode ? "divide-white/10" : "divide-gray-200"
                  }`}
               >
                  {services.map((service) => (
                     <tr
                        key={service._id}
                        className={`transition-colors ${
                           darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                        }`}
                     >
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center">
                              <div
                                 className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold ${
                                    darkMode
                                       ? "bg-gray-700 text-white"
                                       : "bg-gray-200 text-gray-900"
                                 }`}
                              >
                                 {(service.name && service.name.charAt(0)) ||
                                    "S"}
                              </div>
                              <div className="ml-4">
                                 <div
                                    className={`text-sm font-medium ${
                                       darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                 >
                                    {service.name || "Unnamed Service"}
                                 </div>
                                 <div
                                    className={`text-sm ${
                                       darkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                    }`}
                                 >
                                    {service.description ||
                                       "No description available"}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td
                           className={`px-6 py-4 whitespace-nowrap text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-500"
                           }`}
                        >
                           {service.duration}
                        </td>
                        <td
                           className={`px-6 py-4 whitespace-nowrap text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-500"
                           }`}
                        >
                           {service.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                 darkMode
                                    ? `bg-gradient-to-r ${
                                         service.isActive
                                            ? "from-green-400 to-emerald-500"
                                            : "from-gray-400 to-gray-500"
                                      } text-white`
                                    : service.isActive
                                    ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                                    : "bg-gray-50 text-gray-600 ring-1 ring-gray-500/20"
                              }`}
                           >
                              {service.isActive ? "Active" : "Inactive"}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <Link
                              href={`/dashboard/services/edit/${service._id}`}
                              className={`transition-colors mr-3 ${
                                 darkMode
                                    ? "text-gray-300 hover:text-white"
                                    : "text-gray-600 hover:text-gray-900"
                              }`}
                           >
                              Edit
                           </Link>
                           <button
                              onClick={async () => {
                                 try {
                                    await serviceAPI.deleteService(service._id);
                                    setServices(
                                       services.filter(
                                          (s) => s._id !== service._id
                                       )
                                    );
                                 } catch (err: any) {
                                    alert(
                                       err.response?.data?.message ||
                                          "Failed to delete service"
                                    );
                                 }
                              }}
                              className={`transition-colors ${
                                 darkMode
                                    ? "text-red-400 hover:text-red-300"
                                    : "text-red-600 hover:text-red-700"
                              }`}
                           >
                              Delete
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
