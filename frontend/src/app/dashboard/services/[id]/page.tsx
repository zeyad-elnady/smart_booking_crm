"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";
import { Service } from "@/types/service";
import { fetchServiceById, updateService } from "@/services/serviceService";

export default function EditService({ params }: { params: { id: string } }) {
   const router = useRouter();
   const { darkMode } = useTheme();
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({
      name: "",
      description: "",
      duration: "",
      price: "",
      category: "",
      isActive: true,
   });
   const [formErrors, setFormErrors] = useState<any>({});

   useEffect(() => {
      const loadService = async () => {
         try {
            setLoading(true);
            const service = await fetchServiceById(params.id);
            setFormData({
               name: service.name,
               description: service.description || "",
               duration: service.duration,
               price: service.price.toString(),
               category: service.category,
               isActive: service.isActive,
            });
         } catch (error) {
            console.error("Error loading service:", error);
            toast.error("Failed to load service");
         } finally {
            setLoading(false);
         }
      };

      loadService();
   }, [params.id]);

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
   ) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]:
            type === "checkbox"
               ? (e.target as HTMLInputElement).checked
               : value,
      }));
      if (formErrors[name]) {
         setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
      }
   };

   const validateForm = () => {
      const errors: any = {};
      if (!formData.name) errors.name = "Name is required";
      if (!formData.duration) errors.duration = "Duration is required";
      if (!formData.price) errors.price = "Price is required";
      if (!formData.category) errors.category = "Category is required";
      return errors;
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
         setFormErrors(errors);
         return;
      }

      try {
         setLoading(true);
         const submitData = {
            ...formData,
            price: Number(formData.price),
         };
         await updateService(params.id, submitData);
         toast.success("Service updated successfully");
         router.push("/dashboard/services");
      } catch (error) {
         console.error("Error updating service:", error);
         toast.error("Failed to update service");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="p-6">
         <div className="mb-6 flex items-center">
            <button
               onClick={() => router.back()}
               className={`mr-4 rounded-full p-2 transition ${
                  darkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
               }`}
            >
               <ArrowLeftIcon
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
               Edit Service
            </h1>
         </div>

         <div
            className={`rounded-xl border p-6 ${
               darkMode
                  ? "bg-gray-800/30 border-white/10"
                  : "bg-white border-gray-200 shadow-sm"
            }`}
         >
            <form onSubmit={handleSubmit} className="space-y-6">
               <div>
                  <label
                     className={`block mb-2 text-sm font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                     }`}
                  >
                     Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                     type="text"
                     name="name"
                     value={formData.name}
                     onChange={handleChange}
                     className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                        darkMode
                           ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                           : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                     }`}
                  />
                  {formErrors.name && (
                     <p
                        className={`mt-1 text-sm ${
                           darkMode ? "text-red-400" : "text-red-500"
                        }`}
                     >
                        {formErrors.name}
                     </p>
                  )}
               </div>

               <div>
                  <label
                     className={`block mb-2 text-sm font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                     }`}
                  >
                     Description
                  </label>
                  <textarea
                     name="description"
                     value={formData.description}
                     onChange={handleChange}
                     className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                        darkMode
                           ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                           : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                     }`}
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Duration (minutes){" "}
                        <span className="text-pink-500">*</span>
                     </label>
                     <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     />
                     {formErrors.duration && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.duration}
                        </p>
                     )}
                  </div>

                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Price ($) <span className="text-pink-500">*</span>
                     </label>
                     <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     />
                     {formErrors.price && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.price}
                        </p>
                     )}
                  </div>

                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Category <span className="text-pink-500">*</span>
                     </label>
                     <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     />
                     {formErrors.category && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.category}
                        </p>
                     )}
                  </div>
               </div>

               <div className="flex items-center">
                  <input
                     type="checkbox"
                     name="isActive"
                     checked={formData.isActive}
                     onChange={handleChange}
                     className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                     className={`ml-2 text-sm ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                     }`}
                  >
                     Active
                  </label>
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                     darkMode
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  {loading ? "Updating..." : "Update Service"}
               </button>
            </form>
         </div>
      </div>
   );
}
