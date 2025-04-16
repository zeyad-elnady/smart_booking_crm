"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
   ArrowLeftIcon,
   UserPlusIcon,
   PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { customerAPI, serviceAPI, Customer, Service } from "@/services/api";
import CustomDropdown from "@/components/CustomDropdown";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { fetchCustomers } from "@/services/customerService";
import { fetchServices } from "@/services/serviceService";
import { createAppointment } from "@/services/appointmentService";
import { useTheme } from "@/components/ThemeProvider";

// Custom style to fix dropdown behavior
const customStyles = `
  /* Override dropdown direction and appearance */
  select, input, textarea {
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    color-scheme: auto !important;
  }
  
  /* Force dropdown to appear at the bottom */
  select option {
    position: relative;
    display: block;
    min-height: 1.2em;
    padding: 0.5em;
  }
  
  /* Custom dropdown arrow */
  .select-wrapper {
    position: relative;
  }
  
  .select-wrapper::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 15px;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    pointer-events: none;
  }
  
  /* Focus styles */
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: rgba(209, 213, 219, 0.5) !important;
    box-shadow: 0 0 0 2px rgba(209, 213, 219, 0.25) !important;
  }
  
  /* Form container */
  .form-container {
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  /* Custom input styles */
  .custom-input {
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }
  
  .custom-input:hover {
    border-color: rgba(209, 213, 219, 0.5);
  }
  
  .custom-input:focus {
    border-color: rgba(209, 213, 219, 0.5) !important;
    box-shadow: 0 0 0 2px rgba(209, 213, 219, 0.25) !important;
  }
  
  /* Custom input icons */
  .input-with-icon {
    position: relative;
  }
  
  .input-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }
  
  /* Light mode styles */
  .light select, .light input, .light textarea {
    background-color: white !important;
    color: #111827 !important;
    border-color: #D1D5DB !important;
  }
  
  .light select option {
    background-color: white !important;
    color: #111827 !important;
  }
  
  .light select option:checked,
  .light select option:hover {
    background-color: #F3F4F6 !important;
    color: #111827 !important;
  }
  
  .light .select-wrapper::after {
    border-top: 5px solid #6B7280;
  }
  
  .light select::-ms-expand {
    display: none;
  }
  
  /* Dark mode styles */
  .dark select, .dark input, .dark textarea {
    background-color: #1f2937 !important;
    color: white !important;
    border-color: #374151 !important;
  }
  
  .dark select option {
    background-color: #1f2937 !important;
    color: white !important;
  }
  
  .dark .select-wrapper::after {
    border-top: 5px solid #D1D5DB;
  }
`;

export default function AddAppointment() {
   const router = useRouter();
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(false);
   const [formData, setFormData] = useState({
      customerId: "",
      serviceId: "",
      date: "",
      time: "",
      duration: "60",
      status: "scheduled",
      notes: "",
   });
   const [formErrors, setFormErrors] = useState<any>({});
   const { darkMode } = useTheme();

   const selectRef = useRef<HTMLSelectElement>(null);

   // Fetch customers and services on component mount
   useEffect(() => {
      const loadData = async () => {
         try {
            const fetchedCustomers = await fetchCustomers();
            const fetchedServices = await fetchServices();
            console.log("Fetched services:", fetchedServices); // Debug log
            setCustomers(fetchedCustomers);
            setServices(fetchedServices);
         } catch (error) {
            console.error("Error loading data:", error);
            toast.error(
               "Failed to load required data. Please try refreshing the page."
            );
         }
      };
      loadData();
   }, []);

   useEffect(() => {
      if (!selectRef.current) return;

      const handleSelectClick = () => {
         // Force reposition of dropdown after a tiny delay
         setTimeout(() => {
            if (selectRef.current) {
               // This forces a reflow which can help reset dropdown position
               selectRef.current.blur();
               selectRef.current.focus();
            }
         }, 10);
      };

      const select = selectRef.current;
      select.addEventListener("mousedown", handleSelectClick);

      return () => {
         select.removeEventListener("mousedown", handleSelectClick);
      };
   }, []);

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
   ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: value,
      }));
      // Clear error when field is edited
      if (formErrors[name]) {
         setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setLoading(true);
      try {
         // Format data for the API
         const appointmentData = {
            customer: formData.customerId,
            service: formData.serviceId,
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            status: formData.status,
            notes: formData.notes,
         };

         await createAppointment(appointmentData);
         toast.success("Appointment created successfully");
         router.push("/dashboard/appointments");
      } catch (error) {
         console.error("Error creating appointment:", error);
         toast.error("Failed to create appointment");
      } finally {
         setLoading(false);
      }
   };

   const handleDropdownChange = (name: string, value: string) => {
      console.log(`Dropdown changed: ${name} = ${value}`); // Debug log
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formErrors[name]) {
         setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
      }
   };

   const validateForm = () => {
      const errors: any = {};
      if (!formData.customerId) errors.customerId = "Customer is required";
      if (!formData.serviceId) errors.serviceId = "Service is required";
      if (!formData.date) errors.date = "Date is required";
      if (!formData.time) errors.time = "Time is required";
      if (!formData.duration) errors.duration = "Duration is required";
      if (!formData.status) errors.status = "Status is required";
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
   };

   // Prepare dropdown options with error handling
   const customerOptions = customers.map((customer) => ({
      id: customer._id,
      label: `${customer.firstName} ${customer.lastName} (${
         customer.email || "No email"
      })`,
   }));

   const serviceOptions = services.map((service) => {
      return {
         id: service._id,
         label: service.name,
      };
   });

   const statusOptions = [
      { id: "scheduled", label: "Scheduled" },
      { id: "confirmed", label: "Confirmed" },
      { id: "cancelled", label: "Cancelled" },
      { id: "completed", label: "Completed" },
   ];

   return (
      <div className={`p-6 w-full ${darkMode ? "dark" : "light"}`}>
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
               Schedule New Appointment
            </h1>
         </div>

         {/* Quick Actions Panel */}
         <div
            className={`mb-6 p-4 rounded-lg border ${
               darkMode
                  ? "bg-gray-800/30 border-white/10"
                  : "bg-white border-gray-200 shadow-sm"
            }`}
         >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h2
                     className={`text-lg font-medium ${
                        darkMode ? "text-white" : "text-gray-900"
                     }`}
                  >
                     Need to add a customer or service first?
                  </h2>
                  <p
                     className={`mt-1 text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                     }`}
                  >
                     Create these records before scheduling the appointment
                  </p>
               </div>
               <div className="flex gap-3">
                  <Link
                     href="/dashboard/customers/add"
                     className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                           darkMode
                              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                              : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                        }`}
                  >
                     <UserPlusIcon className="w-5 h-5 mr-2" />
                     Add Customer
                  </Link>
                  <Link
                     href="/dashboard/services/add"
                     className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                           darkMode
                              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                              : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                        }`}
                  >
                     <PlusCircleIcon className="w-5 h-5 mr-2" />
                     Add Service
                  </Link>
               </div>
            </div>
         </div>

         {/* Main Form */}
         <div
            className={`rounded-xl border p-6 ${
               darkMode
                  ? "bg-gray-800/30 border-white/10"
                  : "bg-white border-gray-200 shadow-sm"
            }`}
         >
            <form onSubmit={handleSubmit} className="space-y-6">
               {/* Customer and Service Selection */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Selection */}
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Customer <span className="text-pink-500">*</span>
                     </label>
                     <select
                        value={formData.customerId}
                        onChange={(e) =>
                           handleDropdownChange("customerId", e.target.value)
                        }
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     >
                        <option value="">Select a customer</option>
                        {customerOptions.map((option) => (
                           <option key={option.id} value={option.id}>
                              {option.label}
                           </option>
                        ))}
                     </select>
                     {formErrors.customerId && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.customerId}
                        </p>
                     )}
                  </div>

                  {/* Service Selection */}
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Service <span className="text-pink-500">*</span>
                     </label>
                     <select
                        name="serviceId"
                        value={formData.serviceId}
                        onChange={(e) =>
                           handleDropdownChange("serviceId", e.target.value)
                        }
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     >
                        <option value="">Select a service</option>
                        {services.map((service) => (
                           <option key={service._id} value={service._id}>
                              {service.name}
                           </option>
                        ))}
                     </select>
                     {formErrors.serviceId && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.serviceId}
                        </p>
                     )}
                  </div>
               </div>

               {/* Date and Time Selection */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Date <span className="text-pink-500">*</span>
                     </label>
                     <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     />
                     {formErrors.date && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.date}
                        </p>
                     )}
                  </div>
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Time <span className="text-pink-500">*</span>
                     </label>
                     <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     />
                     {formErrors.time && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.time}
                        </p>
                     )}
                  </div>
               </div>

               {/* Duration Selection */}
               <div>
                  <label
                     className={`block mb-2 text-sm font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                     }`}
                  >
                     Duration <span className="text-pink-500">*</span>
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

               {/* Status Selection */}
               <div>
                  <label
                     className={`block mb-2 text-sm font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                     }`}
                  >
                     Status <span className="text-pink-500">*</span>
                  </label>
                  <select
                     value={formData.status}
                     onChange={(e) =>
                        handleDropdownChange("status", e.target.value)
                     }
                     className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                        darkMode
                           ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                           : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                     }`}
                  >
                     <option value="">Select a status</option>
                     {statusOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                           {option.label}
                        </option>
                     ))}
                  </select>
                  {formErrors.status && (
                     <p
                        className={`mt-1 text-sm ${
                           darkMode ? "text-red-400" : "text-red-500"
                        }`}
                     >
                        {formErrors.status}
                     </p>
                  )}
               </div>

               {/* Notes */}
               <div>
                  <label
                     className={`block mb-2 text-sm font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                     }`}
                  >
                     Notes
                  </label>
                  <textarea
                     name="notes"
                     value={formData.notes}
                     onChange={handleChange}
                     className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                        darkMode
                           ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                           : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                     }`}
                  />
               </div>

               {/* Submit Button */}
               <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                     darkMode
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  {loading ? "Creating..." : "Create Appointment"}
               </button>
            </form>
         </div>
      </div>
   );
}
