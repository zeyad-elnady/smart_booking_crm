"use client";

import { useState, useEffect } from "react";
import {
   ArrowPathIcon,
   UserPlusIcon,
   PhoneIcon,
   PencilIcon,
   TrashIcon,
   MagnifyingGlassIcon,
   XCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Customer } from "@/types/customer";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { indexedDBService } from "@/services/indexedDB";
import DeleteCustomerDialog from "@/components/DeleteCustomerDialog";

export default function Customers() {
   const router = useRouter();
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
   const [searchTerm, setSearchTerm] = useState("");
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const { darkMode } = useTheme();
   const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);

   // Load customers directly from IndexedDB
   async function loadCustomers() {
      try {
         setLoading(true);
         setError(null);
         
         // Initialize database if needed
         if (!indexedDBService.db) {
            await indexedDBService.initDB();
         }
         
         // Get all customers from database
         const allCustomers = await indexedDBService.getAllCustomers();
         
         // Sort by name
         allCustomers.sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
         });
         
         setCustomers(allCustomers);
         setFilteredCustomers(allCustomers);
         
         if (allCustomers.length === 0) {
            console.log("No customers found in database");
         } else {
            console.log(`Loaded ${allCustomers.length} customers from database`);
         }
      } catch (err) {
         console.error("Error loading customers:", err);
         setError("Failed to load customers. Please try resetting the database.");
      } finally {
         setLoading(false);
      }
   }

   // Handle search 
   const handleSearch = async (term: string) => {
      setSearchTerm(term);
      
      if (!term.trim()) {
         setFilteredCustomers(customers);
         return;
      }
      
      // Use the database search function
      const results = await indexedDBService.searchCustomersByName(term);
      setFilteredCustomers(results);
   };

   useEffect(() => {
      // Load customers when component mounts
      loadCustomers();
      
      // Set up a refresh check
      const refreshInterval = setInterval(() => {
         const shouldRefresh = localStorage.getItem("customerListShouldRefresh");
         if (shouldRefresh === "true") {
            localStorage.removeItem("customerListShouldRefresh");
            loadCustomers();
         }
      }, 1000);
      
      return () => clearInterval(refreshInterval);
   }, []);

   // Handle delete customer
   const handleDeleteCustomer = async (customerId: string) => {
      // Show the custom delete dialog instead of window.confirm
      setCustomerToDelete(customerId);
   };

   // Handle confirm delete
   const handleConfirmDelete = async () => {
      if (!customerToDelete) return;
      
      try {
         setIsDeleting(true);
         
         // Use the enhanced delete function that handles appointments too
         await indexedDBService.deleteCustomer(customerToDelete);
         
         toast.success("Customer deleted successfully");
         
         // Reload customer list
         await loadCustomers();
      } catch (error) {
         console.error("Failed to delete customer:", error);
         toast.error("Failed to delete customer");
      } finally {
         setIsDeleting(false);
         setCustomerToDelete(null); // Close dialog
      }
   };

   // Handle cancel delete
   const handleCancelDelete = () => {
      setCustomerToDelete(null);
   };

   // Handle edit customer
   const handleEditCustomer = (customerId: string) => {
      router.push(`/dashboard/customers/edit/${customerId}`);
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
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center space-x-3">
               {/* Search bar */}
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                     type="text"
                     value={searchTerm}
                     onChange={(e) => handleSearch(e.target.value)}
                     placeholder="Search customers..."
                     className={`block w-full pl-10 py-2 pr-3 border rounded-md ${
                        darkMode 
                           ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                           : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                     }`}
                  />
               </div>
               
               <button
                  onClick={loadCustomers}
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
                  {loading ? "Loading..." : "Refresh"}
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

         {/* Customer List */}
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
         ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
               {searchTerm ? (
                  <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                     No customers match your search.
                  </p>
               ) : (
                  <div className="space-y-4">
                     <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        No customers found. Add your first customer to get started.
                     </p>
                     <Link
                        href="/dashboard/customers/add"
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                           darkMode
                              ? "bg-purple-600 text-white hover:bg-purple-500"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                        }`}
                     >
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Add Your First Customer
                     </Link>
                  </div>
               )}
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredCustomers.map((customer) => (
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
                                 {customer.firstName?.[0] || '?'}
                                 {customer.lastName?.[0] || '?'}
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
                                    {customer.email || 'No email'}
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
                              onClick={() => handleEditCustomer(customer._id)}
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
                              onClick={() => handleDeleteCustomer(customer._id)}
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

         {/* Delete Customer Dialog */}
         <DeleteCustomerDialog
            isOpen={customerToDelete !== null}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            darkMode={darkMode}
            isDeleting={isDeleting}
         />
      </div>
   );
}
