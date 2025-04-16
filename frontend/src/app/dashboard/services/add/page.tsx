"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DollarSign } from "lucide-react";
import { Clock } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { toast } from "react-hot-toast";
import { serviceAPI } from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";

export default function AddService() {
   const router = useRouter();
   const { darkMode } = useTheme();

   // Form state
   const [name, setName] = useState("");
   const [price, setPrice] = useState("");
   const [duration, setDuration] = useState("");
   const [description, setDescription] = useState("");

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
         await serviceAPI.createService({
            name,
            price,
            duration,
            description,
            category: "General",
            isActive: true,
         });

         toast.success("Service added successfully");
         router.push("/dashboard/services");
      } catch (error) {
         console.error("Error adding service:", error);
         toast.error("Failed to add service");
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
                  <div>
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
                        placeholder="Service name"
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Price */}
                     <div>
                        <label
                           className={`block mb-2 text-sm font-medium ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                           }`}
                        >
                           Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                           <input
                              type="number"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              required
                              min="0"
                              step="0.01"
                              className={`w-full px-4 py-2 pl-10 rounded-lg ${
                                 darkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                              } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                              placeholder="0.00"
                           />
                           <DollarSign
                              className={`absolute left-3 top-2.5 w-5 h-5 ${
                                 darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                           />
                        </div>
                     </div>

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
                              type="number"
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              required
                              min="1"
                              className={`w-full px-4 py-2 pl-10 rounded-lg ${
                                 darkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                    : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                              } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                              placeholder="Duration in minutes"
                           />
                           <Clock
                              className={`absolute left-3 top-2.5 w-5 h-5 ${
                                 darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                           />
                        </div>
                     </div>
                  </div>

                  {/* Description */}
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Description
                     </label>
                     <div className="relative">
                        <textarea
                           value={description}
                           onChange={(e) => setDescription(e.target.value)}
                           rows={4}
                           className={`w-full px-4 py-2 pl-10 rounded-lg ${
                              darkMode
                                 ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                                 : "bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600"
                           } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                           placeholder="Service description..."
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
                        {isLoading ? "Adding..." : "Add Service"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}
