"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";
import {
   Appointment,
   AppointmentStatus,
   AppointmentData,
} from "@/types/appointment";
import { Customer } from "@/types/customer";
import { Service } from "@/types/service";
import {
   fetchAppointmentById,
   updateAppointment,
} from "@/services/appointmentService";
import { fetchCustomers } from "@/services/customerService";
import { fetchServices } from "@/services/serviceService";

// Define a type for the API response
interface AppointmentResponse
   extends Omit<Appointment, "customer" | "service"> {
   customer: Customer;
   service: Service;
}

export default function EditAppointment({
   params,
}: {
   params: { id: string };
}) {
   const router = useRouter();
   const { darkMode } = useTheme();
   const [loading, setLoading] = useState(false);
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [formData, setFormData] = useState<AppointmentData>({
      customer: "",
      service: "",
      date: "",
      time: "",
      duration: "0",
      notes: "",
      status: "Pending",
   });
   const [formErrors, setFormErrors] = useState<Record<string, string>>({});

   useEffect(() => {
      const loadData = async () => {
         try {
            setLoading(true);
            // Load the appointment data
            const appointment = await fetchAppointmentById(params.id);
            if (appointment) {
               const typedAppointment =
                  appointment as unknown as AppointmentResponse;
               // Load customers and services
               const [customersData, servicesData] = await Promise.all([
                  fetchCustomers(),
                  fetchServices(),
               ]);

               setCustomers(customersData);
               setServices(servicesData);

               // Set form data
               setFormData({
                  customer: typedAppointment.customer._id,
                  service: typedAppointment.service._id,
                  date: typedAppointment.date,
                  time: typedAppointment.time,
                  duration: typedAppointment.duration.toString(),
                  notes: typedAppointment.notes || "",
                  status: typedAppointment.status as AppointmentStatus,
               });
            }
         } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load appointment data");
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, [params.id, router]);

   const handleChange = (
      e: React.ChangeEvent<
         HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
   ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: value,
      }));
      if (formErrors[name]) {
         setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
      }
   };

   const validateForm = () => {
      const errors: any = {};
      if (!formData.customer) errors.customer = "Customer is required";
      if (!formData.service) errors.service = "Service is required";
      if (!formData.date) errors.date = "Date is required";
      if (!formData.time) errors.time = "Time is required";

      // Date validation
      if (formData.date) {
         const selectedDate = new Date(formData.date);
         const today = new Date();
         today.setHours(0, 0, 0, 0);
      }

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

         // Find selected service and customer
         const selectedService = services.find(
            (s) => s._id === formData.service
         );
         const selectedCustomer = customers.find(
            (c) => c._id === formData.customer
         );

         if (!selectedService || !selectedCustomer) {
            toast.error("Invalid service or customer selection");
            return;
         }

         const appointmentDate = new Date(`${formData.date}T${formData.time}`);
         const formattedData = {
            ...formData,
            duration: formData.duration.toString(),
            date: appointmentDate.toISOString(),
         };

         const appointmentData: AppointmentData = {
            customer: formattedData.customer,
            service: formattedData.service,
            date: formattedData.date,
            time: formattedData.time,
            duration: formattedData.duration,
            status: formattedData.status as AppointmentStatus,
            notes: formattedData.notes || "",
            customerInfo: {
               name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
               firstName: selectedCustomer.firstName,
               lastName: selectedCustomer.lastName,
            },
            serviceInfo: {
               name: selectedService.name,
            },
         };

         await updateAppointment(params.id, appointmentData);
         toast.success("Appointment updated successfully");
         router.push("/dashboard/appointments");
      } catch (error) {
         console.error("Error updating appointment:", error);
         toast.error("Failed to update appointment");
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
               Edit Appointment
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Customer <span className="text-pink-500">*</span>
                     </label>
                     <select
                        name="customer"
                        value={formData.customer}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg border focus:ring-1 focus:ring-gray-200 transition-colors ${
                           darkMode
                              ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                        }`}
                     >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                           <option key={customer._id} value={customer._id}>
                              {customer.firstName} {customer.lastName}
                           </option>
                        ))}
                     </select>
                     {formErrors.customer && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.customer}
                        </p>
                     )}
                  </div>

                  <div>
                     <label
                        className={`block mb-2 text-sm font-medium ${
                           darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                     >
                        Service <span className="text-pink-500">*</span>
                     </label>
                     <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
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
                     {formErrors.service && (
                        <p
                           className={`mt-1 text-sm ${
                              darkMode ? "text-red-400" : "text-red-500"
                           }`}
                        >
                           {formErrors.service}
                        </p>
                     )}
                  </div>
               </div>

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

               <div>
                  <label
                     className={`block mb-2 text-sm font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                     }`}
                  >
                     Duration <span className="text-pink-500">*</span>
                  </label>
                  <input
                     type="text"
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
                     <option value="Pending">Pending</option>
                     <option value="Confirmed">Confirmed</option>
                     <option value="Canceled">Canceled</option>
                  </select>
               </div>

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

               <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                     darkMode
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                  }`}
               >
                  {loading ? "Updating..." : "Update Appointment"}
               </button>
            </form>
         </div>
      </div>
   );
}
