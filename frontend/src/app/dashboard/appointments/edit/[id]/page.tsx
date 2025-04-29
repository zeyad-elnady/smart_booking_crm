"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
   ArrowLeftIcon,
   UserPlusIcon,
   PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { customerAPI, serviceAPI, Customer, Service } from "@/services/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/components/ThemeProvider";
import * as React from "react";
import type { Appointment } from "@/types/appointment";
import { indexedDBService } from "@/services/indexedDB";
import { fetchAppointmentById, updateAppointment } from "@/services/appointmentService";

interface AppointmentData {
   customer: string;
   service: string;
   date: string;
   time: string;
   duration: string;
   status: "Pending" | "Confirmed" | "Canceled" | "Completed";
   notes: string;
   customerInfo?: {
      name: string;
      firstName: string;
      lastName: string;
   };
   serviceInfo?: {
      name: string;
      price?: number;
      duration?: string;
   };
}

export default function EditAppointment({
   params,
}: {
   params: { id: string };
}) {
   const appointmentId = params.id;

   const router = useRouter();
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(true);
   const [appointment, setAppointment] = useState<Appointment | null>(null);
   const [formData, setFormData] = useState({
      customerId: "",
      serviceId: "",
      date: "",
      time: "",
      duration: "60",
      status: "Pending",
      notes: "",
   });
   const [formErrors, setFormErrors] = useState<any>({});
   const { darkMode } = useTheme();

   // Fetch customers, services, and appointment data on component mount
   useEffect(() => {
      const loadData = async () => {
         try {
            setLoading(true);
            console.log("Starting to load data for appointment ID:", appointmentId);

            // 1. Initialize database
            try {
               await indexedDBService.initDB();
               console.log("IndexedDB initialized successfully");
            } catch (dbError) {
               console.error("Error initializing database:", dbError);
               toast.error("Failed to initialize database");
            }

            // 2. Load the appointment using our enhanced function
            let appointmentData;
            try {
               console.log("Fetching appointment with ID:", appointmentId);
               appointmentData = await fetchAppointmentById(appointmentId);
               
               if (!appointmentData) {
                  console.error("No appointment found with ID:", appointmentId);
                  toast.error("Could not find the appointment data");
                  router.push("/dashboard/appointments");
                  return;
               }
               
               console.log("Appointment data loaded successfully:", appointmentData);
               setAppointment(appointmentData);
            } catch (apptError) {
               console.error("Error fetching appointment:", apptError);
               toast.error("Could not load appointment data");
               router.push("/dashboard/appointments");
               return;
            }

            // 3. Load customers
            try {
               console.log("Loading customers...");
               const fetchedCustomers = await indexedDBService.getAllCustomers();
               console.log(`Loaded ${fetchedCustomers.length} customers from IndexedDB`);
               setCustomers(fetchedCustomers || []);
            } catch (custError) {
               console.error("Error fetching customers:", custError);
               // Try localStorage fallback
               const storedCustomers = localStorage.getItem("mockCustomers");
               if (storedCustomers) {
                  try {
                     const parsedCustomers = JSON.parse(storedCustomers);
                     setCustomers(parsedCustomers);
                     console.log("Used fallback customer data from localStorage");
                  } catch (parseError) {
                     console.error("Error parsing localStorage customers:", parseError);
                  }
               }
            }

            // 4. Load services
            try {
               console.log("Loading services...");
               const fetchedServices = await indexedDBService.getAllServices();
               console.log(`Loaded ${fetchedServices.length} services from IndexedDB`);
               setServices(fetchedServices || []);
            } catch (servError) {
               console.error("Error fetching services:", servError);
               // Try localStorage fallback
               const storedServices = localStorage.getItem("mockServices");
               if (storedServices) {
                  try {
                     const parsedServices = JSON.parse(storedServices);
                     setServices(parsedServices);
                     console.log("Used fallback service data from localStorage");
                  } catch (parseError) {
                     console.error("Error parsing localStorage services:", parseError);
                  }
               }
            }

            // 5. Set form data from appointment
            if (appointmentData) {
               // Extract customer ID - could be string or object
               const customerId = 
                  typeof appointmentData.customer === "object" && appointmentData.customer !== null
                     ? appointmentData.customer._id 
                     : appointmentData.customer;
               
               // Extract service ID - could be string or object
               const serviceId = 
                  typeof appointmentData.service === "object" && appointmentData.service !== null
                     ? appointmentData.service._id
                     : appointmentData.service;
               
               console.log("Setting form data with customer ID:", customerId, "and service ID:", serviceId);
               
               setFormData({
                  customerId,
                  serviceId,
                  date: appointmentData.date || "",
                  time: appointmentData.time || "",
                  duration: appointmentData.duration || "60",
                  status: appointmentData.status || "Pending",
                  notes: appointmentData.notes || "",
               });
            }
         } catch (error) {
            console.error("Overall error loading data:", error);
            toast.error("Failed to load required data");
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, [appointmentId, router]);

   const handleChange = (
      e: React.ChangeEvent<
         HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
   ) => {
      const { name, value } = e.target;
      console.log(`Form field changed: ${name} = ${value}`);
      
      setFormData((prev) => {
         const updated = {
            ...prev,
            [name]: value,
         };
         console.log("Updated form data:", updated);
         return updated;
      });
      
      // Clear error when field is edited
      if (formErrors[name]) {
         console.log(`Clearing error for field: ${name}`);
         setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setLoading(true);
      try {
         // First make sure the appointment still exists in our IndexedDB
         if (!appointment) {
            toast.error("Cannot update: Original appointment data not found");
            router.push("/dashboard/appointments");
            return;
         }

         // Find the selected customer and service details
         const selectedCustomer = customers.find(
            (c) => c._id === formData.customerId
         );
         const selectedService = services.find(
            (s) => s._id === formData.serviceId
         );

         if (!selectedCustomer || !selectedService) {
            toast.error(
               "Selected customer or service not found. Please try again."
            );
            setLoading(false);
            return;
         }

         // Format data for update with customer and service info
         const appointmentData = {
            customer: formData.customerId.trim(),
            service: formData.serviceId.trim(),
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            status: formData.status,
            notes: formData.notes || "",
            // Add additional info to help with display when API is down
            customerInfo: {
               name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
               firstName: selectedCustomer.firstName,
               lastName: selectedCustomer.lastName,
            },
            serviceInfo: {
               name: selectedService.name,
               price: selectedService.price,
               duration: selectedService.duration,
            },
         };

         console.log("Updating appointment with data:", appointmentData);

         // Use the updateAppointment function from appointmentService
         const updatedAppointment = await updateAppointment(appointmentId, appointmentData);
         console.log("Appointment updated successfully:", updatedAppointment);
         
         toast.success("Appointment updated successfully");
         router.push("/dashboard/appointments");
      } catch (error: any) {
         console.error("Error updating appointment:", error);
         const errorMessage = error.message || "Failed to update appointment";
         toast.error(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   const validateForm = () => {
      const errors: any = {};

      // Required field validation
      if (!formData.customerId) errors.customerId = "Customer is required";
      if (!formData.serviceId) errors.serviceId = "Service is required";
      if (!formData.date) errors.date = "Date is required";
      if (!formData.time) errors.time = "Time is required";
      
      // Duration validation
      if (!formData.duration) {
         errors.duration = "Duration is required";
      } else if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
         errors.duration = "Duration must be a positive number";
      }

      // Date validation - make sure it's a valid date
      if (formData.date) {
         const datePattern = /^\d{4}-\d{2}-\d{2}$/;
         if (!datePattern.test(formData.date)) {
            errors.date = "Invalid date format (should be YYYY-MM-DD)";
         }
      }

      // Time validation - make sure it's a valid time
      if (formData.time) {
         const timePattern = /^\d{2}:\d{2}$/;
         if (!timePattern.test(formData.time)) {
            errors.time = "Invalid time format (should be HH:MM)";
         }
      }

      console.log("Validation errors:", errors);
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
   };

   // Prepare dropdown options
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

   const statusOptions = [
      { value: "Pending", label: "Pending" },
      { value: "Confirmed", label: "Confirmed" },
      { value: "Canceled", label: "Canceled" },
      { value: "Completed", label: "Completed" }
   ];

   if (loading && !appointment) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-16 h-16 relative">
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`h-12 w-12 border-4 border-t-transparent border-${darkMode ? "purple-600" : "indigo-600"} rounded-full animate-spin`}></div>
               </div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`h-8 w-8 border-4 border-t-transparent border-${darkMode ? "blue-400" : "blue-500"} rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '0.75s' }}></div>
               </div>
            </div>
            <p className={`mt-4 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Loading appointment data...</p>
            <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>This may take a few moments</p>
         </div>
      );
   }

   if (!appointment && !loading) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen">
            <div className={`rounded-full p-4 bg-${darkMode ? "red-900/30" : "red-100"} mb-4`}>
               <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${darkMode ? "text-red-500" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Appointment Not Found</h2>
            <p className={`text-center mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
               We couldn't find the appointment you're looking for.
            </p>
            <Link
               href="/dashboard/appointments"
               className={`px-4 py-2 rounded-md font-medium flex items-center space-x-2 ${
                  darkMode ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-indigo-600 text-white hover:bg-indigo-700"
               }`}
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
               <span>Return to Appointments</span>
            </Link>
         </div>
      );
   }

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
               Edit Appointment
            </h1>
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
                        name="customerId"
                        value={formData.customerId}
                        onChange={handleChange}
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
                        onChange={handleChange}
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

               {/* Duration and Status */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Status
                     </label>
                     <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     >
                        {statusOptions.map((option) => (
                           <option key={option.value} value={option.value}>
                              {option.label}
                           </option>
                        ))}
                     </select>
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
                     rows={4}
                     className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                        darkMode
                           ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                           : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                     }`}
                  />
               </div>

               {/* Submit Button */}
               <div className="flex space-x-4">
                  <button
                     type="button"
                     onClick={() => router.back()}
                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                           ? "bg-gray-700 text-white hover:bg-gray-600"
                           : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                     }`}
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     disabled={loading}
                     className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                           ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                           : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                     }`}
                  >
                     {loading ? "Updating..." : "Update Appointment"}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
