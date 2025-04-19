"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import React from "react";
import Link from "next/link";

import {
   fetchAppointmentById,
   updateAppointment,
} from "@/services/appointmentService";
import { fetchCustomers } from "@/services/customerService";
import { fetchServices } from "@/services/serviceService";
import type { Customer } from "@/types/customer";
import type { Service } from "@/types/service";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

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
      setValue,
      formState: { errors },
   } = useForm<FormData>();

   const [loading, setLoading] = useState(false);
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [services, setServices] = useState<Service[]>([]);

   useEffect(() => {
      const loadData = async () => {
         setLoading(true);
         try {
            const appointment = await fetchAppointmentById(appointmentId);
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

               // Set form values
               setValue("customer", typedAppointment.customer._id);
               setValue("service", typedAppointment.service._id);
               setValue("date", typedAppointment.date);
               setValue("time", typedAppointment.time);
               setValue("notes", typedAppointment.notes || "");
               setValue("status", typedAppointment.status as AppointmentStatus);
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

   const onSubmit = async (data: FormData) => {
      try {
         setLoading(true);

         // Find selected service and customer
         const selectedService = services.find((s) => s._id === data.service);
         const selectedCustomer = customers.find(
            (c) => c._id === data.customer
         );

         if (!selectedService || !selectedCustomer) {
            toast.error("Invalid service or customer selection");
            return;
         }

         const appointmentDate = new Date(`${data.date}T${data.time}`);

         const appointmentData = {
            ...data,
            date: appointmentDate.toISOString(),
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

         await updateAppointment(appointmentId, appointmentData);
         toast.success("Appointment updated successfully");
         router.push("/dashboard/appointments");
      } catch (error) {
         toast.error("Error updating appointment");
         console.error("Error updating appointment:", error);
      } finally {
         setLoading(false);
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div
               className={`text-lg ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Loading...
            </div>
         </div>
      );
   }

   return (
      <div className="container mx-auto p-6">
         <div className="mb-6">
            <Link
               href="/dashboard/appointments"
               className={`inline-flex items-center text-base hover:opacity-75 transition-opacity ${
                  darkMode ? "text-gray-300" : "text-gray-600"
               }`}
            >
               <span className="text-xl mr-1">←</span> Back to appointments
            </Link>
         </div>

         <div
            className={`p-6 rounded-lg ${
               darkMode ? "glass-dark" : "glass-light"
            }`}
         >
            <h1
               className={`text-3xl font-bold mb-8 ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Edit Appointment
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label
                        className={`block text-sm mb-2 ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Customer *
                     </label>
                     <select
                        {...register("customer", {
                           required: "Customer is required",
                        })}
                        className={`w-full px-4 py-2 rounded-md border ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                        }`}
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
                     <label
                        className={`block text-sm mb-2 ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Service *
                     </label>
                     <select
                        {...register("service", {
                           required: "Service is required",
                        })}
                        className={`w-full px-4 py-2 rounded-md border ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                        }`}
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

                  <div>
                     <label
                        className={`block text-sm mb-2 ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Date *
                     </label>
                     <input
                        type="date"
                        {...register("date", { required: "Date is required" })}
                        className={`w-full px-4 py-2 rounded-md border ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                        }`}
                     />
                     {errors.date && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.date.message}
                        </p>
                     )}
                  </div>

                  <div>
                     <label
                        className={`block text-sm mb-2 ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Time *
                     </label>
                     <input
                        type="time"
                        {...register("time", { required: "Time is required" })}
                        className={`w-full px-4 py-2 rounded-md border ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                        }`}
                     />
                     {errors.time && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.time.message}
                        </p>
                     )}
                  </div>

                  <div>
                     <label
                        className={`block text-sm mb-2 ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Status *
                     </label>
                     <select
                        {...register("status", {
                           required: "Status is required",
                        })}
                        className={`w-full px-4 py-2 rounded-md border ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                        }`}
                     >
                        <option value="Waiting">Waiting</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                     </select>
                     {errors.status && (
                        <p className="text-red-500 text-sm mt-1">
                           {errors.status.message}
                        </p>
                     )}
                  </div>
               </div>

               <div>
                  <label
                     className={`block text-sm mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                     }`}
                  >
                     Notes
                  </label>
                  <textarea
                     {...register("notes")}
                     rows={4}
                     placeholder="Any additional information about the appointment..."
                     className={`w-full px-4 py-2 rounded-md border ${
                        darkMode
                           ? "bg-gray-800/50 border-gray-700 text-white"
                           : "bg-white border-gray-300 text-gray-900"
                     }`}
                  />
               </div>

               <div className="flex justify-end space-x-3 pt-4">
                  <button
                     type="button"
                     onClick={() => router.push("/dashboard/appointments")}
                     className={`px-4 py-2 rounded-md ${
                        darkMode
                           ? "bg-gray-700 text-white hover:bg-gray-600"
                           : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                     }`}
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                     Save Changes
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
