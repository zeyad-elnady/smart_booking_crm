"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, ClipboardList, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { createCustomer } from "@/services/customerService";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import MedicalInfoSection from "@/components/MedicalInfoSection";
import { MedicalCondition, Allergy, CustomField } from "@/types/customer";

export default function AddCustomer() {
   const router = useRouter();
   const { darkMode } = useTheme();
   const { t } = useLanguage();

   // Form state
   const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+20", // Default Egypt country code
      phoneNumber: "",
      address: "",
      notes: "",
      
      // Medical information
      age: "",
      medicalConditions: [] as MedicalCondition[],
      allergies: [] as Allergy[],
      medicalNotes: "",
      customFields: [] as CustomField[],
   });
   const [isLoading, setIsLoading] = useState(false);
   const [mounted, setMounted] = useState(false);
   // Set to true if the user has admin role
   const [isAdmin, setIsAdmin] = useState(true);

   useEffect(() => {
      setMounted(true);
      // Here you would check if the user has admin role
      // Example: setIsAdmin(user.role === 'admin');
   }, []);

   if (!mounted) return null;

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

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
         // Create full phone number with country code
         await createCustomer({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: `${formData.countryCode} ${formData.phoneNumber}`,
            address: formData.address,
            notes: formData.notes,
            
            // Add medical information
            age: formData.age ? parseInt(formData.age as string) : undefined,
            medicalConditions: formData.medicalConditions.length > 0 ? formData.medicalConditions : undefined,
            allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
            medicalNotes: formData.medicalNotes || undefined,
            customFields: formData.customFields.length > 0 ? formData.customFields : undefined,
         });

         toast.success("Customer added successfully");
         router.push("/dashboard/customers");
      } catch (error) {
         console.error("Error adding customer:", error);
         // Show the specific error message instead of a generic one
         if (error instanceof Error) {
            toast.error(error.message);
         } else {
            toast.error("Failed to add customer");
         }
      } finally {
         setIsLoading(false);
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
               <ArrowLeft className="h-4 w-4 mr-2" />
               <span>{t('back')}</span>
            </button>

            {/* Form container taking full width */}
            <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl w-full">
               <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t('add_customer')}
               </h1>

               <form onSubmit={handleSubmit} className="space-y-8 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                     <div>
                        <label
                           htmlFor="firstName"
                           className="block mb-2 text-sm font-medium text-gray-300"
                        >
                           {t('first_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                           type="text"
                           id="firstName"
                           name="firstName"
                           value={formData.firstName}
                           onChange={handleChange}
                           required
                           className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                           placeholder={t('enter_first_name')}
                        />
                     </div>

                     <div>
                        <label
                           htmlFor="lastName"
                           className="block mb-2 text-sm font-medium text-gray-300"
                        >
                           Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                           type="text"
                           id="lastName"
                           name="lastName"
                           value={formData.lastName}
                           onChange={handleChange}
                           required
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
                        <div className="relative">
                           <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                           <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Enter email address (optional)"
                           />
                        </div>
                     </div>

                     <div className="flex space-x-3">
                        <div className="w-1/3">
                           <label
                              htmlFor="countryCode"
                              className="block mb-2 text-sm font-medium text-gray-300"
                           >
                              Country Code <span className="text-red-500">*</span>
                           </label>
                           <select
                              id="countryCode"
                              name="countryCode"
                              value={formData.countryCode}
                              onChange={handleChange}
                              className="w-full px-2 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white h-10 appearance-none bg-no-repeat bg-right pr-6 text-sm"
                              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E\")", backgroundSize: "1rem", backgroundPosition: "right 0.5rem center" }}
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
                              className="block mb-2 text-sm font-medium text-gray-300"
                           >
                              Phone Number <span className="text-red-500">*</span>
                           </label>
                           <div className="relative">
                              <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                              <input
                                 type="tel"
                                 id="phoneNumber"
                                 name="phoneNumber"
                                 value={formData.phoneNumber}
                                 onChange={handleChange}
                                 required
                                 className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 h-10"
                                 placeholder="Enter phone number (digits only)"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div>
                     <label
                        htmlFor="address"
                        className="block mb-2 text-sm font-medium text-gray-300"
                     >
                        Address
                     </label>
                     <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                           type="text"
                           id="address"
                           name="address"
                           value={formData.address}
                           onChange={handleChange}
                           className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                           placeholder="Enter address (optional)"
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
                     <div className="relative">
                        <ClipboardList className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <textarea
                           id="notes"
                           name="notes"
                           rows={4}
                           value={formData.notes}
                           onChange={handleChange}
                           className="w-full px-4 py-2 pl-10 rounded-lg border border-white/10 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                           placeholder="Any additional information about the customer..."
                        />
                     </div>
                  </div>

                  {/* Add Medical Information Section */}
                  <MedicalInfoSection
                     age={formData.age ? parseInt(formData.age as string) : undefined}
                     medicalConditions={formData.medicalConditions}
                     allergies={formData.allergies}
                     medicalNotes={formData.medicalNotes}
                     customFields={formData.customFields}
                     isAdmin={isAdmin}
                     onChange={handleMedicalInfoChange}
                  />

                  <div className="flex justify-end space-x-3">
                     <button
                        type="button"
                        onClick={() => router.push("/dashboard/customers")}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                     >
                        {t('cancel')}
                     </button>
                     <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                        {isLoading ? (
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
