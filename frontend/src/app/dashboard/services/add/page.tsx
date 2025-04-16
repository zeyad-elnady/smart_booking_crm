"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Clock } from "lucide-react";
import { DollarSign } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { Palette } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { serviceAPI, ServiceData } from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";

interface AvailableDays {
   monday: boolean;
   tuesday: boolean;
   wednesday: boolean;
   thursday: boolean;
   friday: boolean;
   saturday: boolean;
   sunday: boolean;
}

type DayKey = keyof AvailableDays;

export default function AddService() {
   const router = useRouter();
   const { darkMode } = useTheme();

   // Form state
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [duration, setDuration] = useState("");
   const [price, setPrice] = useState("");
   const [color, setColor] = useState("#6d28d9"); // Default purple
   const [availableDays, setAvailableDays] = useState<AvailableDays>({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
   });

   // Loading state
   const [isLoading, setIsLoading] = useState(false);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) return null;

   const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow numbers
      const value = e.target.value.replace(/[^\d]/g, "");
      setDuration(value);
   };

   const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow numbers and a single decimal point
      const value = e.target.value.replace(/[^\d.]/g, "");
      // Prevent multiple decimal points
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount <= 1) {
         setPrice(value);
      }
   };

   const handleAvailableDaysChange = (day: DayKey) => {
      setAvailableDays((prev) => ({
         ...prev,
         [day]: !prev[day],
      }));
   };

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
         const serviceData: ServiceData = {
            name,
            description,
            duration: duration,
            price: price,
            category: "", // Add a category field if needed
            isActive: true,
         };

         await serviceAPI.createService(serviceData);
         toast.success("Service added successfully");
         router.push("/dashboard/services");
      } catch (error) {
         console.error("Error adding service:", error);
         toast.error("Failed to add service");
      } finally {
         setIsLoading(false);
      }
   };

   const days: Array<{ id: DayKey; label: string }> = [
      { id: "monday", label: "Monday" },
      { id: "tuesday", label: "Tuesday" },
      { id: "wednesday", label: "Wednesday" },
      { id: "thursday", label: "Thursday" },
      { id: "friday", label: "Friday" },
      { id: "saturday", label: "Saturday" },
      { id: "sunday", label: "Sunday" },
   ];

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
               Add Service
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
                  {/* Service Name */}
                  <div className="mb-6">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Service Name <span className="text-red-500">*</span>
                     </label>
                     <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={`w-full px-4 py-2 rounded-lg ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                              : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                        } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                        placeholder="e.g. Haircut & Styling"
                     />
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Description <span className="text-red-500">*</span>
                     </label>
                     <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={3}
                        className={`w-full px-4 py-2 rounded-lg ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                              : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                        } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                        placeholder="Describe what this service includes..."
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     {/* Duration */}
                     <div>
                        <label
                           className={`block mb-2 text-sm font-medium ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                           }`}
                        >
                           Duration (minutes){" "}
                           <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                           <input
                              type="text"
                              value={duration}
                              onChange={handleDurationChange}
                              required
                              className={`w-full px-4 py-2 pl-10 rounded-lg ${
                                 darkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                              } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                              placeholder="30"
                           />
                           <Clock
                              className={`absolute left-3 top-2.5 w-5 h-5 ${
                                 darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                           />
                        </div>
                     </div>

                     {/* Price */}
                     <div>
                        <label
                           className={`block mb-2 text-sm font-medium ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                           }`}
                        >
                           Price ($) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                           <input
                              type="text"
                              value={price}
                              onChange={handlePriceChange}
                              required
                              className={`w-full px-4 py-2 pl-10 rounded-lg ${
                                 darkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                              } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                              placeholder="49.99"
                           />
                           <DollarSign
                              className={`absolute left-3 top-2.5 w-5 h-5 ${
                                 darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                           />
                        </div>
                     </div>
                  </div>

                  {/* Color */}
                  <div className="mb-6">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Color <span className="text-red-500">*</span>
                     </label>
                     <div className="flex items-center gap-4">
                        <input
                           type="color"
                           value={color}
                           onChange={(e) => setColor(e.target.value)}
                           className="w-12 h-12 rounded-lg cursor-pointer"
                        />
                        <span
                           className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                           }`}
                        >
                           Choose a color for this service in the calendar
                        </span>
                     </div>
                  </div>

                  {/* Available Days */}
                  <div className="mb-8">
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Available Days <span className="text-red-500">*</span>
                     </label>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {days.map((day) => (
                           <div
                              key={day.id}
                              onClick={() =>
                                 handleAvailableDaysChange(day.id as DayKey)
                              }
                              className={`cursor-pointer px-4 py-3 rounded-lg border transition-colors ${
                                 availableDays[day.id]
                                    ? darkMode
                                       ? "bg-purple-600/30 border-purple-500 text-white"
                                       : "bg-purple-100 border-purple-500 text-purple-900"
                                    : darkMode
                                    ? "bg-gray-800 border-gray-700 text-gray-400"
                                    : "bg-gray-100 border-gray-300 text-gray-500"
                              }`}
                           >
                              {day.label}
                           </div>
                        ))}
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
                     {isLoading ? "Adding..." : "Add Service"}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
}

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { serviceAPI, ServiceData } from '@/services/api'
import { FormInput, FormTextarea, FormActions } from '@/components/form'

export default function AddService() {
  const router = useRouter()
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: '',
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize change handlers to prevent recreation on each render
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: checked }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await serviceAPI.createService(formData)
      router.push('/dashboard/services')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create service')
      setLoading(false)
    }
  }, [formData, router])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 p-0 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Main content */}
      <div className="p-6">
        <button 
          onClick={() => router.push('/dashboard/services')}
          className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          <span>Back to services</span>
        </button>
      
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8 max-w-7xl mx-auto">
          {/* Left side - Info panel */}
          <div className="hidden lg:block">
            <div className="sticky top-6 bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Create a New Service</h2>
              <p className="text-gray-300 mb-6">Add a new service to your business offerings by filling out the details on the right.</p>
              
              <div className="space-y-6">
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h3 className="text-white font-medium">Basic Information</h3>
                  <p className="text-gray-400 text-sm">Name and description of the service.</p>
                </div>
                
                <div className="border-l-2 border-purple-500 pl-4">
                  <h3 className="text-white font-medium">Duration & Pricing</h3>
                  <p className="text-gray-400 text-sm">How long the service takes and how much it costs.</p>
                </div>
                
                <div className="border-l-2 border-pink-500 pl-4">
                  <h3 className="text-white font-medium">Categorization</h3>
                  <p className="text-gray-400 text-sm">Organize your services by category for easier management.</p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-gray-300">Tip: Services can be made inactive if you need to temporarily hide them from your booking system.</p>
              </div>
            </div>
      </div>
          
          {/* Right side - Form */}
          <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Add New Service
            </h1>

      {error && (
              <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg">
                <p className="text-red-400">{error}</p>
        </div>
      )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">
                    Service Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
            id="name" 
            value={formData.name} 
            onChange={handleTextChange} 
                    required
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Haircut, Massage, Manicure"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-300">
                    Description <span className="text-pink-500">*</span>
                  </label>
                  <textarea
            id="description"
            value={formData.description}
            onChange={handleTextChange}
                    required
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Describe what this service includes..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="duration" className="block mb-2 text-sm font-medium text-gray-300">
                      Duration (minutes) <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
              id="duration"
              value={formData.duration}
              onChange={handleTextChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 30, 60, 90"
                    />
                  </div>

                  <div>
                    <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-300">
                      Price <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
              id="price"
              value={formData.price}
              onChange={handleTextChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 50, 75, 100"
            />
                  </div>
          </div>

                <div>
                  <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-300">
                    Category <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
            id="category"
            value={formData.category}
            onChange={handleTextChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g. Hair, Nails, Spa"
          />
                </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-white/10 bg-gray-900 text-indigo-600 focus:ring-indigo-500/20"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
                    Active (available for booking)
            </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-800/80 backdrop-blur-sm hover:bg-purple-900/90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-600/20 text-white"
                >
                  {loading ? 'Creating...' : 'Create Service'}
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