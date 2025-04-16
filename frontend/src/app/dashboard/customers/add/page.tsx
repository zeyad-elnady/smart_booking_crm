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
   const [countryCode, setCountryCode] = useState("+1");
   const [phone, setPhone] = useState("");
   const [address, setAddress] = useState("");
   const [notes, setNotes] = useState("");

   // Dropdown state
   const [dropdownOpen, setDropdownOpen] = useState(false);

   // Loading state
   const [isLoading, setIsLoading] = useState(false);
   const [mounted, setMounted] = useState(false);

   const countryCodes = [
      { code: "+1", country: "US/Canada" },
      { code: "+44", country: "UK" },
      { code: "+61", country: "Australia" },
      { code: "+33", country: "France" },
      { code: "+49", country: "Germany" },
      { code: "+81", country: "Japan" },
      { code: "+86", country: "China" },
      { code: "+91", country: "India" },
      { code: "+52", country: "Mexico" },
      { code: "+55", country: "Brazil" },
   ];

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) return null;

   const toggleDropdown = () => {
      setDropdownOpen(!dropdownOpen);
   };

   const selectCountryCode = (code: string) => {
      setCountryCode(code);
      setDropdownOpen(false);
   };

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
         // Combine country code and phone
         const fullPhoneNumber = `${countryCode}${phone}`;

         await customerAPI.createCustomer({
            firstName,
            lastName,
            email,
            phone: fullPhoneNumber,
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
                  <div className="mb-6">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Phone Number <span className="text-red-500">*</span>
                     </label>
                     <div className="flex">
                        {/* Country code dropdown */}
                        <div className="relative">
                           <button
                              type="button"
                              onClick={toggleDropdown}
                              className={`flex items-center justify-center h-10 px-3 rounded-l-lg border transition-colors
                    ${
                       darkMode
                          ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                          : "bg-white border-gray-300 text-gray-900"
                    }`}
                           >
                              {countryCode}
                              <ChevronLeft
                                 className={`w-4 h-4 ml-1 transform rotate-90 ${
                                    darkMode ? "text-gray-400" : "text-gray-500"
                                 }`}
                              />
                           </button>

                           {/* Dropdown menu */}
                           {dropdownOpen && (
                              <div
                                 className={`absolute z-10 mt-1 w-48 overflow-auto border rounded-lg py-1 max-h-60
                    ${
                       darkMode
                          ? "bg-gray-800 border-gray-700 shadow-black/30"
                          : "bg-white border-gray-300 shadow-gray-200/50"
                    }`}
                              >
                                 {countryCodes.map((country) => (
                                    <button
                                       key={country.code}
                                       type="button"
                                       onClick={() =>
                                          selectCountryCode(country.code)
                                       }
                                       className={`block w-full text-left px-4 py-2 transition-colors
                          ${
                             darkMode
                                ? "text-white hover:bg-gray-700"
                                : "text-gray-900 hover:bg-gray-50"
                          }`}
                                    >
                                       {country.code} {country.country}
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* Phone number input */}
                        <input
                           type="tel"
                           value={phone}
                           onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, ""))
                           }
                           required
                           className={`w-full rounded-r-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors px-4 py-2`}
                           placeholder="123-456-7890"
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
                           placeholder="123 Main St, City, State, ZIP"
                        />
                        <MapPin
                           className={`absolute left-3 top-2.5 w-5 h-5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                           }`}
                        />
                     </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-8">
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
                           rows={3}
                           className={`w-full px-4 py-2 pl-10 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="Any additional information about this customer..."
                        />
                        <ClipboardList
                           className={`absolute left-3 top-2.5 w-5 h-5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                           }`}
                        />
                     </div>
                  </div>

                  {/* Submit Button */}
                  <button
                     type="submit"
                     disabled={isLoading}
                     className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                           ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                           : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                     }`}
                  >
                     {isLoading ? "Adding..." : "Add Customer"}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
}
