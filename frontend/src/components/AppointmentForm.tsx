"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
   customerAPI,
   serviceAPI,
   Customer,
   Service
} from "@/services/api";
import { AppointmentData } from "@/types/appointment";
import { format24To12, format12To24 } from "@/utils/timeUtils";

interface AppointmentFormProps {
   isOpen: boolean;
   onClose: () => void;
   onSubmit: (data: AppointmentData) => void;
   initialData?: Partial<AppointmentData>;
}

const defaultFormData: AppointmentData = {
   customer: "",
   service: "",
   date: "",
   time: "",
   duration: "",
   notes: "",
   status: "Pending",
};

export default function AppointmentForm({
   isOpen,
   onClose,
   onSubmit,
   initialData,
}: AppointmentFormProps) {
   const [formData, setFormData] = useState<AppointmentData>({
      ...defaultFormData,
      ...initialData,
   });

   const [customers, setCustomers] = useState<Customer[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [validationErrors, setValidationErrors] = useState<
      Record<string, string>
   >({});

   // Fetch customers and services when the form opens
   useEffect(() => {
      if (!isOpen) return;

      const fetchData = async () => {
         setLoading(true);
         setError(null);

         try {
            console.log("Fetching customers and services for appointment form...");
            
            // Fetch customers
            try {
               const customersData = await customerAPI.getCustomers();
               console.log(`Successfully loaded ${customersData.length} customers:`, 
                  customersData.map(c => `${c.firstName} ${c.lastName} (${c._id})`));
               setCustomers(customersData);
            } catch (customerError) {
               console.error("Error fetching customers:", customerError);
               setError("Failed to load customers. Please check the console for details.");
            }

            // Fetch services
            try {
               const servicesData = await serviceAPI.getServices();
               console.log(`Successfully loaded ${servicesData.length} services:`, 
                  servicesData.map((s: Service) => `${s.name} (${s._id})`));
               setServices(servicesData);
            } catch (serviceError) {
               console.error("Error fetching services:", serviceError);
               setError("Failed to load services. Please check the console for details.");
            }
         } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load customers or services. Please try again.");
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [isOpen]);

   const validateForm = () => {
      const errors: Record<string, string> = {};
      if (!formData.customer) errors.customer = "Customer is required";
      if (!formData.service) errors.service = "Service is required";
      if (!formData.date) errors.date = "Date is required";
      if (!formData.time) errors.time = "Time is required";
      if (!formData.duration) errors.duration = "Duration is required";
      if (!formData.status) errors.status = "Status is required";

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
         return;
      }

      try {
         // Format the date to ISO string for the backend
         const [hours, minutes] = formData.time.split(":");
         const appointmentDate = new Date(formData.date);
         appointmentDate.setHours(parseInt(hours), parseInt(minutes));

         const formattedData = {
            ...formData,
            date: appointmentDate.toISOString(),
         };

         onSubmit(formattedData);
         onClose();
      } catch (err) {
         console.error("Error formatting appointment data:", err);
         setError("Invalid date or time format");
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
         <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b">
               <h2 className="text-lg font-medium text-gray-900">
                  {initialData ? "Edit Appointment" : "New Appointment"}
               </h2>
               <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={onClose}
               >
                  <XMarkIcon className="h-6 w-6" />
               </button>
            </div>

            {error && (
               <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  <p>{error}</p>
               </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
               {loading ? (
                  <div className="text-center py-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                     <p className="mt-2 text-sm text-gray-600">Loading...</p>
                  </div>
               ) : (
                  <>
                     <div>
                        <label
                           htmlFor="customer"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Customer
                        </label>
                        <select
                           id="customer"
                           name="customer"
                           value={formData.customer}
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 customer: e.target.value,
                              })
                           }
                           className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              validationErrors.customer ? "border-red-500" : ""
                           }`}
                           required
                        >
                           <option value="">Select a customer</option>
                           {customers.map((customer) => (
                              <option key={customer._id} value={customer._id}>
                                 {customer.firstName} {customer.lastName} (
                                 {customer.email})
                              </option>
                           ))}
                        </select>
                        {validationErrors.customer && (
                           <p className="mt-1 text-sm text-red-600">
                              {validationErrors.customer}
                           </p>
                        )}
                     </div>

                     <div>
                        <label
                           htmlFor="service"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Service
                        </label>
                        <select
                           id="service"
                           name="service"
                           value={formData.service}
                           onChange={(e) => {
                              const selectedService = services.find(
                                 (s) => s._id === e.target.value
                              );
                              setFormData({
                                 ...formData,
                                 service: e.target.value,
                                 duration:
                                    selectedService?.duration ||
                                    formData.duration,
                              });
                           }}
                           className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              validationErrors.service ? "border-red-500" : ""
                           }`}
                           required
                        >
                           <option value="">Select a service</option>
                           {services.map((service) => (
                              <option key={service._id} value={service._id}>
                                 {service.name} ({service.duration}, $
                                 {service.price})
                              </option>
                           ))}
                        </select>
                        {validationErrors.service && (
                           <p className="mt-1 text-sm text-red-600">
                              {validationErrors.service}
                           </p>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label
                              htmlFor="date"
                              className="block text-sm font-medium text-gray-700"
                           >
                              Date
                           </label>
                           <input
                              type="date"
                              id="date"
                              name="date"
                              value={formData.date}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    date: e.target.value,
                                 })
                              }
                              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                                 validationErrors.date ? "border-red-500" : ""
                              }`}
                              required
                           />
                           {validationErrors.date && (
                              <p className="mt-1 text-sm text-red-600">
                                 {validationErrors.date}
                              </p>
                           )}
                        </div>

                        <div>
                           <label
                              htmlFor="time"
                              className="block text-sm font-medium text-gray-700"
                           >
                              Time
                           </label>
                           <input
                              type="time"
                              id="time"
                              name="time"
                              value={formData.time}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    time: e.target.value,
                                 })
                              }
                              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                                 validationErrors.time ? "border-red-500" : ""
                              }`}
                              required
                           />
                           {formData.time && (
                              <div className="mt-1 text-xs text-gray-500">
                                 {format24To12(formData.time)}
                              </div>
                           )}
                           {validationErrors.time && (
                              <p className="mt-1 text-sm text-red-600">
                                 {validationErrors.time}
                              </p>
                           )}
                        </div>
                     </div>

                     <div>
                        <label
                           htmlFor="duration"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Duration
                        </label>
                        <select
                           id="duration"
                           name="duration"
                           value={formData.duration}
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 duration: e.target.value,
                              })
                           }
                           className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              validationErrors.duration ? "border-red-500" : ""
                           }`}
                           required
                        >
                           <option value="">Select duration</option>
                           <option value="30 min">30 minutes</option>
                           <option value="45 min">45 minutes</option>
                           <option value="60 min">1 hour</option>
                           <option value="90 min">1.5 hours</option>
                           <option value="120 min">2 hours</option>
                        </select>
                        {validationErrors.duration && (
                           <p className="mt-1 text-sm text-red-600">
                              {validationErrors.duration}
                           </p>
                        )}
                     </div>

                     <div>
                        <label
                           htmlFor="notes"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Notes (Optional)
                        </label>
                        <textarea
                           id="notes"
                           name="notes"
                           rows={3}
                           value={formData.notes}
                           onChange={(e) =>
                              setFormData({
                                 ...formData,
                                 notes: e.target.value,
                              })
                           }
                           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                     </div>

                     <div>
                        <label
                           htmlFor="status"
                           className="block text-sm font-medium text-gray-700"
                        >
                           Status
                        </label>
                        <div className="mt-2">
                           <select
                              id="status"
                              name="status"
                              className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 ${
                                 validationErrors.status ? "ring-red-500" : ""
                              }`}
                              value={formData.status}
                              onChange={(e) =>
                                 setFormData({
                                    ...formData,
                                    status: e.target
                                       .value as AppointmentData["status"],
                                 })
                              }
                           >
                              <option value="">Select a status</option>
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Canceled">Canceled</option>
                           </select>
                           {validationErrors.status && (
                              <p className="mt-2 text-sm text-red-600">
                                 {validationErrors.status}
                              </p>
                           )}
                        </div>
                     </div>

                     <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                           type="button"
                           onClick={onClose}
                           className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                           Cancel
                        </button>
                        <button
                           type="submit"
                           className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                           {initialData ? "Update" : "Create"}
                        </button>
                     </div>
                  </>
               )}
            </form>
         </div>
      </div>
   );
}
