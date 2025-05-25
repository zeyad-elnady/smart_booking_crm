"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Users, Bookmark, ClipboardList, UserPlus, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchCustomers } from "@/services/customerService";
import { fetchServices } from "@/services/serviceService";
import { createAppointment, fetchAppointments } from "@/services/appointmentService";
import { createCustomer } from "@/services/customerService";
import { useTheme } from "@/components/ThemeProvider";
import { appointmentAPI } from "@/services/api";
import { AppointmentData, AppointmentStatus, Appointment } from "@/types/appointment";
import DateTimeSelector from "@/components/DateTimeSelector";
import { getBusinessSettings, BusinessSettings } from "@/services/businessSettingsService";
import type { Customer } from "@/types/customer";
import type { Service } from "@/types/service";
import { useLanguage } from "@/context/LanguageContext";
import { format24To12 } from "@/utils/timeUtils";

// Add custom CSS for scrollbar visibility
const globalStyles = `
  /* Light mode scrollbar styles */
  .light-mode-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .light-mode-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .light-mode-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  .light-mode-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const FilterButton = ({ 
   label, 
   active, 
   onClick, 
   darkMode 
}: { 
   label: string; 
   active: boolean; 
   onClick: () => void; 
   darkMode: boolean;
}) => {
   return (
      <button
         type="button"
         onClick={(e) => {
            e.stopPropagation();
            onClick();
         }}
         className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            active
               ? `${darkMode ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-gradient-to-r from-purple-500 to-indigo-500"} text-white shadow-md`
               : darkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
         }`}
      >
         {label}
      </button>
   );
};

export default function AddAppointment() {
   const router = useRouter();
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [formData, setFormData] = useState({
      customerId: "",
      serviceId: "",
      date: "",
      time: "",
      status: "Pending",
      notes: "",
   });
   const [formErrors, setFormErrors] = useState<{
      customerId?: string;
      serviceId?: string;
      date?: string;
      time?: string;
      status?: string;
      notes?: string;
   }>({});
   const { darkMode } = useTheme();
   const { t } = useLanguage();
   const [mounted, setMounted] = useState(false);
   const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
   const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
   
   // Add state for customer search
   const [customerSearch, setCustomerSearch] = useState("");
   const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
   const [searchFilter, setSearchFilter] = useState<"all" | "id" | "name" | "phone">("all");
   
   // Calculate if date is valid (needed for time input)
   const isValidDate = useMemo(() => {
      if (!formData.date) return false;
      
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return selectedDate >= today;
   }, [formData.date]);
   
   // Filter customers based on search query and selected filter
   const filteredCustomers = useMemo(() => {
      if (!customerSearch.trim()) return customers;
      
      const searchLower = customerSearch.toLowerCase().trim();
      
      return customers.filter(customer => {
         switch (searchFilter) {
            case "id":
               return customer._id.toString().includes(searchLower);
            case "name":
               return customer.firstName.toLowerCase().includes(searchLower) ||
                     customer.lastName.toLowerCase().includes(searchLower) ||
                     `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower);
            case "phone":
               return customer.phone && customer.phone.toLowerCase().includes(searchLower);
            case "all":
            default:
               return customer._id.toString().includes(searchLower) ||
                     customer.firstName.toLowerCase().includes(searchLower) ||
                     customer.lastName.toLowerCase().includes(searchLower) ||
                     `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower) ||
                     (customer.phone && customer.phone.toLowerCase().includes(searchLower));
         }
      });
   }, [customers, customerSearch, searchFilter]);
   
   // New customer modal state
   const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
   const [newCustomerData, setNewCustomerData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+20", // Default Egypt country code
      address: "",
      notes: ""
   });
   const [customerLoading, setCustomerLoading] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   // Fetch customers, services, appointments, and business settings on component mount
   useEffect(() => {
      if (!mounted) return;
      
      const loadData = async () => {
         try {
            setLoading(true);
            setError(null);
            
            const [customersData, servicesData, appointmentsData, settingsData] = await Promise.all([
               fetchCustomers(),
               fetchServices(),
               fetchAppointments(), // Fetch all appointments to check availability
               getBusinessSettings(), // Fetch business settings
            ]);

            setCustomers(customersData);
            // Convert price to number for each service
            setServices(
               servicesData.map(service => ({
                  ...service,
                  price: Number(service.price),
               }))
            );
            setExistingAppointments(appointmentsData);
            setBusinessSettings(settingsData);
            
         } catch (error) {
            console.error("Error loading data:", error);
            toast.error(t("error_loading_data") || "Failed to load data");
            setError("Failed to load necessary data. Please try again.");
         } finally {
            setLoading(false);
         }
      };

      loadData();
   }, [mounted, t]);

   if (!mounted) return null;

   const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
   ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: value,
      }));
      // Clear error when field is edited
      const key = name as keyof typeof formErrors;
      if (formErrors[key]) {
         setFormErrors((prev: {
            customerId?: string;
            serviceId?: string;
            date?: string;
            time?: string;
            status?: string;
            notes?: string;
         }) => ({
            ...prev,
            [key]: undefined
         }));
      }
   };

   const handleNewCustomerChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
   ) => {
      const { name, value } = e.target;
      setNewCustomerData((prev) => ({
         ...prev,
         [name]: value,
      }));
   };

   const handleCreateNewCustomer = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!newCustomerData.firstName || !newCustomerData.lastName) {
         toast.error("First and last name are required");
         return;
      }
      
      setCustomerLoading(true);
      
      try {
         // Create the new customer
         const customer = await createCustomer({
            firstName: newCustomerData.firstName,
            lastName: newCustomerData.lastName,
            email: newCustomerData.email,
            phone: `${newCustomerData.countryCode} ${newCustomerData.phone}`,
            address: newCustomerData.address,
            notes: newCustomerData.notes
         });
         
         // Refresh the customer list
         const updatedCustomers = await fetchCustomers();
         setCustomers(updatedCustomers);
         
         // Select the newly created customer in the dropdown
         setFormData(prev => ({
            ...prev,
            customerId: customer._id,
         }));
         
         // Close the modal and reset form
         setShowNewCustomerModal(false);
         setNewCustomerData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            countryCode: "+20",
            address: "",
            notes: ""
         });
         
         toast.success("Customer created successfully");
      } catch (error) {
         console.error("Error creating customer:", error);
         toast.error("Failed to create customer");
      } finally {
         setCustomerLoading(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      // First validate the form
      if (!validateForm()) {
         // Remove the general error toast and rely on the field-specific error messages
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
            toast.error(t("customer_required") + " " + t("service_required"));
            setLoading(false);
            return;
         }

         // Process form data
         const appointmentData: AppointmentData = {
            customer: formData.customerId,
            service: formData.serviceId,
            date: formData.date,
            time: formData.time,
            duration: selectedService.duration,
            status: formData.status as AppointmentStatus,
            notes: formData.notes || "",
            // Add additional information to help with display
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

         console.log("Submitting appointment data:", appointmentData);
         
         await createAppointment(appointmentData);
         
         toast.success(t("success"));
         router.push("/dashboard/appointments");
      } catch (error) {
         console.error("Error creating appointment:", error);
         toast.error(t("error") || "Failed to create appointment");
      } finally {
         setLoading(false);
      }
   };

   const validateForm = () => {
      const errors: any = {};
      
      if (!formData.customerId) {
         errors.customerId = t("customer_required") || "Customer is required";
      }
      
      if (!formData.serviceId) {
         errors.serviceId = t("service_required") || "Service is required";
      }
      
      if (!formData.date) {
         errors.date = t("date_required") || "Date is required";
      } else if (!isValidDate) {
         errors.date = t("cannot_book_past") || "Cannot create appointments in the past";
      }
      
      if (!formData.time) {
         errors.time = t("time_required") || "Time is required";
      } else {
         // If the date is today, check if the time is in the past
         const today = new Date();
         const selectedDate = new Date(formData.date);
         
         if (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
         ) {
            // Parse the time (HH:MM format)
            const [hours, minutes] = formData.time.split(':').map(Number);
            const currentHours = today.getHours();
            const currentMinutes = today.getMinutes();
            
            // Convert both to minutes for easier comparison
            const selectedTimeInMinutes = (hours * 60) + minutes;
            const currentTimeInMinutes = (currentHours * 60) + currentMinutes;
            
            // Add buffer time from business settings (default to 15 minutes if not available)
            const bufferMinutes = businessSettings?.appointmentBuffer || 15;
            if (selectedTimeInMinutes <= currentTimeInMinutes + bufferMinutes) {
               errors.time = t("cannot_book_too_soon") || `Cannot book appointments in the past or within the next ${bufferMinutes} minutes`;
            }
         }
         
         // Check if this time slot is already booked
         const conflictingAppointment = existingAppointments.find(appointment => 
            appointment.date === formData.date && 
            appointment.time === formData.time
         );
         
         if (conflictingAppointment) {
            errors.time = t("time_slot_already_booked") || "This time slot is already booked";
         }
         
         // Check if the selected day is a day off
         if (businessSettings && formData.date) {
            const selectedDate = new Date(formData.date);
            const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            // Map day number to day name
            const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const dayName = dayNames[dayOfWeek];
            
            const dayConfig = businessSettings.daysOpen[dayName as keyof typeof businessSettings.daysOpen];
            if (!dayConfig?.open) {
               errors.date = t("day_off_selection") || "This day is not available for appointments";
            }
         }
      }
      
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
   };

   const reloadCustomers = async () => {
      try {
         const customersData = await fetchCustomers();
         setCustomers(customersData);
         toast.success("Customer list refreshed");
      } catch (error) {
         console.error("Error reloading customers:", error);
         toast.error("Failed to refresh customers");
      }
   };

   const reloadServices = async () => {
      try {
         const servicesData = await fetchServices();
         setServices(servicesData);
         toast.success("Service list refreshed");
      } catch (error) {
         console.error("Error reloading services:", error);
         toast.error("Failed to refresh services");
      }
   };

   const handleSelectCustomer = (customerId: string) => {
      setFormData(prev => ({
         ...prev,
         customerId
      }));
      setIsCustomerDropdownOpen(false);
   };

   // Add function to get selected customer name
   const getSelectedCustomerName = () => {
      const selected = customers.find(c => c._id === formData.customerId);
      return selected ? `${selected.firstName} ${selected.lastName}` : t("select_a_customer") || "Select a customer";
   };

   return (
      <>
         {/* Add global styles for scrollbar visibility */}
         <style jsx global>{globalStyles}</style>
         
         <div className={`min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 p-0 relative ${darkMode ? "" : "light-mode-scrollbar"}`}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>

            {/* Main content */}
            <div className="p-4 md:p-6 h-full">
               <button
                  onClick={() => router.push("/dashboard/appointments")}
                  className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
               >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>{t("back_to_appointments") || "Back to appointments"}</span>
               </button>

               {/* Form container taking full width */}
               <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl w-full">
                  <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                     {t("newAppointment") || "New Appointment"}
                  </h1>

                  <form onSubmit={handleSubmit} className="space-y-8 w-full">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div>
                           <label
                              htmlFor="customerId"
                              className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("customer")} <span className="text-red-500">*</span>
                           </label>
                           <div className="flex gap-2">
                              <div className="relative flex-grow">
                                 <Users className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                 <div 
                                    className={`w-full px-4 py-2 pl-10 border rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent cursor-pointer ${
                                       darkMode 
                                          ? "bg-gray-800/50 border-gray-700 text-white" 
                                          : "bg-white border-gray-300 text-gray-700"
                                    }`}
                                 >
                                    <div 
                                       className="flex justify-between items-center"
                                       onClick={() => setIsCustomerDropdownOpen(prev => !prev)}
                                    >
                                       <div className={formData.customerId ? (darkMode ? "text-white" : "text-gray-700") : "text-gray-400"}>
                                          {getSelectedCustomerName()}
                                       </div>
                                       <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                       </svg>
                                    </div>

                                    {isCustomerDropdownOpen && (
                                       <div className={`absolute left-0 right-0 mt-2 rounded-lg shadow-xl z-20 border backdrop-blur-md overflow-hidden ${
                                          darkMode 
                                             ? "bg-gray-900/95 border-gray-700" 
                                             : "bg-white/95 border-gray-200"
                                       }`}>
                                          <div className={`p-3 sticky top-0 ${darkMode ? "bg-gray-900" : "bg-white"} border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                                             <div className="relative">
                                                <svg 
                                                   className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} 
                                                   fill="none" 
                                                   stroke="currentColor" 
                                                   viewBox="0 0 24 24" 
                                                   xmlns="http://www.w3.org/2000/svg"
                                                >
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <input
                                                   type="text"
                                                   placeholder={t("search_customers") || "Search customers..."}
                                                   className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                                                      darkMode 
                                                         ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" 
                                                         : "bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-500"
                                                   }`}
                                                   value={customerSearch}
                                                   onChange={(e) => setCustomerSearch(e.target.value)}
                                                   onClick={(e) => e.stopPropagation()}
                                                />
                                             </div>
                                             
                                             <div className="flex flex-wrap gap-2 mt-3">
                                                <FilterButton 
                                                   label={t("all")} 
                                                   active={searchFilter === 'all'} 
                                                   onClick={() => setSearchFilter('all')} 
                                                   darkMode={darkMode} 
                                                />
                                                <FilterButton 
                                                   label={t("id")} 
                                                   active={searchFilter === 'id'} 
                                                   onClick={() => setSearchFilter('id')} 
                                                   darkMode={darkMode} 
                                                />
                                                <FilterButton 
                                                   label={t("name")} 
                                                   active={searchFilter === 'name'} 
                                                   onClick={() => setSearchFilter('name')} 
                                                   darkMode={darkMode} 
                                                />
                                                <FilterButton 
                                                   label={t("phone")} 
                                                   active={searchFilter === 'phone'} 
                                                   onClick={() => setSearchFilter('phone')} 
                                                   darkMode={darkMode} 
                                                />
                                             </div>
                                          </div>
                                          
                                          <div className={`max-h-60 overflow-y-auto custom-scrollbar ${darkMode ? "bg-gray-900/80" : "bg-white/80"}`}>
                                             {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map((customer) => (
                                                   <div
                                                      key={customer._id}
                                                      className={`px-4 py-3 cursor-pointer transition-colors border-b ${
                                                         darkMode 
                                                            ? "hover:bg-gray-800/70 border-gray-800" 
                                                            : "hover:bg-gray-50 border-gray-100"
                                                      }`}
                                                      onClick={() => handleSelectCustomer(customer._id)}
                                                   >
                                                      <div className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                                                         {customer.firstName} {customer.lastName}
                                                      </div>
                                                      <div className={`text-xs mt-1 flex justify-between ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                         <span>ID: {customer._id}</span>
                                                         {customer.phone && <span>{customer.phone}</span>}
                                                      </div>
                                                   </div>
                                                ))
                                             ) : (
                                                <div className={`px-4 py-5 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                   <svg 
                                                      className="mx-auto h-10 w-10 mb-2 opacity-60" 
                                                      fill="none" 
                                                      stroke="currentColor" 
                                                      viewBox="0 0 24 24" 
                                                      xmlns="http://www.w3.org/2000/svg"
                                                   >
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                   </svg>
                                                   <p>{t("no_customers_found") || "No customers found."}</p>
                                                   <p className="text-xs">{t("try_different_search") || "Try a different search term or filter."}</p>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                                 <input 
                                    type="hidden" 
                                    name="customerId" 
                                    id="customerId" 
                                    value={formData.customerId} 
                                    required 
                                 />
                              </div>
                              <button
                                 type="button"
                                 onClick={() => setShowNewCustomerModal(true)}
                                 className={`px-3 py-2 rounded-lg ${
                                    darkMode
                                       ? "bg-purple-600 hover:bg-purple-700"
                                       : "bg-purple-500 hover:bg-purple-600"
                                 } text-white transition-colors flex items-center`}
                              >
                                 <UserPlus className="w-5 h-5" />
                              </button>
                           </div>
                           {formErrors.customerId && (
                              <p className="mt-1 text-xs text-red-500">{formErrors.customerId}</p>
                           )}
                        </div>

                        <div>
                           <label
                              htmlFor="serviceId"
                              className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("service")} <span className="text-red-500">*</span>
                           </label>
                           <div className="relative">
                              <Bookmark className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                              <select
                                 id="serviceId"
                                 name="serviceId"
                                 value={formData.serviceId}
                                 onChange={handleChange}
                                 required
                                 className={`w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                    darkMode 
                                       ? "bg-gray-800/50 border-gray-700 text-white" 
                                       : "bg-white border-gray-300 text-gray-700"
                                 }`}
                              >
                                 <option value="">{t("select_service") || "Select a service"}</option>
                                 {services.map((service) => (
                                    <option key={service._id} value={service._id}>
                                       {service.name} (${service.price}) - {service.duration} {t("min")}
                                    </option>
                                 ))}
                              </select>
                           </div>
                           {formErrors.serviceId && (
                              <p className="mt-1 text-xs text-red-500">{formErrors.serviceId}</p>
                           )}
                        </div>

                        <div className="col-span-2">
                           <label
                              htmlFor="dateTime"
                              className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("date") + " & " + t("time")} <span className="text-red-500">*</span>
                           </label>
                           {loading ? (
                              <div className={`p-8 flex flex-col items-center justify-center border border-dashed rounded-lg ${
                                 darkMode ? "border-gray-700 bg-gray-800/30" : "border-gray-300 bg-gray-100/50"
                              }`}>
                                 <div className="w-12 h-12 border-4 border-t-transparent border-purple-500 rounded-full animate-spin mb-4"></div>
                                 <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                                    {t("loading_business_settings")}
                                 </p>
                              </div>
                           ) : formData.serviceId ? (
                              <DateTimeSelector
                                 selectedService={services.find(s => s._id === formData.serviceId) || null}
                                 existingAppointments={existingAppointments}
                                 selectedDate={formData.date}
                                 selectedTime={formData.time}
                                 onSelect={(date, time) => {
                                    // Update the form data without submitting
                                    setFormData(prev => ({
                                       ...prev,
                                       date,
                                       time
                                    }));
                                    // Clear errors when selection is made
                                    if (formErrors.date || formErrors.time) {
                                       setFormErrors((prev: {
                                          customerId?: string;
                                          serviceId?: string;
                                          date?: string;
                                          time?: string;
                                          status?: string;
                                          notes?: string;
                                       }) => ({
                                          ...prev,
                                          date: undefined,
                                          time: undefined
                                       }));
                                    }
                                    
                                    // Update toast message to guide user to the next step
                                    const dateObj = new Date(date);
                                    const dateOptions: Intl.DateTimeFormatOptions = { 
                                       weekday: 'long', 
                                       year: 'numeric', 
                                       month: 'long', 
                                       day: 'numeric'
                                    };
                                    const formattedDate = dateObj.toLocaleDateString(undefined, dateOptions);
                                    toast.success(`${t("time_selected") || "Time selected"}: ${formattedDate} ${t("at")} ${format24To12(time)}`);
                                 }}
                              />
                           ) : (
                              <div className={`p-8 flex flex-col items-center justify-center border border-dashed rounded-lg ${
                                 darkMode ? "border-gray-700 bg-gray-800/30" : "border-gray-300 bg-gray-100/50"
                              }`}>
                                 <Calendar size={48} className={`mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                                 <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    {t("choose_service_first")}
                                 </p>
                              </div>
                           )}
                           {formErrors.date && (
                              <p className="mt-1 text-xs text-red-500">{formErrors.date}</p>
                           )}
                           {formErrors.time && (
                              <p className="mt-1 text-xs text-red-500">{formErrors.time}</p>
                           )}
                        </div>

                        <div>
                           <label
                              htmlFor="status"
                              className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("status")} <span className="text-red-500">*</span>
                           </label>
                           <select
                              id="status"
                              name="status"
                              value={formData.status}
                              onChange={handleChange}
                              required
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                 darkMode 
                                    ? "bg-gray-800/50 border-gray-700 text-white" 
                                    : "bg-white border-gray-300 text-gray-700"
                              }`}
                           >
                              <option value="Pending">{t("pending")}</option>
                              <option value="Confirmed">{t("confirmed")}</option>
                              <option value="Completed">{t("completed")}</option>
                              <option value="Canceled">{t("canceled")}</option>
                           </select>
                        </div>
                     </div>

                     <div>
                        <label
                           htmlFor="notes"
                           className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                           {t("notes")}
                        </label>
                        <div className="relative">
                           <ClipboardList className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                           <textarea
                              id="notes"
                              name="notes"
                              rows={4}
                              value={formData.notes}
                              onChange={handleChange}
                              className={`w-full px-4 py-2 pl-10 rounded-lg border shadow-sm focus:ring-2 focus:ring-purple-500/20 resize-none ${
                                 darkMode 
                                    ? "border-white/10 bg-gray-800/50 text-white focus:border-purple-500" 
                                    : "border-gray-300 bg-white text-gray-700 focus:border-purple-400"
                              }`}
                              placeholder="Any additional information about the appointment..."
                           />
                        </div>
                     </div>

                     <div className="flex justify-end space-x-3">
                        <button
                           type="button"
                           onClick={() => router.push("/dashboard/appointments")}
                           className="px-6 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                        >
                           {t("cancel")}
                        </button>
                        <button
                           type="submit"
                           disabled={loading}
                           className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                           {loading ? t("creating") : t("create_appointment")}
                        </button>
                     </div>
                  </form>
               </div>
            </div>

            {/* New Customer Modal */}
            {showNewCustomerModal && (
               <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className={`rounded-xl p-6 max-w-md w-full shadow-xl ${darkMode ? "bg-gray-900" : "bg-white"} max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                     <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                           {t("add_new_customer")}
                        </h2>
                        <button
                           onClick={() => setShowNewCustomerModal(false)}
                           className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     <form onSubmit={handleCreateNewCustomer} className="space-y-4">
                        <div>
                           <label
                              htmlFor="firstName"
                              className={`block mb-1 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("first_name")} <span className="text-red-500">*</span>
                           </label>
                           <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={newCustomerData.firstName}
                              onChange={handleNewCustomerChange}
                              required
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                 darkMode 
                                    ? "bg-gray-800/50 border-gray-700 text-white" 
                                    : "bg-white border-gray-300 text-gray-700"
                              }`}
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="lastName"
                              className={`block mb-1 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("last_name")} <span className="text-red-500">*</span>
                           </label>
                           <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={newCustomerData.lastName}
                              onChange={handleNewCustomerChange}
                              required
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                 darkMode 
                                    ? "bg-gray-800/50 border-gray-700 text-white" 
                                    : "bg-white border-gray-300 text-gray-700"
                              }`}
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="email"
                              className={`block mb-1 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("email")}
                           </label>
                           <input
                              type="email"
                              id="email"
                              name="email"
                              value={newCustomerData.email}
                              onChange={handleNewCustomerChange}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                 darkMode 
                                    ? "bg-gray-800/50 border-gray-700 text-white" 
                                    : "bg-white border-gray-300 text-gray-700"
                              }`}
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="phone"
                              className={`block mb-1 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("phone")}
                           </label>
                           <div className="flex space-x-3">
                              <div className="w-1/3">
                                 <select
                                    id="countryCode"
                                    name="countryCode"
                                    value={newCustomerData.countryCode}
                                    onChange={handleNewCustomerChange}
                                    className={`w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                       darkMode 
                                          ? "bg-gray-800/50 border-gray-700 text-white" 
                                          : "bg-white border-gray-300 text-gray-700"
                                    } h-10 appearance-none bg-no-repeat bg-right pr-6 text-sm`}
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E\")", backgroundSize: "1rem", backgroundPosition: "right 0.5rem center" }}
                                 >
                                    <option value="+20">Egypt (+20)</option>
                                    <option value="+1">USA (+1)</option>
                                    <option value="+44">UK (+44)</option>
                                    <option value="+971">UAE (+971)</option>
                                    <option value="+966">KSA (+966)</option>
                                    <option value="+49">DE (+49)</option>
                                    <option value="+33">FR (+33)</option>
                                 </select>
                              </div>
                              <div className="w-2/3">
                                 <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={newCustomerData.phone}
                                    onChange={handleNewCustomerChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                       darkMode 
                                          ? "bg-gray-800/50 border-gray-700 text-white" 
                                          : "bg-white border-gray-300 text-gray-700"
                                    }`}
                                    placeholder={t("enter_phone_number")}
                                 />
                              </div>
                           </div>
                        </div>

                        <div>
                           <label
                              htmlFor="address"
                              className={`block mb-1 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("address_optional")}
                           </label>
                           <textarea
                              id="address"
                              name="address"
                              rows={2}
                              value={newCustomerData.address}
                              onChange={handleNewCustomerChange}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                 darkMode 
                                    ? "bg-gray-800/50 border-gray-700 text-white" 
                                    : "bg-white border-gray-300 text-gray-700"
                              }`}
                              placeholder="Customer's address"
                           />
                        </div>

                        <div>
                           <label
                              htmlFor="customerNotes"
                              className={`block mb-1 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                           >
                              {t("notes_optional")}
                           </label>
                           <textarea
                              id="customerNotes"
                              name="notes"
                              rows={3}
                              value={newCustomerData.notes}
                              onChange={handleNewCustomerChange}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                 darkMode 
                                    ? "bg-gray-800/50 border-gray-700 text-white" 
                                    : "bg-white border-gray-300 text-gray-700"
                              }`}
                              placeholder={t("customer_additional_info")}
                           />
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                           <button
                              type="button"
                              onClick={() => setShowNewCustomerModal(false)}
                              className={`px-4 py-2 rounded-lg ${
                                 darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"
                              } hover:opacity-90`}
                           >
                              {t("cancel")}
                           </button>
                           <button
                              type="submit"
                              disabled={customerLoading}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:ring-2 focus:ring-purple-500 transition"
                           >
                              {customerLoading ? t("creating_customer") : t("create_customer")}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            )}
         </div>
      </>
   );
}
