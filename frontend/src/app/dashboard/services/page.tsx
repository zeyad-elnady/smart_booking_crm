"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
   ArrowPathIcon,
   PlusIcon,
   TrashIcon,
   PencilIcon,
} from "@heroicons/react/24/outline";
import { Service } from "@/types/service";
import { useTheme } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { deleteService, fetchServices, clearAllServices, enableServicesFetching, getServices } from "@/services/serviceService";
import { useRouter } from "next/navigation";
import { indexedDBService } from "@/services/indexedDB";
import DeleteServiceDialog from "@/components/DeleteServiceDialog";

export default function Services() {
   const router = useRouter();
   const [services, setServices] = useState<Service[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const { darkMode } = useTheme();
   const migrationDoneRef = useRef(false);
   const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   
   // Initial setup - migrate any existing data
   useEffect(() => {
      // This runs once on component mount to handle any data migration
      const handleDataMigration = async () => {
         try {
            // Initialize database if needed
            await indexedDBService.initDB();
            
            // Migrate any services from localStorage to IndexedDB
            await indexedDBService.migrateServicesFromLocalStorage();
            
            // Clear any migration flags to prevent duplicate notifications
            localStorage.removeItem("serviceListShouldRefresh");
         } catch (error) {
            console.error("Error during service data migration:", error);
         }
      };
      
      handleDataMigration();
   }, []);

   useEffect(() => {
      const fetchServices = async () => {
         try {
            setIsLoading(true);
            setErrorMessage(null);
            
            // Use our updated getServices function
            const fetchedServices = await getServices();
            setServices(fetchedServices || []);
         } catch (error) {
            console.error('Error fetching services:', error);
            // Don't show error messages to the user anymore
         } finally {
            setIsLoading(false);
         }
      };
      
      fetchServices();
      
      // Listen for service list refresh events
      const handleStorageChange = (e: StorageEvent) => {
         if (e.key === 'serviceListShouldRefresh') {
            fetchServices();
         }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
   }, []);

   const handleRefresh = async () => {
      try {
         await getServices();
         toast.success("Services refreshed successfully");
      } catch (err: any) {
         console.error("Services refresh error:", err);
         setErrorMessage(err.message || "Failed to refresh services");
         toast.error("Failed to refresh services");
      }
   };

   const handleDeleteService = async (serviceId: string) => {
      // Show the custom delete dialog instead of deleting directly
      setServiceToDelete(serviceId);
   };

   // Handle confirm delete
   const handleConfirmDelete = async () => {
      if (!serviceToDelete) return;
      
      try {
         setIsDeleting(true);
         
         await deleteService(serviceToDelete);
         
         // Update the state to remove the deleted service
         setServices(prevServices => 
            prevServices.filter(service => service._id !== serviceToDelete)
         );
         
         toast.success('Service deleted successfully');
      } catch (error) {
         console.error('Error deleting service:', error);
         toast.error('Failed to delete service');
      } finally {
         setIsDeleting(false);
         setServiceToDelete(null); // Close dialog
      }
   };

   // Handle cancel delete
   const handleCancelDelete = () => {
      setServiceToDelete(null);
   };

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
                  disabled={isLoading}
                  className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:scale-105 ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100"
                  }`}
               >
                  <ArrowPathIcon
                     className={`h-5 w-5 mr-1 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {isLoading ? "Refreshing..." : "Refresh"}
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

         {isLoading ? (
            <div className="flex justify-center items-center py-8">
               <LoadingSpinner />
            </div>
         ) : errorMessage ? (
            <div className="text-center py-8 text-red-500">{errorMessage}</div>
         ) : services.length === 0 ? (
            <div className="text-center py-8">
               <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                  No services found.
               </p>
               <div className="flex flex-col items-center space-y-4 mt-4">
                  <Link
                     href="/dashboard/services/add"
                     className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        darkMode
                           ? "bg-purple-600 text-white hover:bg-purple-500"
                           : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                     }`}
                  >
                     <PlusIcon className="h-5 w-5 mr-2" />
                     Add Your First Service
                  </Link>
               </div>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {services.map((service) => (
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
                                 {service.name ? service.name[0].toUpperCase() : '?'}
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
                              <span>Duration: {service.duration} minutes</span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <span>Price: ${service.price}</span>
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

         {/* Delete Service Dialog */}
         <DeleteServiceDialog
            isOpen={serviceToDelete !== null}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            darkMode={darkMode}
            isDeleting={isDeleting}
         />
      </div>
   );
}
