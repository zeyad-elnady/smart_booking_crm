"use client";

import { useState, useEffect } from "react";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { customerAPI, Customer } from "@/services/api";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function Customers() {
   const router = useRouter();
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [searchTerm, setSearchTerm] = useState("");
   const [loading, setLoading] = useState(true);
   const [isMockData, setIsMockData] = useState(false);
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

   const handleDeleteClick = async (customerId: string) => {
      try {
         await customerAPI.deleteCustomer(customerId);
         // Refresh the customer list after deletion
         fetchCustomers();
      } catch (error) {
         console.error("Failed to delete customer:", error);
      }
   };

   const filteredCustomers = customers.filter(
      (customer) =>
         `${customer.firstName} ${customer.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
   );

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
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
               <Link
                  href="/dashboard/customers/add"
                  className={`block rounded-lg px-4 py-2 text-center text-sm font-semibold shadow-sm transition-all hover:scale-105 flex items-center ${
                     darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  <PlusIcon className="h-5 w-5 inline-block mr-1" />
                  Add Customer
               </Link>
            </div>
         </div>

         <div
            className={`rounded-lg shadow-sm ${
               darkMode ? "glass" : "bg-white border border-gray-200"
            } p-4`}
         >
            <div className="relative flex-grow">
               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon
                     className={`h-5 w-5 ${
                        darkMode ? "text-white/50" : "text-gray-400"
                     }`}
                     aria-hidden="true"
                  />
               </div>
               <input
                  type="text"
                  name="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`block w-full rounded-md border-0 py-1.5 pl-10 pr-3 ${
                     darkMode
                        ? "bg-white/10 text-white placeholder:text-white/50"
                        : "bg-gray-50 text-gray-900 placeholder:text-gray-500 border border-gray-300"
                  } focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm sm:leading-6`}
                  placeholder="Search customers..."
               />
            </div>
         </div>

         <div
            className={`rounded-lg overflow-hidden shadow-sm ${
               darkMode ? "glass" : "bg-white border border-gray-200"
            }`}
         >
            {loading ? (
               <div className="p-8 text-center">
                  <div
                     className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                     role="status"
                  >
                     <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Loading...
                     </span>
                  </div>
                  <p
                     className={`mt-2 text-sm ${
                        darkMode ? "text-white/70" : "text-gray-500"
                     }`}
                  >
                     Loading customers...
                  </p>
               </div>
            ) : filteredCustomers.length > 0 ? (
               <ul
                  role="list"
                  className={`divide-y ${
                     darkMode ? "divide-white/10" : "divide-gray-200"
                  }`}
               >
                  {filteredCustomers.map((customer) => (
                     <li
                        key={customer._id}
                        className={`px-4 py-4 transition-colors ${
                           darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                        }`}
                     >
                        <div className="flex items-center justify-between">
                           <div className="flex items-center">
                              <div className="flex-shrink-0">
                                 <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                       darkMode ? "bg-gray-700" : "bg-gray-200"
                                    }`}
                                 >
                                    <span
                                       className={`font-medium ${
                                          darkMode
                                             ? "text-white"
                                             : "text-gray-900"
                                       }`}
                                    >
                                       {(customer.firstName &&
                                          customer.firstName.charAt(0)) ||
                                          "C"}
                                    </span>
                                 </div>
                              </div>
                              <div className="ml-4">
                                 <div
                                    className={`text-sm font-medium ${
                                       darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                 >
                                    {customer.firstName || "Unknown"}{" "}
                                    {customer.lastName || ""}
                                 </div>
                                 <div
                                    className={`text-sm ${
                                       darkMode
                                          ? "text-gray-300"
                                          : "text-gray-500"
                                    }`}
                                 >
                                    {customer.email}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center space-x-4">
                              <div
                                 className={`text-sm ${
                                    darkMode ? "text-gray-300" : "text-gray-500"
                                 }`}
                              >
                                 <div>{customer.phone}</div>
                                 <div>
                                    {customer.createdAt
                                       ? `Added: ${new Date(
                                            customer.createdAt
                                         ).toLocaleDateString()}`
                                       : ""}
                                 </div>
                              </div>
                              <button
                                 onClick={() => handleEditClick(customer._id)}
                                 className={`transition-colors px-3 py-1 rounded ${
                                    darkMode
                                       ? "text-gray-300 hover:text-white hover:bg-white/5"
                                       : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                 }`}
                              >
                                 Edit
                              </button>
                              <button
                                 onClick={() => handleDeleteClick(customer._id)}
                                 className={`transition-colors px-3 py-1 rounded ${
                                    darkMode
                                       ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                       : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                 }`}
                              >
                                 Delete
                              </button>
                           </div>
                        </div>
                     </li>
                  ))}
               </ul>
            ) : (
               <div
                  className={`p-8 text-center ${
                     darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
               >
                  {searchTerm
                     ? "No customers match your search"
                     : "No customers found. Add your first customer!"}
               </div>
            )}
         </div>

         <div className="flex justify-center">
            <button
               onClick={handleRefresh}
               className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all ${
                  darkMode
                     ? "bg-purple-600 text-white hover:bg-purple-700"
                     : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
               }`}
            >
               Refresh Customer List
            </button>
         </div>
      </div>
   );
}
