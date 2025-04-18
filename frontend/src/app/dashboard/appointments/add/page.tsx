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
import { useTheme } from "@/components/ThemeProvider";
import { createAppointment } from "@/services/appointmentService";
import { appointmentAPI } from "@/services/api";
import { AppointmentData, AppointmentStatus } from "@/types/appointment";

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
      status: "Pending",
      notes: "",
   });
   const [formErrors, setFormErrors] = useState<any>({});
   const { darkMode } = useTheme();

   const selectRef = useRef<HTMLSelectElement>(null);

   // Fetch customers and services on component mount
   useEffect(() => {
      const loadData = async () => {
         try {
            const [customersData, servicesData] = await Promise.all([
               fetchCustomers(),
               fetchServices(),
            ]);

            setCustomers(customersData);
            // Convert price to number for each service
            setServices(
               servicesData.map(
                  (service: {
                     _id: string;
                     name: string;
                     description: string;
                     duration: string;
                     price: string;
                     category: string;
                     isActive: boolean;
                  }) => ({
                     ...service,
                     price: Number(service.price),
                  })
               )
            );
         } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load data");
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

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      // First validate the form
      if (!validateForm()) {
         toast.error("Please fill all required fields");
         return;
      }
      
      setLoading(true);

      try {
         const selectedService = services.find(
            (s) => s._id === formData.serviceId
         );
         const selectedCustomer = customers.find(
            (c) => c._id === formData.customerId
         );

         if (!selectedService || !selectedCustomer) {
            toast.error("Please select both customer and service");
            setLoading(false);
            return;
         }

         // Create a properly formatted appointment data object
         const appointmentData: AppointmentData = {
            customer: formData.customerId,
            service: formData.serviceId,
            date: formData.date,
            time: formData.time,
            duration: selectedService.duration || "60", // Default to 60 minutes if not specified
            status: "Pending", // Default status
            notes: formData.notes || "",
            // Include additional info for better display
            customerInfo: {
               name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
               firstName: selectedCustomer.firstName,
               lastName: selectedCustomer.lastName,
            },
            serviceInfo: {
               name: selectedService.name,
               price: Number(selectedService.price) || 0,
               duration: selectedService.duration || "60",
            },
         };

         // Use our appointmentService to create the appointment
         const newAppointment = await createAppointment(appointmentData);
         
         console.log("Appointment created:", newAppointment);
         
         // Set the refresh flag to ensure the appointment list is updated
         localStorage.setItem("appointmentListShouldRefresh", "true");
         
         toast.success("Appointment created successfully");
         
         // Redirect to the appointments page
         router.push("/dashboard/appointments");
      } catch (error: any) {
         console.error("Error creating appointment:", error);
         let errorMessage = "Failed to create appointment";
         
         // Provide more specific error messages
         if (error.response) {
            // The request was made and the server responded with an error status
            errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
            console.log("Error response:", error.response);
         } else if (error.request) {
            // The request was made but no response was received
            errorMessage = "No response from server. Check your connection.";
         } else if (error.message) {
            // Something else caused the error
            errorMessage = error.message;
         }
         
         toast.error(errorMessage);
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

      // Required field validation
      if (!formData.customerId) errors.customerId = "Customer is required";
      if (!formData.serviceId) errors.serviceId = "Service is required";
      if (!formData.date) errors.date = "Date is required";
      if (!formData.time) errors.time = "Time is required";

      // Date validation
      if (formData.date) {
         const selectedDate = new Date(formData.date);
         const today = new Date();
         today.setHours(0, 0, 0, 0);

         if (selectedDate < today) {
            errors.date = "Cannot schedule appointments in the past";
         }
      }

      // Time validation
      if (formData.time && formData.date) {
         const [hours, minutes] = formData.time.split(":");
         const appointmentTime = new Date(formData.date);
         appointmentTime.setHours(parseInt(hours), parseInt(minutes));

         const now = new Date();
         if (appointmentTime < now) {
            errors.time = "Cannot schedule appointments in the past";
         }
      }

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
         label: service.name || "Unknown Service",
      };
   });

   // Function to reload customers
   const reloadCustomers = async () => {
      try {
         // Clear the current mock customers
         localStorage.removeItem("mockCustomers");
         toast.success("Mock customers cleared. Reloading...");

         // Wait a moment then reload the page
         setTimeout(() => {
            window.location.reload();
         }, 1000);
      } catch (error) {
         console.error("Error reloading customers:", error);
         toast.error("Failed to reload customers");
      }
   };

   // Function to reload services
   const reloadServices = async () => {
      try {
         // Clear the current mock services
         localStorage.removeItem("mockServices");
         toast.success("Mock services cleared. Reloading...");

         // Wait a moment then reload the page
         setTimeout(() => {
            window.location.reload();
         }, 1000);
      } catch (error) {
         console.error("Error reloading services:", error);
         toast.error("Failed to reload services");
      }
   };

   return (
      <div className="p-6 max-w-5xl mx-auto">
         <div className="flex items-center mb-6">
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
                        {serviceOptions.map((option) => (
                           <option key={option.id} value={option.id}>
                              {option.label}
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
