"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
   ArrowPathIcon,
   PlusIcon,
   TrashIcon,
   PencilIcon,
   CheckCircleIcon,
   XCircleIcon,
} from "@heroicons/react/24/outline";
import { Service } from "@/types/service";
import { useTheme } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { deleteService, fetchServices, clearAllServices, enableServicesFetching, getServices, updateService } from "@/services/serviceService";
import { useRouter } from "next/navigation";
import { indexedDBService } from "@/services/indexedDB";
import DeleteServiceDialog from "@/components/DeleteServiceDialog";
import { useTranslation } from "react-i18next";

export default function Services() {
   const router = useRouter();
   const [services, setServices] = useState<Service[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const { darkMode } = useTheme();
   const migrationDoneRef = useRef(false);
   const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
   const { t } = useTranslation();
   
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

   const handleToggleStatus = async (service: Service) => {
      try {
         setIsUpdatingStatus(service._id);
         
         // Toggle the active status
         const updatedService = await updateService(service._id, {
            isActive: !service.isActive
         });
         
         // Update the services list
         setServices(prevServices => 
            prevServices.map(s => 
               s._id === service._id ? {...s, isActive: !s.isActive} : s
            )
         );
         
         toast.success(`Service ${service.isActive ? 'deactivated' : 'activated'} successfully`);
      } catch (error) {
         console.error('Error updating service status:', error);
         toast.error('Failed to update service status');
      } finally {
         setIsUpdatingStatus(null);
      }
   };

   return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
         {/* Decorative element */}
         <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
         
         <div className="relative p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
               <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                     {t('services.services')}
                  </h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                     {t('services.service_list')}
                  </p>
               </div>
               <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
                  <button
                     onClick={handleRefresh}
                     disabled={isLoading}
                     className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                        darkMode
                           ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                           : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                     } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                     <ArrowPathIcon
                        className={`h-5 w-5 mr-2 ${isLoading ? "animate-spin" : ""}`} 
                     />
                     {isLoading ? t('common.refreshing') : t('common.refresh')}
                  </button>
                  <Link
                     href="/dashboard/services/add"
                     className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                        darkMode
                           ? "bg-purple-600 text-white hover:bg-purple-700"
                           : "bg-purple-600 text-white hover:bg-purple-700"
                     }`}
                  >
                     <PlusIcon className="h-5 w-5 mr-2" />
                     {t('services.add_service')}
                  </Link>
               </div>
            </div>

            {isLoading ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl flex justify-center items-center py-12`}>
                  <LoadingSpinner />
               </div>
            ) : errorMessage ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl`}>
                  <div className={`text-center py-8 ${darkMode ? "text-red-400" : "text-red-600"}`}>
                     {errorMessage}
                  </div>
               </div>
            ) : services.length === 0 ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl`}>
                  <div className="text-center py-8">
                     <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                        {t('services.no_services')}
                     </p>
                     <div className="flex flex-col items-center space-y-4 mt-4">
                        <Link
                           href="/dashboard/services/add"
                           className={`inline-flex items-center px-4 py-2 rounded-lg ${
                              darkMode
                                 ? "bg-purple-600 text-white hover:bg-purple-700"
                                 : "bg-purple-600 text-white hover:bg-purple-700"
                           }`}
                        >
                           <PlusIcon className="h-5 w-5 mr-2" />
                           {t('services.add_first_service')}
                        </Link>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                     <div
                        key={service._id}
                        className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl relative transition-all hover:shadow-lg ${!service.isActive ? "opacity-60" : ""}`}
                     >
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
                                 <h3 className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                                    {service.name}
                                 </h3>
                                 <div className="flex items-center mt-1">
                                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                       {service.duration} {t('services.duration')}
                                    </span>
                                    {service.hasOwnProperty('isActive') && (
                                       <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                                          service.isActive 
                                             ? darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700"
                                             : darkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700"
                                       }`}>
                                          {service.isActive ? t('services.active') : t('services.inactive')}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                        
                        <div className={`px-3 py-2 rounded-lg ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                           <div className="flex justify-between items-center mb-2">
                              <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                 {t('services.price')}
                              </span>
                              <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                                 EGP {service.price}
                              </span>
                           </div>
                           
                           {service.description && (
                              <div className="mt-3">
                                 <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    {t('services.description')}
                                 </span>
                                 <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    {service.description}
                                 </p>
                              </div>
                           )}
                        </div>
                        
                        <div className="mt-4 flex justify-between">
                           <button
                              onClick={() => handleToggleStatus(service)}
                              disabled={isUpdatingStatus === service._id}
                              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                 darkMode
                                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                              } ${isUpdatingStatus === service._id ? "opacity-70 cursor-not-allowed" : ""}`}
                           >
                              {isUpdatingStatus === service._id ? (
                                 <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                              ) : service.isActive ? (
                                 <XCircleIcon className="h-4 w-4 mr-1.5" />
                              ) : (
                                 <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              )}
                              {service.isActive ? t('services.deactivate') : t('services.activate')}
                           </button>
                           
                           <div className="flex space-x-1">
                              <Link
                                 href={`/dashboard/services/edit/${service._id}`}
                                 className={`p-2 rounded-lg transition ${
                                    darkMode
                                       ? "text-gray-400 hover:text-white hover:bg-white/10"
                                       : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                 }`}
                              >
                                 <PencilIcon className="h-5 w-5" />
                              </Link>
                              
                              <button
                                 onClick={() => handleDeleteService(service._id)}
                                 className={`p-2 rounded-lg transition ${
                                    darkMode
                                       ? "text-gray-400 hover:text-red-300 hover:bg-red-900/20"
                                       : "text-gray-500 hover:text-red-700 hover:bg-red-50"
                                 }`}
                              >
                                 <TrashIcon className="h-5 w-5" />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
         
         {/* Delete confirmation dialog */}
         <DeleteServiceDialog 
            isOpen={!!serviceToDelete}
            isDeleting={isDeleting}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
         />
      </div>
   );
}
