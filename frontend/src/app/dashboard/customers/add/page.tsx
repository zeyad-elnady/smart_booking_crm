"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { User } from "lucide-react";
import { Mail } from "lucide-react";
import { Phone } from "lucide-react";
import { MapPin } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { customerAPI } from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";

export default function AddCustomer() {
   const router = useRouter();
   const { darkMode } = useTheme();

   // Form state
   const [firstName, setFirstName] = useState("");
   const [lastName, setLastName] = useState("");
   const [email, setEmail] = useState("");
   const [phone, setPhone] = useState("");
   const [address, setAddress] = useState("");
   const [notes, setNotes] = useState("");

   // Loading state
   const [isLoading, setIsLoading] = useState(false);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) return null;

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
         // Only use the phone number without country code
         await customerAPI.createCustomer({
            firstName,
            lastName,
            email,
            phone,
            address,
            notes,
         });

         toast.success("Customer added successfully");
         router.push("/dashboard/customers");
      } catch (error) {
         console.error("Error adding customer:", error);
         toast.error("Failed to add customer");
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="p-6 w-full">
         <div className="mb-6 flex items-center">
            <button
               onClick={() => router.back()}
               className={`mr-4 rounded-full p-2 transition ${
                  darkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
               }`}
            >
               <ArrowLeft
                  className={`h-6 w-6 ${
                     darkMode ? "text-white" : "text-gray-800"
                  }`}
               />
            </button>
            <h1
               className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Add Customer
            </h1>
         </div>

         <div className="flex">
            <div
               className={`w-full rounded-xl backdrop-blur-md border p-6 ${
                  darkMode
                     ? "border-white/10 bg-gray-800/30"
                     : "border-gray-200 bg-white shadow-sm"
               }`}
            >
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     {/* First Name */}
                     <div>
                        <label
                           className={`block mb-2 text-sm font-medium ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                           }`}
                        >
                           First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                           type="text"
                           value={firstName}
                           onChange={(e) => setFirstName(e.target.value)}
                           required
                           className={`w-full px-4 py-2 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="John"
                        />
                     </div>

                     {/* Last Name */}
                     <div>
                        <label
                           className={`block mb-2 text-sm font-medium ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                           }`}
                        >
                           Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                           type="text"
                           value={lastName}
                           onChange={(e) => setLastName(e.target.value)}
                           required
                           className={`w-full px-4 py-2 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="Doe"
                        />
                     </div>
                  </div>

                  {/* Email */}
                  <div className="mb-6">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Email <span className="text-red-500">*</span>
                     </label>
                     <div className="relative">
                        <input
                           type="email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                           className={`w-full px-4 py-2 pl-10 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="johndoe@example.com"
                        />
                        <Mail
                           className={`absolute left-3 top-2.5 w-5 h-5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                           }`}
                        />
                     </div>
                  </div>

                  {/* Phone */}
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Phone Number <span className="text-red-500">*</span>
                     </label>
                     <div className="relative">
                        <input
                           type="tel"
                           value={phone}
                           onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, ""))
                           }
                           required
                           className={`w-full px-4 py-2 pl-10 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="(555) 555-5555"
                        />
                        <Phone
                           className={`absolute left-3 top-2.5 w-5 h-5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                           }`}
                        />
                     </div>
                  </div>

                  {/* Address */}
                  <div className="mb-6">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Address
                     </label>
                     <div className="relative">
                        <input
                           type="text"
                           value={address}
                           onChange={(e) => setAddress(e.target.value)}
                           className={`w-full px-4 py-2 pl-10 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="123 Main St, City, State"
                        />
                        <MapPin
                           className={`absolute left-3 top-2.5 w-5 h-5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                           }`}
                        />
                     </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Notes
                     </label>
                     <div className="relative">
                        <textarea
                           value={notes}
                           onChange={(e) => setNotes(e.target.value)}
                           rows={4}
                           className={`w-full px-4 py-2 pl-10 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="Additional information about the customer..."
                        />
                        <ClipboardList
                           className={`absolute left-3 top-2.5 w-5 h-5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                           }`}
                        />
                     </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                     <button
                        type="button"
                        onClick={() => router.back()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                           darkMode
                              ? "text-gray-300 hover:bg-white/10"
                              : "text-gray-600 hover:bg-gray-100"
                        }`}
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                           darkMode
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : "bg-purple-600 text-white hover:bg-purple-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                     >
                        {isLoading ? "Adding..." : "Add Customer"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}
