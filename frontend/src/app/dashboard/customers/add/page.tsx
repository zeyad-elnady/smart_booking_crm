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

      // Add click outside listener for dropdown
      function handleClickOutside(event: MouseEvent) {
         const dropdown = document.getElementById("country-dropdown");
         if (dropdown && !dropdown.contains(event.target as Node)) {
            setDropdownOpen(false);
         }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
         document.removeEventListener("mousedown", handleClickOutside);
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

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { customerAPI } from '@/services/api'
import { useRouter } from 'next/navigation'

export default function AddCustomer() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '',
    phoneNumber: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCountryCodeSelect = (code: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      phoneCountryCode: code
    }))
    setDropdownOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('') // Clear previous errors
    
    try {
      // Combine the phone parts
      const completePhone = formData.phoneCountryCode + formData.phoneNumber

      // Prepare the data with the complete phone
      const customerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: completePhone,
        notes: formData.notes
      }
      
      console.log('Submitting customer data:', customerData)
      // Save the customer data using the API
      const result = await customerAPI.createCustomer(customerData)
      console.log('Customer created successfully:', result)
      
      // Force refresh dashboard stats before redirecting
      try {
        // Get current customer count
        const storedMockCustomers = localStorage.getItem('mockCustomers');
        if (storedMockCustomers) {
          const customers = JSON.parse(storedMockCustomers);
          
          // Update dashboard stats
          const storedMockStats = localStorage.getItem('mockDashboardStats');
          if (storedMockStats) {
            const stats = JSON.parse(storedMockStats);
            stats.totalCustomers = customers.length;
            localStorage.setItem('mockDashboardStats', JSON.stringify(stats));
            console.log('Updated dashboard stats before redirect:', stats);
          }
        }
      } catch (e) {
        console.error('Error updating dashboard stats:', e);
      }
      
      // Set a flag to force refresh on dashboard
      localStorage.setItem('forceRefreshDashboard', 'true');
      
      // Set flag to refresh customer list
      localStorage.setItem('customerListShouldRefresh', 'true');
      
      // Redirect to the customers list
      router.push('/dashboard/customers')
    } catch (err: any) {
      console.error('Error creating customer:', err)
      
      // Display more specific error messages based on the error type
      if (err.response?.data?.message) {
        // API returned an error message
        setError(`Server error: ${err.response.data.message}`)
      } else if (err.message) {
        // Network or other error with message
        setError(err.message)
      } else {
        // Fallback error message
        setError('Failed to create customer. Please try again later.')
      }
      
      setLoading(false)
    }
  }

  // Popular country codes
  const countryCodes = [
    { code: '', label: 'Select Code' },
    { code: '+1', label: 'United States (+1)' },
    { code: '+20', label: 'Egypt (+20)' },
    { code: '+44', label: 'United Kingdom (+44)' },
    { code: '+49', label: 'Germany (+49)' },
    { code: '+33', label: 'France (+33)' },
    { code: '+966', label: 'Saudi Arabia (+966)' },
    { code: '+971', label: 'UAE (+971)' },
    { code: '+91', label: 'India (+91)' },
    { code: '+86', label: 'China (+86)' },
    { code: '+81', label: 'Japan (+81)' },
    { code: '+61', label: 'Australia (+61)' },
  ]

  // Get the selected country label
  const selectedCountryLabel = formData.phoneCountryCode 
    ? countryCodes.find(c => c.code === formData.phoneCountryCode)?.label 
    : 'Select Code';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 p-0 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Main content */}
      <div className="p-6">
        <button 
          onClick={() => router.push('/dashboard/customers')}
          className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          <span>Back to customers</span>
        </button>
      
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8 max-w-7xl mx-auto">
          {/* Left side - Info panel */}
          <div className="hidden lg:block">
            <div className="sticky top-6 bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Add a New Customer</h2>
              <p className="text-gray-300 mb-6">Create a new customer profile by filling out their details in the form.</p>
              
              <div className="space-y-6">
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h3 className="text-white font-medium">Personal Information</h3>
                  <p className="text-gray-400 text-sm">Basic details like name, email, and phone number.</p>
                </div>
                
                <div className="border-l-2 border-purple-500 pl-4">
                  <h3 className="text-white font-medium">Contact Details</h3>
                  <p className="text-gray-400 text-sm">How to reach your customer for appointments and updates.</p>
                </div>
                
                <div className="border-l-2 border-pink-500 pl-4">
                  <h3 className="text-white font-medium">Additional Notes</h3>
                  <p className="text-gray-400 text-sm">Special preferences, health concerns, or other important details.</p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-gray-300">Tip: Complete customer profiles help you provide more personalized service and improve customer satisfaction.</p>
        </div>
        </div>
      </div>
          
          {/* Right side - Form */}
          <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Add New Customer
            </h1>

      {error && (
              <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg">
                <p className="text-red-400">{error}</p>
        </div>
      )}

            <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                  <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-300">
                    First Name <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="First name"
              />
            </div>

            <div>
                  <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-300">
                    Last Name <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Last name"
              />
            </div>

            <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-300">
                    Email Address <span className="text-pink-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="example@email.com"
              />
            </div>

            <div>
                  <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-300">
                    Phone Number <span className="text-pink-500">*</span>
              </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        disabled={loading}
                        className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-gray-900 px-3 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <span className="truncate">
                          {formData.phoneCountryCode || 'Select Code'}
                        </span>
                        <ChevronDownIcon className="h-4 w-4 ml-2" />
                      </button>
                      
                      {dropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md bg-gray-800 border border-white/10 shadow-lg max-h-60 overflow-auto">
                          <ul className="py-1">
                            {countryCodes.map((country) => (
                              <li
                                key={country.code}
                                className="px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleCountryCodeSelect(country.code, country.label)}
                              >
                                {country.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
              <input
                        type="text"
                        name="phoneNumber"
                        id="phoneNumber"
                        value={formData.phoneNumber}
                onChange={handleChange}
                        required
                disabled={loading}
                        className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="123-456-7890"
              />
                    </div>
                  </div>
            </div>
          </div>

          <div>
                <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-300">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
                  className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Any additional information about the customer..."
            />
          </div>

              <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-800/80 backdrop-blur-sm hover:bg-purple-900/90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-600/20 text-white"
            >
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
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
  )
} 