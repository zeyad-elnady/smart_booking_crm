"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, ClipboardList, Tag } from "lucide-react";
import { toast } from "react-hot-toast";
import { createService, enableServicesFetching } from "@/services/serviceService";
import { useTheme } from "@/components/ThemeProvider";

export default function AddService() {
   const router = useRouter();
   const { darkMode } = useTheme();

   // Form state
   const [formData, setFormData] = useState({
      name: "",
      price: "",
      duration: "",
      description: "",
      category: "General",
      staffCount: "1", // Default to 1 staff member
      isActive: true
   });

   // Loading state
   const [isLoading, setIsLoading] = useState(false);
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) return null;

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
   ) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
   };

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
         // Convert all values to strings and ensure they're not empty
         if (!formData.name.trim()) {
            toast.error("Service name is required");
            setIsLoading(false);
            return;
         }
         if (!formData.price) {
            toast.error("Price is required");
            setIsLoading(false);
            return;
         }
         if (!formData.duration) {
            toast.error("Duration is required");
            setIsLoading(false);
            return;
         }
         if (!formData.staffCount) {
            toast.error("Staff count is required");
            setIsLoading(false);
            return;
         }

         // Parse price as a number and validate
         const numericPrice = Number(formData.price);
         if (isNaN(numericPrice) || numericPrice < 0) {
            toast.error("Price must be a valid non-negative number");
            setIsLoading(false);
            return;
         }
         
         // Parse staff count as a number and validate
         const numericStaffCount = Number(formData.staffCount);
         if (isNaN(numericStaffCount) || numericStaffCount < 1) {
            toast.error("Staff count must be at least 1");
            setIsLoading(false);
            return;
         }

         // Make sure service fetching is enabled
         enableServicesFetching();

         const serviceData = {
            name: formData.name.trim(),
            price: numericPrice,
            duration: formData.duration.toString(),
            description: formData.description.trim(),
            category: formData.category || "General",
            staffCount: numericStaffCount,
            isActive: formData.isActive,
         };

         console.log("Creating service with data:", serviceData);
         // Use the enhanced createService function that properly handles IndexedDB storage
         const response = await createService(serviceData);
         console.log("Service created successfully:", response);

         // Mark the services list for refresh
         localStorage.setItem("serviceListShouldRefresh", "true");
         
         // Navigate back to the services list page
         router.push("/dashboard/services");
      } catch (error: any) {
         console.error("Error adding service:", error);
         toast.error(error.response?.data?.message || "Failed to add service");
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
               onClick={() => router.push("/dashboard/services")}
               className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
            >
               <ArrowLeft className="h-4 w-4 mr-2" />
               <span>Back to services</span>
            </button>

            {/* Form container taking full width */}
            <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl w-full">
               <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Add Service
               </h1>

               <form onSubmit={handleSubmit} className="space-y-8 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                     {/* Service Name */}
                     <div>
                        <label
                           htmlFor="name"
                           className="block mb-2 text-sm font-medium text-gray-300"
                        >
                           Service Name <span className="text-red-500">*</span>
                        </label>
                        <input
                           type="text"
                           id="name"
                           name="name"
                           value={formData.name}
                           onChange={handleChange}
                           required
                           className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                           placeholder="Enter service name"
                        />
                     </div>

                     {/* Duration */}
                     <div>
                        <label
                           htmlFor="duration"
                           className="block mb-2 text-sm font-medium text-gray-300"
                        >
                           Duration (minutes) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                           <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                           <input
                              type="number"
                              id="duration"
                              name="duration"
                              value={formData.duration}
                              onChange={handleChange}
                              required
                              min="1"
                              className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Enter duration in minutes"
                           />
                        </div>
                     </div>

                     {/* Price */}
                     <div>
                        <label
                           htmlFor="price"
                           className="block mb-2 text-sm font-medium text-gray-300"
                        >
                           Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                           <span className="absolute left-3 top-3 text-gray-400 font-medium">EGP</span>
                           <input
                              type="number"
                              id="price"
                              name="price"
                              value={formData.price}
                              onChange={handleChange}
                              required
                              min="0"
                              step="0.01"
                              className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Enter price"
                           />
                        </div>
                     </div>

                     {/* Staff Count */}
                     <div>
                        <label
                           htmlFor="staffCount"
                           className="block mb-2 text-sm font-medium text-gray-300"
                        >
                           Staff Count <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                           <span className="absolute left-3 top-3 text-gray-400 font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                 <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                              </svg>
                           </span>
                           <input
                              type="number"
                              id="staffCount"
                              name="staffCount"
                              value={formData.staffCount}
                              onChange={handleChange}
                              required
                              min="1"
                              className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                              placeholder="Number of staff providing this service"
                           />
                        </div>
                     </div>

                     {/* Active Toggle */}
                     <div className="flex items-center pt-8">
                        <input
                           type="checkbox"
                           id="isActive"
                           name="isActive"
                           checked={formData.isActive}
                           onChange={handleChange}
                           className="h-5 w-5 rounded border-gray-700 bg-gray-800/50 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
                        />
                        <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-300">
                           Active Service
                        </label>
                     </div>
                  </div>

                  {/* Description */}
                  <div>
                     <label
                        htmlFor="description"
                        className="block mb-2 text-sm font-medium text-gray-300"
                     >
                        Description
                     </label>
                     <div className="relative">
                        <ClipboardList className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                           id="description"
                           name="description"
                           value={formData.description}
                           onChange={handleChange}
                           rows={4}
                           className="w-full px-4 py-3 pl-10 rounded-lg border border-white/10 bg-gray-900 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                           placeholder="Describe the service..."
                        />
                     </div>
                  </div>

                  <div className="pt-6 flex space-x-4">
                     <button
                        type="button"
                        onClick={() => router.push("/dashboard/services")}
                        className="w-1/2 py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-red-800/80 backdrop-blur-sm hover:bg-red-900/90 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 shadow-lg border border-red-600/20 text-white"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={isLoading}
                        className="w-1/2 py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-500/20 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
                     >
                        {isLoading ? "Adding..." : "Add Service"}
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
