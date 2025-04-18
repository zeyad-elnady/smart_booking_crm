"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
   ArrowPathIcon,
   PlusIcon,
   TrashIcon,
   MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { serviceAPI } from "@/services/api";
import { Service } from "@/types/service";
import { useDarkMode } from "@/context/DarkModeContext";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function Services() {
   const [services, setServices] = useState<Service[]>([]);
   const [filteredServices, setFilteredServices] = useState<Service[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const { darkMode } = useDarkMode();

   const handleRefresh = async () => {
      try {
         setLoading(true);
         const data = await serviceAPI.getServices();
         setServices(data);
         setFilteredServices(data);
         toast.success("Services refreshed successfully");
      } catch (err: any) {
         console.error("Services refresh error:", err);
         setError(err.response?.data?.message || "Failed to refresh services");
         toast.error("Failed to refresh services");
      } finally {
         setLoading(false);
      }
   };

   const handleDelete = async (serviceId: string) => {
      if (!confirm("Are you sure you want to delete this service?")) return;

      try {
         await serviceAPI.deleteService(serviceId);
         const updatedServices = services.filter(
            (service) => service._id !== serviceId
         );
         setServices(updatedServices);
         setFilteredServices(
            updatedServices.filter(
               (service) =>
                  service.name
                     .toLowerCase()
                     .includes(searchQuery.toLowerCase()) ||
                  (service.description?.toLowerCase() || "").includes(
                     searchQuery.toLowerCase()
                  ) ||
                  (service.category?.toLowerCase() || "").includes(
                     searchQuery.toLowerCase()
                  )
            )
         );
         toast.success("Service deleted successfully");
      } catch (err: any) {
         console.error("Service delete error:", err);
         toast.error("Failed to delete service");
      }
   };

   const handleSearch = (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
         setFilteredServices(services);
         return;
      }
      const lowercaseQuery = query.toLowerCase();
      const filtered = services.filter(
         (service) =>
            service.name.toLowerCase().includes(lowercaseQuery) ||
            (service.description?.toLowerCase() || "").includes(
               lowercaseQuery
            ) ||
            (service.category?.toLowerCase() || "").includes(lowercaseQuery)
      );
      setFilteredServices(filtered);
   };

   const fetchInitialServices = async () => {
      try {
         setLoading(true);
         const data = await serviceAPI.getServices();
         setServices(data);
         setFilteredServices(data);
      } catch (err: any) {
         console.error("Services load error:", err);
         setError(err.response?.data?.message || "Failed to load services");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchInitialServices();
   }, []);

   return (
      <div className="space-y-6 animate-fadeIn">
         <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
               <h1 className="text-2xl font-semibold text-white">Services</h1>
               <p className="mt-2 text-sm text-gray-300">
                  A list of all services available in your business.
               </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center space-x-4">
               <button
                  onClick={handleRefresh}
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
                  href="/dashboard/services/add"
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:scale-105 ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Service
               </Link>
            </div>
         </div>

         <div className="glass border border-white/10 rounded-xl p-4">
            <div className="relative">
               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
               </div>
               <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`block w-full rounded-lg border pl-10 p-2.5 text-sm ${
                     darkMode
                        ? "bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
               />
            </div>
         </div>

         {loading && (
            <div className="flex justify-center items-center">
               <LoadingSpinner />
            </div>
         )}

         {error && !loading && (
            <div
               className={`mt-4 ${darkMode ? "text-red-400" : "text-red-600"}`}
            >
               Error: {error}
            </div>
         )}

         {!loading && !error && filteredServices.length === 0 && (
            <div className="text-center mt-8">
               <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                  {searchQuery
                     ? "No services found matching your search."
                     : "No services found."}
               </p>
               {!searchQuery && (
                  <Link
                     href="/dashboard/services/add"
                     className={`mt-2 inline-block ${
                        darkMode
                           ? "text-indigo-400 hover:text-indigo-300"
                           : "text-blue-600 hover:underline"
                     }`}
                  >
                     Add your first service
                  </Link>
               )}
            </div>
         )}

         {!loading && !error && filteredServices.length > 0 && (
            <div className="space-y-4">
               {filteredServices.map((service) => (
                  <div
                     key={service._id}
                     className="glass border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                           <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                              {service.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                              <div className="text-sm font-medium text-white">
                                 {service.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                 {service.description}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-6">
                           <div className="text-right">
                              <div className="text-sm text-gray-400">
                                 {service.duration} minutes
                              </div>
                              <div className="text-sm font-medium text-white">
                                 ${service.price}
                              </div>
                           </div>
                           <div className="flex items-center space-x-4">
                              <Link
                                 href={`/dashboard/services/${service._id}`}
                                 className={`text-sm font-medium ${
                                    darkMode
                                       ? "text-indigo-400 hover:text-indigo-300"
                                       : "text-blue-600 hover:text-blue-900"
                                 }`}
                              >
                                 Edit
                              </Link>
                              <button
                                 onClick={() => handleDelete(service._id)}
                                 className={`text-sm font-medium ${
                                    darkMode
                                       ? "text-red-400 hover:text-red-300"
                                       : "text-red-600 hover:text-red-700"
                                 }`}
                              >
                                 Delete
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
