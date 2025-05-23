"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import React from "react";
import DateTimeSelector from "@/components/DateTimeSelector";
import { businessSettings, serviceAvailability } from "@/config/settings";

import {
   fetchAppointmentById,
   updateAppointment,
} from "@/services/appointmentService";
import { fetchCustomers } from "@/services/customerService";
import { fetchServices } from "@/services/serviceService";
import type { Customer } from "@/types/customer";
import type { Service } from "@/types/service";
import type { Appointment, AppointmentStatus, AppointmentData } from "@/types/appointment";

// Define the response type that includes populated fields
interface AppointmentResponse
   extends Omit<Appointment, "customer" | "service"> {
   customer: Customer;
   service: Service;
   status: AppointmentStatus;
}

interface FormData {
   customer: string;
   service: string;
   date: string;
   time: string;
   notes: string;
   status: AppointmentStatus;
}

export default function EditAppointment() {
   const router = useRouter();
   const params = useParams();
   const { darkMode } = useTheme();
   const appointmentId = params?.id as string;

   const {
      register,
      handleSubmit,
      watch,
      setValue,
      formState: { errors }
   } = useForm<FormData>({
      defaultValues: {
         customer: '',
         service: '',
         date: '',
         time: '',
         notes: '',
         status: 'Pending'
      }
   });

   const [loading, setLoading] = useState(false);
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
   const [showSMSOptions, setShowSMSOptions] = useState(false);
   const [selectedDate, setSelectedDate] = useState<string | null>(null);
   const [selectedTime, setSelectedTime] = useState<string | null>(null);

   const watchCustomer = watch("customer");
   const watchService = watch("service");

   useEffect(() => {
      const loadData = async () => {
         setLoading(true);
         try {
            const appointment = await fetchAppointmentById(appointmentId);
            if (appointment) {
               console.log("Loaded appointment data:", appointment);
               // Store the appointment data
               setAppointment(appointment as unknown as AppointmentResponse);

               // Load customers and services
               const [customersData, servicesData] = await Promise.all([
                  fetchCustomers(),
                  fetchServices(),
               ]);

               setCustomers(customersData);
               setServices(servicesData);

               // Get customer ID safely whether it's a string or object
               const customerId = typeof appointment.customer === 'object' 
                  ? (appointment.customer as Customer)._id 
                  : appointment.customer;
               
               // Get service ID safely whether it's a string or object
               const serviceId = typeof appointment.service === 'object'
                  ? (appointment.service as Service)._id
                  : appointment.service;

               // Set form values
               setValue("customer", customerId);
               setValue("service", serviceId);
               setValue("date", appointment.date);
               setValue("time", appointment.time);
               setSelectedDate(appointment.date);
               setSelectedTime(appointment.time);
               setValue("notes", appointment.notes || "");
               setValue("status", appointment.status as AppointmentStatus);
               
               console.log("Form values set:", {
                  customer: customerId,
                  service: serviceId,
                  date: appointment.date,
                  time: appointment.time
               });
            } else {
               throw new Error("Appointment not found");
            }
         } catch (error) {
            toast.error("Could not load appointment data");
            console.error("Error loading appointment:", error);
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, [appointmentId, setValue]);

   const onSubmit = handleSubmit(async (data: FormData) => {
      setLoading(true);

      try {
         // Find selected service and customer
         const selectedService = services.find(s => s._id === data.service);
         const selectedCustomer = customers.find(c => c._id === data.customer);

         if (!selectedService || !selectedCustomer) {
            toast.error("Invalid service or customer selection");
            return;
         }

         const appointmentDate = new Date(`${data.date}T${data.time}`);

         const appointmentData: AppointmentData = {
            customer: data.customer,
            service: data.service,
            date: appointmentDate.toISOString(),
            time: data.time,
            duration: selectedService.duration || "30",
            notes: data.notes,
            status: data.status as AppointmentStatus,
            customerInfo: {
               name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
               firstName: selectedCustomer.firstName,
               lastName: selectedCustomer.lastName
            },
            serviceInfo: {
               name: selectedService.name || '',
               price: selectedService.price || 0,
               duration: selectedService.duration || ''
            }
         };

         // Use the updateAppointment function from appointmentService
         const updatedAppointment = await updateAppointment(appointmentId, appointmentData);
         console.log("Appointment updated successfully:", updatedAppointment);

         toast.success("Appointment updated successfully");
         router.push("/dashboard/appointments");
      } catch (error) {
         console.error("Error updating appointment:", error);
         toast.error("Failed to update appointment");
      } finally {
         setLoading(false);
      }
   });

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center space-x-2">
               <div className="h-5 w-5 bg-purple-500 rounded-full animate-pulse"></div>
               <span className={`${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  Loading appointment data...
               </span>
            </div>
         </div>
      );
   }

   return (
      <div className={`min-h-screen bg-gradient-to-br ${darkMode ? 'from-gray-900 via-purple-900/30 to-gray-900' : 'from-gray-50 via-purple-100/30 to-gray-50'} p-6`}>
         <button
            onClick={() => router.push("/dashboard/appointments")}
            className={`inline-flex items-center text-base ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-opacity mb-8`}
            >
               <span className="text-xl mr-1">←</span> Back to appointments
         </button>

         <div className="flex justify-between items-center mb-8">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
               Edit Appointment
            </h1>
         </div>

            <form onSubmit={onSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Customer *
                     </label>
                     <select
                        {...register("customer", {
                           required: "Customer is required",
                        })}
                     className={`w-full px-4 py-2 ${darkMode ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                     >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                           <option key={customer._id} value={customer._id}>
                              {customer.firstName} {customer.lastName}
                           </option>
                        ))}
                     </select>
                     {errors.customer && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.customer.message}
                        </p>
                     )}
                  </div>

                  <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Service *
                     </label>
                     <select
                        {...register("service", {
                           required: "Service is required",
                        })}
                     className={`w-full px-4 py-2 ${darkMode ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                     >
                        <option value="">Select a service</option>
                        {services.map((service) => (
                           <option key={service._id} value={service._id}>
                              {service.name}
                           </option>
                        ))}
                     </select>
                     {errors.service && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.service.message}
                        </p>
                     )}
                  </div>

                  <div className="col-span-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Date & Time *
                     </label>
                     {watchService ? (
                        <DateTimeSelector
                           selectedService={services.find(s => s._id === watchService) || null}
                           existingAppointments={appointment ? [appointment as unknown as Appointment] : []}
                           onSelect={(date, time) => {
                              setValue("date", date, { shouldValidate: true });
                              setValue("time", time, { shouldValidate: true });
                              setSelectedDate(date);
                              setSelectedTime(time);
                           }}
                        />
                     ) : (
                        <div className={`p-8 flex flex-col items-center justify-center border border-dashed rounded-lg ${
                           darkMode ? "border-gray-700 bg-gray-800/30" : "border-gray-300 bg-gray-100/50"
                        }`}>
                           <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Please select a service first to view available dates and times
                           </p>
                        </div>
                     )}
                     {errors.date && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.date.message}
                        </p>
                     )}
                     {errors.time && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.time.message}
                        </p>
                     )}
                     
                     {/* Hidden inputs to store the selected values */}
                     <input type="hidden" {...register("date", { 
                        required: "Date is required",
                        validate: {
                           notInPast: (value) => {
                              const selectedDate = new Date(value);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return selectedDate >= today || "Cannot set appointments to dates in the past";
                           }
                        }
                     })} />
                     <input type="hidden" {...register("time", { required: "Time is required" })} />
                  </div>

                  <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Status *
                     </label>
                     <select
                     {...register("status", { required: "Status is required" })}
                     className={`w-full px-4 py-2 ${darkMode ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                     >
                     <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                     <option value="Canceled">Canceled</option>
                     </select>
                     {errors.status && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.status.message}
                        </p>
                     )}
                  </div>
               </div>

               <div>
               <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                     Notes
                  </label>
                  <textarea
                     {...register("notes")}
                     rows={4}
                     placeholder="Any additional information about the appointment..."
                  className={`w-full px-4 py-2 ${darkMode ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
                  />
               </div>

               <div className="flex justify-end space-x-3 pt-4">
                  <button
                     type="button"
                     onClick={() => router.push("/dashboard/appointments")}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'} transition`}
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                  {loading ? "Updating..." : "Save Changes"}
                  </button>
               </div>
            </form>
      </div>
   );
}
