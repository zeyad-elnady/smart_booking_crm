"use client";

import { useState, useEffect } from "react";
import {
   PlusIcon,
   MagnifyingGlassIcon,
   ArrowPathIcon,
   UserPlusIcon,
   PhoneIcon,
   CalendarIcon,
   PencilIcon,
   TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { customerAPI, Customer } from "@/services/api";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function Customers() {
   const router = useRouter();
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [loading, setLoading] = useState(true);
   const [isMockData, setIsMockData] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const { darkMode } = useTheme();

   async function fetchCustomers() {
      try {
         setLoading(true);
         console.log("Fetching customers from API...");
         const data = await customerAPI.getCustomers();
         console.log("Received customers data:", data);
         setCustomers(data);

         // Check if we're using mock data by looking for mock_ in ID
         const hasMockData = data.some((customer: Customer) =>
            customer._id.toString().includes("mock_")
         );
         setIsMockData(hasMockData);
      } catch (error) {
         console.error("Failed to fetch customers:", error);
         setIsMockData(true);
         setError("Failed to fetch customers. Please try again later.");
      } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      fetchCustomers();

      // Setup listener for navigation events to refresh data
      const handleRouteChange = () => {
         console.log("Navigation detected, refreshing customers");
         fetchCustomers();
      };

      // Add event listener for focus
      window.addEventListener("focus", handleRouteChange);

      // Setup refresh on navigation
      const checkNavigation = () => {
         const shouldRefresh = localStorage.getItem(
            "customerListShouldRefresh"
         );
         if (shouldRefresh === "true") {
            console.log("Refresh flag detected, refreshing customers");
            localStorage.removeItem("customerListShouldRefresh");
            fetchCustomers();
         }
      };

      // Check immediately and then setup interval
      checkNavigation();
      const intervalId = setInterval(checkNavigation, 1000);

      return () => {
         window.removeEventListener("focus", handleRouteChange);
         clearInterval(intervalId);
      };
   }, []);

   // Handle manual refresh button click
   const handleRefresh = () => {
      console.log("Manual refresh requested");
      fetchCustomers();
   };

   // Handle edit customer click
   const handleEditClick = (customerId: string) => {
      console.log("Navigating to edit customer", customerId);
      router.push(`/dashboard/customers/edit/${customerId}`);
   };

   const handleDeleteClick = async (
      customerId: string,
      confirmation: boolean = false
   ) => {
      try {
         const response = await customerAPI.deleteCustomer(
            customerId,
            confirmation
         );

         if (response.affectedAppointments && !confirmation) {
            const confirmDelete = window.confirm(
               `This customer has ${response.affectedAppointments} appointments. Deleting this customer will also delete all associated appointments. Are you sure you want to proceed?`
            );

            if (confirmDelete) {
               return handleDeleteClick(customerId, true);
            }
            return;
         }

         // Refresh the customer list after successful deletion
         await fetchCustomers();
         toast.success("Customer deleted successfully");
      } catch (error) {
         console.error("Failed to delete customer:", error);
         toast.error("Failed to delete customer");
      }
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
                  Customers
               </h1>
               <p
                  className={`mt-2 text-sm ${
                     darkMode ? "text-white/80" : "text-gray-600"
                  }`}
               >
                  A list of all customers in your database including their
                  contact information and appointment history.
               </p>
               {isMockData && (
                  <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
                     <p className="text-xs text-yellow-300">
                        ⚠️ Using mock data - Some features may be limited. The
                        backend server is currently unavailable.
                     </p>
                  </div>
               )}
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
                  href="/dashboard/customers/add"
                  className={`inline-flex items-center gap-x-2 rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-500 focus-visible:outline-purple-600"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus-visible:outline-gray-600"
                  }`}
               >
                  <UserPlusIcon
                     className="-ml-0.5 h-5 w-5"
                     aria-hidden="true"
                  />
                  Add Customer
               </Link>
            </div>
         </div>

         {/* Loading State */}
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
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {customers.map((customer) => (
                  <div
                     key={customer._id}
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
                                 {customer.firstName[0]}
                                 {customer.lastName[0]}
                              </div>
                              <div>
                                 <h3
                                    className={`text-lg font-semibold ${
                                       darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                 >
                                    {customer.firstName} {customer.lastName}
                                 </h3>
                                 <p
                                    className={`text-sm ${
                                       darkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                    }`}
                                 >
                                    {customer.email}
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div
                           className={`space-y-2 mb-4 text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                           }`}
                        >
                           <div className="flex items-center space-x-2">
                              <PhoneIcon className="h-4 w-4" />
                              <span>{customer.phone || "No phone number"}</span>
                           </div>
                        </div>

                        <div
                           className={`flex items-center justify-end space-x-2 mt-4 pt-4 border-t ${
                              darkMode ? "border-gray-700" : "border-gray-200"
                           }`}
                        >
                           <button
                              onClick={() => handleEditClick(customer._id)}
                              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                 darkMode
                                    ? "text-purple-400 hover:text-purple-300 bg-purple-600/10 hover:bg-purple-600/20"
                                    : "text-purple-600 hover:text-purple-500 bg-purple-50 hover:bg-purple-100"
                              }`}
                           >
                              <PencilIcon className="h-4 w-4 mr-1.5" />
                              Edit
                           </button>
                           <button
                              onClick={() => handleDeleteClick(customer._id)}
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
