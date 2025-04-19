"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { customerAPI } from "@/services/api";
import React from "react";

interface PageParams {
   params: {
      id: string;
   };
}

export default function EditCustomer({ params }: PageParams) {
   const router = useRouter();
   const id = params.id;

   const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      notes: "",
   });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [submitLoading, setSubmitLoading] = useState(false);

   // Fetch customer data on load
   useEffect(() => {
      async function fetchCustomerData() {
         try {
            setLoading(true);
            const customer = await customerAPI.getCustomerById(id);
            console.log("Fetched customer:", customer);

            setFormData({
               firstName: customer.firstName || "",
               lastName: customer.lastName || "",
               email: customer.email || "",
               phoneNumber: customer.phone || "",
               notes: customer.notes || "",
            });
         } catch (error) {
            console.error("Error fetching customer:", error);
            setError("Failed to load customer data. Please try again.");
         } finally {
            setLoading(false);
         }
      }

      fetchCustomerData();
   }, [id]);

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
   ) => {
      const { name, value } = e.target;

      // For phone number, only allow digits
      if (name === "phoneNumber") {
         const digitsOnly = value.replace(/\D/g, "");
         setFormData((prev) => ({
            ...prev,
            [name]: digitsOnly,
         }));
         return;
      }

      setFormData((prev) => ({
         ...prev,
         [name]: value,
      }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitLoading(true);
      setError(""); // Clear previous errors

      try {
         const customerData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phoneNumber,
            notes: formData.notes,
         };

         console.log("Updating customer data:", customerData);

         // Update the customer data using the API
         const result = await customerAPI.updateCustomer(id, customerData);
         console.log("Customer updated successfully:", result);

         // Set a flag to force refresh on dashboard
         localStorage.setItem("forceRefreshDashboard", "true");

         // Set flag to refresh customer list
         localStorage.setItem("customerListShouldRefresh", "true");

         // Redirect to the customers list
         router.push("/dashboard/customers");
      } catch (err: any) {
         console.error("Error updating customer:", err);

         // Display more specific error messages based on the error type
         if (err.response?.data?.message) {
            // API returned an error message
            setError(`Server error: ${err.response.data.message}`);
         } else if (err.message) {
            // Network or other error with message
            setError(err.message);
         } else {
            // Fallback error message
            setError("Failed to update customer. Please try again later.");
         }
      } finally {
         setSubmitLoading(false);
      }
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 p-0 relative">
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>

         {/* Main content */}
         <div className="p-4 md:p-6 h-full">
            <button
               onClick={() => router.push("/dashboard/customers")}
               className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
            >
               <ArrowLeftIcon className="h-4 w-4 mr-2" />
               <span>Back to customers</span>
            </button>

            {/* Form container taking full width */}
            <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl w-full">
               <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Edit Customer
               </h1>

               {error && (
                  <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg">
                     <p className="text-red-400">{error}</p>
                  </div>
               )}

               {loading ? (
                  <div className="flex justify-center items-center h-64">
                     <div
                        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                     >
                        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                           Loading...
                        </span>
                     </div>
                     <p className="ml-3 text-sm text-white/70">
                        Loading customer data...
                     </p>
                  </div>
               ) : (
                  <form onSubmit={handleSubmit} className="space-y-8 w-full">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div>
                           <label
                              htmlFor="firstName"
                              className="block mb-2 text-sm font-medium text-gray-300"
                           >
                              First Name
                           </label>
                           <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Enter first name"
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="lastName"
                              className="block mb-2 text-sm font-medium text-gray-300"
                           >
                              Last Name
                           </label>
                           <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Enter last name"
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="email"
                              className="block mb-2 text-sm font-medium text-gray-300"
                           >
                              Email
                           </label>
                           <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Enter email address"
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="phoneNumber"
                              className="block mb-2 text-sm font-medium text-gray-300"
                           >
                              Phone Number
                           </label>
                           <input
                              type="tel"
                              id="phoneNumber"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Enter phone number (digits only)"
                           />
                        </div>
                     </div>

                     <div>
                        <label
                           htmlFor="notes"
                           className="block mb-2 text-sm font-medium text-gray-300"
                        >
                           Notes
                        </label>
                        <textarea
                           id="notes"
                           name="notes"
                           rows={4}
                           value={formData.notes}
                           onChange={handleChange}
                           className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                           placeholder="Any additional information about the customer..."
                        />
                     </div>

                     <div className="pt-4">
                        <button
                           type="submit"
                           disabled={submitLoading}
                           className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-800/80 backdrop-blur-sm hover:bg-purple-900/90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-600/20 text-white"
                        >
                           {submitLoading ? "Saving..." : "Update Customer"}
                        </button>
                     </div>
                  </form>
               )}
            </div>
         </div>

         <style jsx global>{`
            body {
               overflow-x: hidden;
            }

            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator {
               filter: invert(0.8);
            }

            .form-container {
               transition: all 0.3s ease;
            }

            .form-container:hover {
               box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.2);
            }

            /* Hide scrollbars but allow scrolling if needed */
            ::-webkit-scrollbar {
               width: 6px;
            }

            ::-webkit-scrollbar-track {
               background: rgba(15, 20, 30, 0.5);
            }

            ::-webkit-scrollbar-thumb {
               background: rgba(99, 102, 241, 0.3);
               border-radius: 3px;
            }

            ::-webkit-scrollbar-thumb:hover {
               background: rgba(99, 102, 241, 0.5);
            }

            /* Subtle animation for the form */
            @keyframes fadeIn {
               from {
                  opacity: 0;
                  transform: translateY(10px);
               }
               to {
                  opacity: 1;
                  transform: translateY(0);
               }
            }

            .form-container {
               animation: fadeIn 0.5s ease-out forwards;
            }
         `}</style>
      </div>
   );
}
