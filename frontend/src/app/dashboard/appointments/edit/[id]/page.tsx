"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
   ArrowLeftIcon,
   UserPlusIcon,
   PlusCircleIcon,
} from "@heroicons/react/24/outline";
import {
   customerAPI,
   serviceAPI,
   Customer,
   Service,
   AppointmentData,
   Appointment,
} from "@/services/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { appointmentService } from "@/lib/appointmentService";
import { useTheme } from "@/components/ThemeProvider";
import * as React from "react";

export default function EditAppointment({ params }: { params: { id: string } }) {
   // Properly unwrap the params object using React.use()
   const unwrappedParams = React.use(params as any);
   const appointmentId = unwrappedParams.id as string;
   
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
      status: "Waiting",
      notes: "",
   });
   const [formErrors, setFormErrors] = useState<any>({});
   const { darkMode } = useTheme();
   const [debugMode, setDebugMode] = useState(false);

   // Fetch customers, services, and appointment data on component mount
   useEffect(() => {
      const loadData = async () => {
         try {
            setLoading(true);
            
            // Load customers
            try {
               const fetchedCustomers = await customerAPI.getCustomers();
               console.log("Fetched customers:", fetchedCustomers);
               setCustomers(fetchedCustomers || []);
            } catch (error) {
               console.error("Error fetching customers:", error);
               const storedCustomers = localStorage.getItem('mockCustomers');
               if (storedCustomers) {
                  setCustomers(JSON.parse(storedCustomers));
               }
            }
            
            // Load services
            try {
               const fetchedServices = await serviceAPI.getServices();
               console.log("Fetched services:", fetchedServices);
               setServices(fetchedServices || []);
            } catch (error) {
               console.error("Error fetching services:", error);
               const storedServices = localStorage.getItem('mockServices');
               if (storedServices) {
                  setServices(JSON.parse(storedServices));
               }
            }
            
            // Get the appointment
            try {
               // Get directly from localStorage
               const storedAppointments = localStorage.getItem('storedAppointments');
               if (storedAppointments) {
                  const appointments = JSON.parse(storedAppointments);
                  const foundAppointment = appointments.find((a: any) => a._id === appointmentId);
                  
                  if (foundAppointment) {
                     console.log("Fetched appointment from localStorage:", foundAppointment);
                     setAppointment(foundAppointment);
                     
                     // Set form data from appointment
                     const customerId = typeof foundAppointment.customer === 'object' 
                        ? foundAppointment.customer._id 
                        : foundAppointment.customer;
                        
                     const serviceId = typeof foundAppointment.service === 'object'
                        ? foundAppointment.service._id
                        : foundAppointment.service;
                        
                     setFormData({
                        customerId,
                        serviceId,
                        date: foundAppointment.date,
                        time: foundAppointment.time,
                        duration: foundAppointment.duration,
                        status: foundAppointment.status || "Waiting",
                        notes: foundAppointment.notes || "",
                     });
                  } else {
                     throw new Error("Appointment not found");
                  }
               } else {
                  throw new Error("No appointments found in storage");
               }
            } catch (error) {
               console.error("Error fetching appointment:", error);
               toast.error("Could not load appointment data");
               router.push("/dashboard/appointments");
            }
         } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load required data. Please try refreshing the page.");
         } finally {
            setLoading(false);
         }
      };
      
      loadData();
   }, [appointmentId, router]);

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
         // Find the selected customer and service details
         const selectedCustomer = customers.find(c => c._id === formData.customerId);
         const selectedService = services.find(s => s._id === formData.serviceId);
         
         if (!selectedCustomer || !selectedService) {
            toast.error("Selected customer or service not found. Please try again.");
            setLoading(false);
            return;
         }
         
         // Format data for update with customer and service info
         const appointmentData: Partial<AppointmentData> = {
            customer: formData.customerId.trim(),
            service: formData.serviceId.trim(),
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            status: formData.status as "Waiting" | "Cancelled" | "Completed",
            notes: formData.notes || "",
            // Add additional info to help with display when API is down
            customerInfo: {
               name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
               firstName: selectedCustomer.firstName,
               lastName: selectedCustomer.lastName
            },
            serviceInfo: {
               name: selectedService.name
            }
         };

         console.log("Updating appointment with data:", appointmentData);
         
         // Update the appointment directly using localStorage
         const storedAppointments = localStorage.getItem('storedAppointments');
         if (storedAppointments) {
            const appointments = JSON.parse(storedAppointments);
            const index = appointments.findIndex((a: any) => a._id === appointmentId);
            
            if (index !== -1) {
               // Create updated appointment object
               const updatedAppointment = {
                  ...appointments[index],
                  ...appointmentData,
                  updatedAt: new Date().toISOString(),
                  customer: {
                     _id: selectedCustomer._id,
                     name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
                     firstName: selectedCustomer.firstName,
                     lastName: selectedCustomer.lastName,
                     email: selectedCustomer.email || ""
                  },
                  service: {
                     _id: selectedService._id,
                     name: selectedService.name,
                     duration: selectedService.duration,
                     price: selectedService.price
                  },
                  // Set status color based on status
                  statusColor: formData.status === "Confirmed" 
                     ? "from-green-500 to-green-600" 
                     : formData.status === "Canceled" 
                        ? "from-red-500 to-red-600" 
                        : "from-yellow-500 to-yellow-600" // Pending (default)
               };
               
               // Update in array
               appointments[index] = updatedAppointment;
               
               // Save back to localStorage
               localStorage.setItem('storedAppointments', JSON.stringify(appointments));
               console.log("Appointment updated in localStorage:", updatedAppointment);
               
               toast.success("Appointment updated successfully");
               router.push("/dashboard/appointments");
            } else {
               toast.error("Appointment not found");
            }
         } else {
            toast.error("No appointments found in storage");
         }
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
      if (!formData.duration) errors.duration = "Duration is required";

      // Duration validation
      if (formData.duration && isNaN(Number(formData.duration))) {
         errors.duration = "Duration must be a number";
      }

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
   ];

   if (loading && !appointment) {
      return (
         <div className="flex items-center justify-center h-screen">
            <div className="text-center">
               <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-indigo-500 border-t-transparent" role="status">
                  <span className="visually-hidden">Loading...</span>
               </div>
               <p className="mt-2 text-gray-300">Loading appointment data...</p>
            </div>
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
                        Duration (minutes) <span className="text-pink-500">*</span>
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