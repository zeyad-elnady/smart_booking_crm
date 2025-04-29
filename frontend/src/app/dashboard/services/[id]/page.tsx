"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft, DollarSign, Clock, ClipboardList } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getServiceById, updateService } from "@/services/serviceService";

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
            const service = await getServiceById(params.id);
            
            if (service) {
               setFormData({
                  name: service.name,
                  description: service.description || "",
                  duration: service.duration,
                  price: service.price.toString(),
                  category: service.category || "",
                  isActive: service.isActive ?? true,
               });
            } else {
               toast.error("Service not found");
               router.push("/dashboard/services");
            }
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
            <form onSubmit={handleSubmit} className="space-y-8 w-full">
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

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label
                        htmlFor="price"
                        className="block mb-2 text-sm font-medium text-gray-300"
                     >
                        Price <span className="text-red-500">*</span>
                     </label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                           type="number"
                           id="price"
                           name="price"
                           value={formData.price}
                           onChange={handleChange}
                           required
                           min="0"
                           step="0.01"
                           className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                           placeholder="Enter price"
                        />
                     </div>
                  </div>

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
               </div>

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
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-white/10 bg-gray-900/70 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        placeholder="Describe the service..."
                     />
                  </div>
               </div>

               <div className="flex items-center p-4 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/50">
                  <input
                     type="checkbox"
                     id="isActive"
                     name="isActive"
                     checked={formData.isActive}
                     onChange={handleChange}
                     className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="ml-3 block text-sm text-gray-300 font-medium">
                     Active Service
                  </label>
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
                     disabled={loading}
                     className="w-1/2 py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-500/20 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
                  >
                     {loading ? "Updating..." : "Update Service"}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
