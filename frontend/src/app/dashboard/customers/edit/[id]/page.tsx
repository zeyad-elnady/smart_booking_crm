"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { fetchCustomerById, updateCustomer } from "@/services/customerService";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import MedicalInfoSection from "@/components/MedicalInfoSection";
import { MedicalCondition, Allergy, CustomField } from "@/types/customer";

type Props = {
   params: {
      id: string;
   };
   searchParams: { [key: string]: string | string[] | undefined };
};

export default function EditCustomer({ params, searchParams }: Props) {
   const router = useRouter();
   const { id } = params;
   const { t } = useLanguage();

   const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+20", // Default Egypt country code
      phoneNumber: "",
      notes: "",
      
      // Medical information
      age: "",
      medicalConditions: [] as MedicalCondition[],
      allergies: [] as Allergy[],
      medicalNotes: "",
      customFields: [] as CustomField[],
   });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [submitLoading, setSubmitLoading] = useState(false);
   // Set to true if the user has admin role
   const [isAdmin, setIsAdmin] = useState(true);

   // Fetch customer data on load
   useEffect(() => {
      async function fetchCustomerData() {
         try {
            setLoading(true);
            console.log(`Fetching customer data for ID: ${id}`);
            
            // Get customer directly from database
            const customer = await fetchCustomerById(id);
            console.log("Raw customer data received:", JSON.stringify(customer, null, 2));

            if (customer) {
               // Explicitly log each field for debugging
               console.log("First Name:", customer.firstName);
               console.log("Last Name:", customer.lastName);
               console.log("Email:", customer.email);
               console.log("Phone:", customer.phone);
               console.log("Notes:", customer.notes);

               // Extract country code from phone number or use default
               let countryCode = "+20";
               let phoneNumber = customer.phone || "";
               
               // If phone starts with +, extract the country code
               if (phoneNumber.startsWith('+')) {
                  const parts = phoneNumber.split(' ');
                  if (parts.length > 1) {
                     countryCode = parts[0];
                     phoneNumber = parts.slice(1).join('');
                  }
               }

               setFormData({
                  firstName: customer.firstName || "",
                  lastName: customer.lastName || "",
                  email: customer.email || "",
                  countryCode,
                  phoneNumber,
                  notes: customer.notes || "",
                  
                  // Medical information
                  age: customer.age?.toString() || "",
                  medicalConditions: customer.medicalConditions || [],
                  allergies: customer.allergies || [],
                  medicalNotes: customer.medicalNotes || "",
                  customFields: customer.customFields || [],
               });
               
               console.log("Form data set:", {
                  firstName: customer.firstName || "",
                  lastName: customer.lastName || "",
                  email: customer.email || "",
                  countryCode,
                  phoneNumber,
                  notes: customer.notes || "",
                  
                  // Medical information
                  age: customer.age?.toString() || "",
                  medicalConditions: customer.medicalConditions || [],
                  allergies: customer.allergies || [],
                  medicalNotes: customer.medicalNotes || "",
                  customFields: customer.customFields || [],
               });
            } else {
               setError("Customer not found. Please try again or go back to the customer list.");
            }
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
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
   
   // Handle medical info changes
   const handleMedicalInfoChange = (field: string, value: any) => {
      setFormData((prev) => ({
         ...prev,
         [field]: value,
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
            phone: `${formData.countryCode} ${formData.phoneNumber}`,
            notes: formData.notes,
            
            // Add medical information
            age: formData.age ? parseInt(formData.age as string) : undefined,
            medicalConditions: formData.medicalConditions.length > 0 ? formData.medicalConditions : undefined,
            allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
            medicalNotes: formData.medicalNotes || undefined,
            customFields: formData.customFields.length > 0 ? formData.customFields : undefined,
         };

         console.log(`Submitting update for customer ID ${id}:`, customerData);

         // Update the customer data using the customer service
         const result = await updateCustomer(id, customerData);
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

   const handleCancel = () => {
      router.push("/dashboard/customers");
   };

   return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-100/30 to-gray-50 dark:from-gray-900 dark:via-purple-900/30 dark:to-gray-900 p-0 relative">
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>

         {/* Main content */}
         <div className="p-4 md:p-6 h-full">
            <button
               onClick={() => router.push("/dashboard/customers")}
               className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
            >
               <ArrowLeftIcon className="h-4 w-4 mr-2" />
               <span>{t('back')}</span>
            </button>

            {/* Form container taking full width */}
            <div className="form-container bg-white/90 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-2xl w-full">
               <div className="flex flex-col md:flex-row md:items-center gap-2 mb-8">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                     {t('edit')} {t('customer')}
                  </h1>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm border border-purple-200 dark:border-purple-700/50">
                     ID: {id}
                  </span>
               </div>

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
                     </div>
                     <p className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('loading')}...
                     </p>
                  </div>
               ) : (
                  <form onSubmit={handleSubmit} className="space-y-8 w-full">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div>
                           <label
                              htmlFor="firstName"
                              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                           >
                              First Name
                           </label>
                           <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="Enter first name"
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="lastName"
                              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                           >
                              Last Name
                           </label>
                           <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="Enter last name"
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="email"
                              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                           >
                              Email
                           </label>
                           <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="Enter email address"
                           />
                        </div>

                        <div className="flex space-x-3">
                           <div className="w-1/3">
                              <label
                                 htmlFor="countryCode"
                                 className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                 Country Code
                              </label>
                              <select
                                 id="countryCode"
                                 name="countryCode"
                                 value={formData.countryCode}
                                 onChange={handleChange}
                                 className="w-full px-2 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white h-10 appearance-none bg-no-repeat bg-right pr-6 text-sm"
                                 style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E\")", backgroundSize: "1rem", backgroundPosition: "right 0.5rem center" }}
                              >
                                 <option value="+20">Egypt (+20)</option>
                                 <option value="+1">USA (+1)</option>
                                 <option value="+44">UK (+44)</option>
                                 <option value="+971">UAE (+971)</option>
                                 <option value="+966">KSA (+966)</option>
                                 <option value="+49">DE (+49)</option>
                                 <option value="+33">FR (+33)</option>
                              </select>
                           </div>
                           <div className="w-2/3">
                              <label
                                 htmlFor="phoneNumber"
                                 className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                 Phone Number
                              </label>
                              <input
                                 type="tel"
                                 id="phoneNumber"
                                 name="phoneNumber"
                                 value={formData.phoneNumber}
                                 onChange={handleChange}
                                 className="w-full px-4 py-2 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 h-10"
                                 placeholder="Enter phone number (digits only)"
                              />
                           </div>
                        </div>

                        {/* Add Medical Information Section */}
                        <div className="md:col-span-2">
                           <MedicalInfoSection
                              age={formData.age ? parseInt(formData.age as string) : undefined}
                              medicalConditions={formData.medicalConditions}
                              allergies={formData.allergies}
                              medicalNotes={formData.medicalNotes}
                              customFields={formData.customFields}
                              isAdmin={isAdmin}
                              onChange={handleMedicalInfoChange}
                           />
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row gap-4 justify-end">
                        <button
                           type="button"
                           onClick={handleCancel}
                           className="px-6 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                           {t('cancel')}
                        </button>
                        <button
                           type="submit"
                           disabled={submitLoading}
                           className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                           {submitLoading ? (
                              <>
                                 <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                 >
                                    <circle
                                       className="opacity-25"
                                       cx="12"
                                       cy="12"
                                       r="10"
                                       stroke="currentColor"
                                       strokeWidth="4"
                                    ></circle>
                                    <path
                                       className="opacity-75"
                                       fill="currentColor"
                                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                 </svg>
                                 {t('saving')}...
                              </>
                           ) : (
                              t('save')
                           )}
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
               background: rgba(243, 244, 246, 0.5);
            }

            .dark ::-webkit-scrollbar-track {
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
