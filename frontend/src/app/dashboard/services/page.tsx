"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
   ArrowPathIcon,
   PlusIcon,
   TrashIcon,
   MagnifyingGlassIcon,
   ClockIcon,
   CurrencyDollarIcon,
   PencilIcon,
   TagIcon,
} from "@heroicons/react/24/outline";
import { serviceAPI } from "@/services/api";
import { Service } from "@/types/service";
import { useTheme } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { deleteService } from "@/services/serviceService";

export default function Services() {
   const [services, setServices] = useState<Service[]>([]);
   const [filteredServices, setFilteredServices] = useState<Service[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const { darkMode } = useTheme();

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

   const handleDeleteService = async (id: string) => {
      try {
         // First call to get confirmation data
         const confirmationData = await deleteService(id);

         if (confirmationData.affectedAppointments) {
            // Show confirmation dialog
            const confirmed = window.confirm(
               `This service has ${confirmationData.affectedAppointments} associated appointments. ` +
                  `Deleting this service will also delete all associated appointments. ` +
                  `Are you sure you want to proceed?`
            );

            if (confirmed) {
               // Second call to confirm deletion
               await deleteService(id, true);
               toast.success(
                  "Service and associated appointments deleted successfully"
               );
               // Refresh the services list
               handleRefresh();
            }
         } else {
            // If no appointments, proceed with deletion
            await deleteService(id, true);
            toast.success("Service deleted successfully");
            // Refresh the services list
            handleRefresh();
         }
      } catch (error) {
         console.error("Error deleting service:", error);
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

   useEffect(() => {
      const fetchServices = async () => {
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

      fetchServices();
   }, []);

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
                     darkMode ? "text-white/80" : "text-gray-600"
                  }`}
               >
                  A list of all services available in your business.
               </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-4">
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

         <div
            className={`flex items-center space-x-4 ${
               darkMode ? "text-white" : "text-gray-900"
            }`}
         >
            <div className="relative flex-1">
               <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 transition-colors ${
                     darkMode
                        ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:ring-purple-500/20"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-purple-500/20"
                  }`}
               />
            </div>
         </div>

         {loading ? (
            <div className="flex justify-center items-center py-8">
               <LoadingSpinner />
            </div>
         ) : error ? (
            <div
               className={`text-center py-8 ${
                  darkMode ? "text-red-400" : "text-red-600"
               }`}
            >
               {error}
            </div>
         ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
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
                           ? "text-purple-400 hover:text-purple-300"
                           : "text-purple-600 hover:text-purple-500"
                     }`}
                  >
                     Add your first service
                  </Link>
               )}
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredServices.map((service) => (
                  <div
                     key={service._id}
                     className={`rounded-lg border transition-all hover:shadow-lg ${
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
                                 {service.name[0].toUpperCase()}
                              </div>
                              <div>
                                 <h3
                                    className={`text-lg font-semibold ${
                                       darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                 >
                                    {service.name}
                                 </h3>
                                 {service.category && (
                                    <div className="flex items-center text-sm space-x-1">
                                       <TagIcon
                                          className={`h-4 w-4 ${
                                             darkMode
                                                ? "text-gray-400"
                                                : "text-gray-600"
                                          }`}
                                       />
                                       <span
                                          className={
                                             darkMode
                                                ? "text-gray-400"
                                                : "text-gray-600"
                                          }
                                       >
                                          {service.category}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        {service.description && (
                           <p
                              className={`text-sm mb-4 ${
                                 darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                           >
                              {service.description}
                           </p>
                        )}

                        <div
                           className={`space-y-2 mb-4 text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                           }`}
                        >
                           <div className="flex items-center space-x-2">
                              <ClockIcon className="h-4 w-4" />
                              <span>{service.duration} minutes</span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <CurrencyDollarIcon className="h-4 w-4" />
                              <span>${service.price}</span>
                           </div>
                        </div>

                        <div
                           className={`flex items-center justify-end space-x-2 mt-4 pt-4 border-t ${
                              darkMode ? "border-gray-700" : "border-gray-200"
                           }`}
                        >
                           <Link
                              href={`/dashboard/services/${service._id}`}
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
                              onClick={() => handleDeleteService(service._id)}
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
         )}
      </div>
   );
}
