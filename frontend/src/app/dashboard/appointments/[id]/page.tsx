"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import React from "react";

import {
   fetchAppointmentById,
   updateAppointment,
} from "@/services/appointmentService";
import { fetchCustomers } from "@/services/customerService";
import { fetchServices } from "@/services/serviceService";
import type { Customer } from "@/types/customer";
import type { Service } from "@/types/service";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

interface EditAppointmentProps {
   params: Promise<{ id: string }>;
}

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
   duration: string;
   notes: string;
   status: AppointmentStatus;
}

const EditAppointment = ({ params }: EditAppointmentProps) => {
   const router = useRouter();
   const { darkMode } = useTheme();
   const id = React.use(params).id;

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
            const appointment = await fetchAppointmentById(id);
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
               setValue("duration", typedAppointment.duration.toString());
               setValue("notes", typedAppointment.notes || "");
               setValue("status", typedAppointment.status as AppointmentStatus);
            } else {
               throw new Error("Appointment not found");
            }
         } catch (error) {
            toast.error("Error loading appointment");
            console.error("Error loading appointment:", error);
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, [id, setValue]);

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
            },
         };

         await updateAppointment(id, appointmentData);
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
      return <div>Loading...</div>;
   }

   return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
         <div className="space-y-4">
            <div>
               <label htmlFor="customer" className="block text-sm font-medium">
                  Customer
               </label>
               <select
                  id="customer"
                  {...register("customer", {
                     required: "Customer is required",
                  })}
                  className={`mt-1 block w-full rounded-md ${
                     darkMode ? "bg-gray-800" : "bg-white"
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
                  <p className="text-red-500 text-sm">
                     {errors.customer.message}
                  </p>
               )}
            </div>

            <div>
               <label htmlFor="service" className="block text-sm font-medium">
                  Service
               </label>
               <select
                  id="service"
                  {...register("service", { required: "Service is required" })}
                  className={`mt-1 block w-full rounded-md ${
                     darkMode ? "bg-gray-800" : "bg-white"
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
                  <p className="text-red-500 text-sm">
                     {errors.service.message}
                  </p>
               )}
            </div>

            <div>
               <label htmlFor="date" className="block text-sm font-medium">
                  Date
               </label>
               <input
                  type="date"
                  id="date"
                  {...register("date", { required: "Date is required" })}
                  className={`mt-1 block w-full rounded-md ${
                     darkMode ? "bg-gray-800" : "bg-white"
                  }`}
               />
               {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date.message}</p>
               )}
            </div>

            <div>
               <label htmlFor="time" className="block text-sm font-medium">
                  Time
               </label>
               <input
                  type="time"
                  id="time"
                  {...register("time", { required: "Time is required" })}
                  className={`mt-1 block w-full rounded-md ${
                     darkMode ? "bg-gray-800" : "bg-white"
                  }`}
               />
               {errors.time && (
                  <p className="text-red-500 text-sm">{errors.time.message}</p>
               )}
            </div>

            <div>
               <label htmlFor="duration" className="block text-sm font-medium">
                  Duration (minutes)
               </label>
               <input
                  type="number"
                  id="duration"
                  {...register("duration", {
                     required: "Duration is required",
                  })}
                  className={`mt-1 block w-full rounded-md ${
                     darkMode ? "bg-gray-800" : "bg-white"
                  }`}
               />
               {errors.duration && (
                  <p className="text-red-500 text-sm">
                     {errors.duration.message}
                  </p>
               )}
            </div>

            <div>
               <label htmlFor="status" className="block text-sm font-medium">
                  Status
               </label>
               <select
                  id="status"
                  {...register("status", { required: "Status is required" })}
                  className={`mt-1 block w-full rounded-md ${
                     darkMode ? "bg-gray-800" : "bg-white"
                  }`}
               >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
               </select>
               {errors.status && (
                  <p className="text-red-500 text-sm">
                     {errors.status.message}
                  </p>
               )}
            </div>

            <div>
               <label htmlFor="notes" className="block text-sm font-medium">
                  Notes
               </label>
               <textarea
                  id="notes"
                  {...register("notes")}
                  className={`mt-1 block w-full rounded-md ${
                     darkMode ? "bg-gray-800" : "bg-white"
                  }`}
               />
            </div>
         </div>

         <div className="flex justify-end space-x-4">
            <button
               type="button"
               onClick={() => router.back()}
               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
               Cancel
            </button>
            <button
               type="submit"
               disabled={loading}
               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
               {loading ? "Updating..." : "Update Appointment"}
            </button>
         </div>
      </form>
   );
};

export default EditAppointment;
