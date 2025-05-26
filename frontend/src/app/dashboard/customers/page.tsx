"use client";

import { useState, useEffect } from "react";
import {
   ArrowPathIcon,
   UserPlusIcon,
   PhoneIcon,
   PencilIcon,
   TrashIcon,
   MagnifyingGlassIcon,
   XCircleIcon,
   AdjustmentsHorizontalIcon,
   FunnelIcon,
   ArrowsUpDownIcon,
   CalendarIcon,
   HeartIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Customer } from "@/types/customer";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { indexedDBService } from "@/services/indexedDB";
import DeleteCustomerDialog from "@/components/DeleteCustomerDialog";
import { useLanguage } from "@/context/LanguageContext";
import MedicalInfoCard from "@/components/MedicalInfoCard";
import MedicalInfoSection from "@/components/MedicalInfoSection";

// Create a new AppointmentHistoryDialog component directly in this file
// Later we can extract it to its own component file if needed
function AppointmentHistoryDialog({ 
   isOpen, 
   onClose, 
   customerId, 
   customerName,
   darkMode 
}: { 
   isOpen: boolean; 
   onClose: () => void; 
   customerId: string;
   customerName: string;
   darkMode: boolean;
}) {
   const { t } = useLanguage(); // Add the useLanguage hook to access translations
   const [appointments, setAppointments] = useState<any[]>([]);
   const [customer, setCustomer] = useState<Customer | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function loadData() {
         if (!isOpen || !customerId) return;
         
         setLoading(true);
         try {
            // Make sure the database is initialized
            if (!indexedDBService.db) {
               await indexedDBService.initDB();
            }
            
            // Load customer details
            const customerData = await indexedDBService.getCustomerById(customerId);
            setCustomer(customerData);
            
            // Load appointments
            const customerAppointments = await indexedDBService.getAppointmentsByCustomer(customerId);
            console.log(`Loaded ${customerAppointments.length} appointments for customer ${customerId}`);
            if (customerAppointments.length > 0) {
               console.log("First appointment data:", customerAppointments[0]);
            }
            setAppointments(customerAppointments);
            setLoading(false);
         } catch (error) {
            console.error("Failed to load customer data:", error);
            setLoading(false);
         }
      }
      
      // Call loadData immediately when dialog opens
      if (isOpen && customerId) {
         loadData();
      }
   }, [isOpen, customerId]);

   if (!isOpen) return null;

   // Format date in a nice, readable format
   const formatAppointmentDate = (dateStr: string) => {
      const date = new Date(dateStr);
      // Format like: "Tue, Apr 29, 2025"
      return date.toLocaleDateString('en-US', { 
         weekday: 'short',
         month: 'short', 
         day: 'numeric', 
         year: 'numeric'
      });
   };

   // Format time in 12-hour format
   const formatAppointmentTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { 
         hour: 'numeric', 
         minute: 'numeric',
         hour12: true 
      });
   };

   // Define appointment stages for display with better wording
   const getStageLabel = (stage: string) => {
      switch(stage?.toLowerCase()) {
         case "confirmed": return "confirmed";
         case "completed": return "completed";
         case "cancelled": 
         case "canceled": return "canceled";
         case "no-show": return "no-show";
         case "pending": return "pending";
         default: return "scheduled";
      }
   };

   // Define stage colors
   const getStageColor = (stage: string) => {
      switch(stage?.toLowerCase()) {
         case "confirmed": 
            return darkMode ? "text-blue-300" : "text-blue-600";
         case "completed": 
            return darkMode ? "text-green-300" : "text-green-600";
         case "cancelled": 
         case "canceled": 
            return darkMode ? "text-red-300" : "text-red-600";
         case "no-show": 
            return darkMode ? "text-yellow-300" : "text-yellow-600";
         case "pending":
            return darkMode ? "text-purple-300" : "text-purple-600";
         default: 
            return darkMode ? "text-gray-300" : "text-gray-600";
      }
   };

   return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
         <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Background overlay */}
            <div 
               className="fixed inset-0 transition-opacity" 
               aria-hidden="true"
               onClick={onClose}
            >
               <div className={`absolute inset-0 ${darkMode ? "bg-black" : "bg-gray-500"} opacity-75`}></div>
            </div>

            {/* Modal panel */}
            <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
               <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
                  <div className="sm:flex sm:items-start">
                     <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium">
                           {t('appointment_history')} {customerName}
                        </h3>
                        
                        {/* Medical Information Card */}
                        {customer && <MedicalInfoCard customer={customer} />}
                        
                        <div className="mt-4 max-h-96 overflow-y-auto">
                           {loading ? (
                              <div className="py-4 text-center">
                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                 <p className="mt-2 text-sm">{t('loading_appointments')}</p>
                              </div>
                           ) : appointments.length === 0 ? (
                              <div className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                 {t('no_appointment_history')}
                              </div>
                           ) : (
                              <div className="space-y-6">
                                 {appointments.map((appointment) => {
                                    // Debug log to see full structure of appointment
                                    console.log(`Appointment ${appointment._id} service:`, 
                                        typeof appointment.service === 'object' ? appointment.service : appointment.service,
                                        "serviceInfo:", appointment.serviceInfo
                                    );
                                    
                                    // Determine service name
                                    let serviceName = "Unknown service";
                                    if (appointment.serviceInfo && appointment.serviceInfo.name) {
                                        serviceName = appointment.serviceInfo.name;
                                    } else if (typeof appointment.service === 'object' && appointment.service?.name) {
                                        serviceName = appointment.service.name;
                                    } else if (typeof appointment.service === 'string') {
                                        serviceName = appointment.service;
                                    }
                                    
                                    // Get price if available
                                    let servicePrice = null;
                                    if (appointment.price) {
                                        servicePrice = appointment.price;
                                    } else if (appointment.serviceInfo && appointment.serviceInfo.price) {
                                        servicePrice = appointment.serviceInfo.price;
                                    } else if (typeof appointment.service === 'object' && appointment.service?.price) {
                                        servicePrice = appointment.service.price;
                                    }
                                    
                                    return (
                                        <div 
                                            key={appointment._id} 
                                            className={`p-4 rounded-lg border mb-2 ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"}`}
                                        >
                                            <div className="flex gap-2 items-baseline mb-2">
                                                <div className={`font-medium text-base ${darkMode ? "text-white" : "text-gray-900"}`}>
                                                    {formatAppointmentDate(appointment.date)}
                                                </div>
                                                <div className={`font-medium ${getStageColor(appointment.status)}`}>
                                                    {getStageLabel(appointment.status)}
                                                </div>
                                            </div>

                                            <div className={`${darkMode ? "text-white" : "text-gray-800"} font-medium`}>
                                                {serviceName}
                                                {servicePrice && (
                                                    <span className={`ml-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                                        - EGP {servicePrice}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {appointment.notes && (
                                                <div className={`mt-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} bg-opacity-50 ${darkMode ? "bg-gray-800" : "bg-gray-100"} p-2 rounded`}>
                                                    <p className="font-medium mb-1">{t('notes')}</p>
                                                    <p>{appointment.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
               <div className={`${darkMode ? "bg-gray-800" : "bg-gray-50"} px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse`}>
                  <button 
                     type="button" 
                     className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm ${
                        darkMode 
                        ? "bg-gray-700 text-white hover:bg-gray-600" 
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                     }`}
                     onClick={onClose}
                  >
                     {t('close')}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

// Create a new MedicalInfoDialog component
function MedicalInfoDialog({ 
   isOpen, 
   onClose, 
   customerId, 
   customerName,
   darkMode 
}: { 
   isOpen: boolean; 
   onClose: () => void; 
   customerId: string;
   customerName: string;
   darkMode: boolean;
}) {
   const { t } = useLanguage();
   const [customer, setCustomer] = useState<Customer | null>(null);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [editMode, setEditMode] = useState(false);

   useEffect(() => {
      async function loadData() {
         if (!isOpen || !customerId) return;
         
         setLoading(true);
         try {
            // Make sure the database is initialized
            if (!indexedDBService.db) {
               await indexedDBService.initDB();
            }
            
            // Load customer details
            const customerData = await indexedDBService.getCustomerById(customerId);
            setCustomer(customerData);
            setLoading(false);
         } catch (error) {
            console.error("Failed to load customer data:", error);
            setLoading(false);
         }
      }
      
      if (isOpen && customerId) {
         loadData();
         setEditMode(false); // Reset to view mode whenever dialog opens
      }
   }, [isOpen, customerId]);

   const handleSaveMedicalInfo = async (updatedCustomer: Customer) => {
      if (!customer) return;
      
      setSaving(true);
      try {
         // Make sure the database is initialized
         if (!indexedDBService.db) {
            await indexedDBService.initDB();
         }
         
         // Only update the medical-related fields
         const customerToUpdate = {
            ...customer,
            age: updatedCustomer.age,
            medicalConditions: updatedCustomer.medicalConditions,
            allergies: updatedCustomer.allergies,
            medicalNotes: updatedCustomer.medicalNotes,
            customFields: updatedCustomer.customFields
         };
         
         // Save to database
         await indexedDBService.updateCustomer(customerToUpdate);
         
         // Update local state
         setCustomer(customerToUpdate);
         setEditMode(false);
         
         // Show success message
         toast.success(t('medical_info_updated'));
         
         // Signal that the customer list should refresh
         localStorage.setItem("customerListShouldRefresh", "true");
      } catch (error) {
         console.error("Failed to save medical information:", error);
         toast.error(t('error_updating_medical_info'));
      } finally {
         setSaving(false);
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
         <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Background overlay */}
            <div 
               className="fixed inset-0 transition-opacity" 
               aria-hidden="true"
               onClick={editMode ? undefined : onClose} // Prevent closing when in edit mode
            >
               <div className={`absolute inset-0 ${darkMode ? "bg-black" : "bg-gray-500"} opacity-75`}></div>
            </div>

            {/* Modal panel */}
            <div className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
               <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
                  <div className="sm:flex sm:items-start">
                     <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium flex items-center justify-between">
                           <div className="flex items-center">
                              <HeartIcon className="h-5 w-5 mr-2 text-red-500" />
                              {t('medical_info')} - {customerName}
                           </div>
                           {!loading && customer && !editMode && (
                              <button
                                 onClick={() => setEditMode(true)}
                                 className={`p-1.5 rounded-md text-sm flex items-center ${
                                    darkMode
                                       ? "bg-blue-900/30 text-blue-300 hover:bg-blue-800/50"
                                       : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                 }`}
                              >
                                 <PencilIcon className="h-4 w-4 mr-1" />
                                 {t('edit')}
                              </button>
                           )}
                        </h3>
                        
                        <div className="mt-4">
                           {loading ? (
                              <div className="py-4 text-center">
                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                 <p className="mt-2 text-sm">{t('loading')}...</p>
                              </div>
                           ) : saving ? (
                              <div className="py-4 text-center">
                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                 <p className="mt-2 text-sm">{t('saving')}...</p>
                              </div>
                           ) : customer ? (
                              editMode ? (
                                 <MedicalInfoSection 
                                    customer={customer} 
                                    onSave={handleSaveMedicalInfo}
                                    onCancel={() => setEditMode(false)}
                                 />
                              ) : (
                                 <MedicalInfoCard customer={customer} />
                              )
                           ) : (
                              <div className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                 {t('no_medical_info')}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
               <div className={`${darkMode ? "bg-gray-800" : "bg-gray-50"} px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse`}>
                  {!editMode ? (
                     <button 
                        type="button" 
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm ${
                           darkMode 
                           ? "bg-gray-700 text-white hover:bg-gray-600" 
                           : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                        }`}
                        onClick={onClose}
                     >
                        {t('close')}
                     </button>
                  ) : (
                     <>
                        <button 
                           type="button" 
                           className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm ${
                              darkMode 
                              ? "bg-green-700 text-white hover:bg-green-600" 
                              : "bg-green-600 text-white hover:bg-green-700"
                           }`}
                           onClick={() => customer && handleSaveMedicalInfo(customer)}
                           disabled={saving}
                        >
                           {saving ? t('saving') : t('save')}
                        </button>
                        <button 
                           type="button" 
                           className={`mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                              darkMode 
                              ? "bg-gray-700 text-white hover:bg-gray-600" 
                              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                           }`}
                           onClick={() => setEditMode(false)}
                           disabled={saving}
                        >
                           {t('cancel')}
                        </button>
                     </>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

export default function Customers() {
   const router = useRouter();
   const { t } = useLanguage(); // Add the useLanguage hook for translations
   const [customers, setCustomers] = useState<Customer[]>([]);
   const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
   const [searchTerm, setSearchTerm] = useState("");
   const [searchField, setSearchField] = useState("all");
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const { darkMode } = useTheme();
   const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   const [sortOption, setSortOption] = useState("name-asc"); // Default sort by name ascending
   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
   const [activeFilter, setActiveFilter] = useState<string | null>(null);
   
   // Add new state for appointment history
   const [appointmentHistoryOpen, setAppointmentHistoryOpen] = useState(false);
   const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
   const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
   const [customerVisitCounts, setCustomerVisitCounts] = useState<Record<string, number>>({});

   // Add new state for medical info dialog
   const [medicalInfoOpen, setMedicalInfoOpen] = useState(false);

   // Load customers directly from IndexedDB
   async function loadCustomers() {
      try {
         setLoading(true);
         setError(null);
         
         // Initialize database if needed
         if (!indexedDBService.db) {
            await indexedDBService.initDB();
         }
         
         // Get all customers from database
         const allCustomers = await indexedDBService.getAllCustomers();
         
         // Sort by the selected sort option
         sortCustomers(allCustomers, sortOption);
         
         setCustomers(allCustomers);
         setFilteredCustomers(allCustomers);
         
         if (allCustomers.length === 0) {
            console.log("No customers found in database");
         } else {
            console.log(`Loaded ${allCustomers.length} customers from database`);
            
            // Force a check of appointments for each customer immediately
            setTimeout(() => {
               loadCustomerVisitCounts();
            }, 500); // Slight delay to ensure DB operations complete
         }
      } catch (err) {
         console.error("Error loading customers:", err);
         setError("Failed to load customers. Please try resetting the database.");
      } finally {
         setLoading(false);
      }
   }

   // Sort customers based on the selected option
   const sortCustomers = (customersToSort: Customer[], option: string) => {
      const sortedCustomers = [...customersToSort];

      switch(option) {
         case "id-asc":
            sortedCustomers.sort((a, b) => {
               const idA = parseInt(a._id);
               const idB = parseInt(b._id);
               return idA - idB;
            });
            break;
         case "id-desc":
            sortedCustomers.sort((a, b) => {
               const idA = parseInt(a._id);
               const idB = parseInt(b._id);
               return idB - idA;
            });
            break;
         case "name-asc":
            sortedCustomers.sort((a, b) => {
               const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
               const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
               return nameA.localeCompare(nameB);
            });
            break;
         case "name-desc":
            sortedCustomers.sort((a, b) => {
               const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
               const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
               return nameB.localeCompare(nameA);
            });
            break;
         case "date-asc":
            sortedCustomers.sort((a, b) => {
               const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
               const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
               return dateA - dateB;
            });
            break;
         case "date-desc":
            sortedCustomers.sort((a, b) => {
               const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
               const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
               return dateB - dateA;
            });
            break;
         default:
            // Default sort by name ascending
            sortedCustomers.sort((a, b) => {
               const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
               const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
               return nameA.localeCompare(nameB);
            });
      }

      return sortedCustomers;
   };

   // Handle sorting change
   const handleSortChange = (option: string) => {
      setSortOption(option);
      const sorted = sortCustomers(filteredCustomers, option);
      setFilteredCustomers(sorted);
   };

   // Handle search 
   const handleSearch = async (term: string) => {
      setSearchTerm(term);
      
      if (!term.trim() && !activeFilter) {
         // If search is cleared and no filter is active, show all customers but maintain sort order
         const sorted = sortCustomers(customers, sortOption);
         setFilteredCustomers(sorted);
         return;
      }
      
      // Start with all customers or the current filtered set
      let results = customers;
      
      // Apply text search if provided
      if (term.trim()) {
         const lowerTerm = term.toLowerCase();
         
         // Apply search based on selected field
         results = results.filter(customer => {
            switch(searchField) {
               case "name":
                  const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
                  return fullName.includes(lowerTerm);
               case "phone":
                  const phone = customer.phone?.toLowerCase() || '';
                  return phone.includes(lowerTerm);
               case "email":
                  const email = customer.email?.toLowerCase() || '';
                  return email.includes(lowerTerm);
               case "id":
                  return customer._id.includes(term);
               default: // "all"
                  const name = `${customer.firstName} ${customer.lastName}`.toLowerCase();
                  const customerPhone = customer.phone?.toLowerCase() || '';
                  const customerEmail = customer.email?.toLowerCase() || '';
                  const id = customer._id;
                  
                  return name.includes(lowerTerm) || 
                        customerEmail.includes(lowerTerm) || 
                        customerPhone.includes(lowerTerm) ||
                        id.includes(term);
            }
         });
      }
      
      // Apply any active filter
      if (activeFilter) {
         switch (activeFilter) {
            case "has-visited":
               results = results.filter(customer => !!customer.lastVisit);
               break;
            case "never-visited":
               results = results.filter(customer => !customer.lastVisit);
               break;
         }
      }
      
      // Apply current sort to results
      const sortedResults = sortCustomers(results, sortOption);
      setFilteredCustomers(sortedResults);
   };

   // Apply a specific filter
   const applyFilter = (filterType: string) => {
      if (activeFilter === filterType) {
         // If clicking the same filter, deactivate it
         setActiveFilter(null);
         // Re-apply just the search without the filter
         handleSearch(searchTerm);
      } else {
         setActiveFilter(filterType);
         // Apply both the search and the new filter
         let results = customers;
         
         // Apply text search if provided
         if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            
            // Apply search based on selected field
            results = results.filter(customer => {
               switch(searchField) {
                  case "name":
                     const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
                     return fullName.includes(lowerTerm);
                  case "phone":
                     const phone = customer.phone?.toLowerCase() || '';
                     return phone.includes(lowerTerm);
                  case "email":
                     const email = customer.email?.toLowerCase() || '';
                     return email.includes(lowerTerm);
                  case "id":
                     return customer._id.includes(searchTerm);
                  default: // "all"
                     const name = `${customer.firstName} ${customer.lastName}`.toLowerCase();
                     const customerPhone = customer.phone?.toLowerCase() || '';
                     const customerEmail = customer.email?.toLowerCase() || '';
                     const id = customer._id;
                     
                     return name.includes(lowerTerm) || 
                           customerEmail.includes(lowerTerm) || 
                           customerPhone.includes(lowerTerm) ||
                           id.includes(searchTerm);
               }
            });
         }
         
         // Apply the selected filter
         switch (filterType) {
            case "has-visited":
               results = results.filter(customer => !!customer.lastVisit);
               break;
            case "never-visited":
               results = results.filter(customer => !customer.lastVisit);
               break;
         }
         
         // Apply current sort to results
         const sortedResults = sortCustomers(results, sortOption);
         setFilteredCustomers(sortedResults);
      }
   };

   // Load customer visit counts
   async function loadCustomerVisitCounts() {
      try {
         // Make sure database is initialized
         if (!indexedDBService.db) {
            await indexedDBService.initDB();
         }
         
         const visitCounts: Record<string, number> = {};
         
         // Get appointments for each customer using the correct function name
         for (const customer of customers) {
            try {
               const appointments = await indexedDBService.getAppointmentsByCustomer(customer._id);
               console.log(`Customer ${customer._id} (${customer.firstName} ${customer.lastName}) has ${appointments.length} appointments`);
               visitCounts[customer._id] = appointments.length;
            } catch (err) {
               console.error(`Failed to get appointments for customer ${customer._id}:`, err);
               visitCounts[customer._id] = 0;
            }
         }
         
         setCustomerVisitCounts(visitCounts);
      } catch (error) {
         console.error("Error loading visit counts:", error);
      }
   }

   // Modified useEffect to check for refresh more frequently
   useEffect(() => {
      // Load customers when component mounts
      loadCustomers();
      
      // Set up a refresh check
      const refreshInterval = setInterval(() => {
         const shouldRefresh = localStorage.getItem("customerListShouldRefresh");
         if (shouldRefresh === "true") {
            console.log("Detected refresh signal, reloading customers and visit counts");
            localStorage.removeItem("customerListShouldRefresh");
            loadCustomers();
            // Also refresh visit counts
            loadCustomerVisitCounts();
         }
      }, 1000); // Check every second
      
      return () => clearInterval(refreshInterval);
   }, []);

   // Add another useEffect to refresh visit counts periodically
   useEffect(() => {
      // Only load visit counts if we have customers
      if (customers.length > 0) {
         console.log("Customers changed, loading visit counts");
         loadCustomerVisitCounts();
         
         // Also set up a timer to refresh visit counts every 3 seconds
         const visitCountsRefreshInterval = setInterval(() => {
            console.log("Periodic refresh of visit counts");
            loadCustomerVisitCounts();
         }, 3000); // Refresh every 3 seconds
         
         return () => clearInterval(visitCountsRefreshInterval);
      }
   }, [customers]);

   // Handle delete customer
   const handleDeleteCustomer = async (customerId: string) => {
      // Show the custom delete dialog instead of window.confirm
      setCustomerToDelete(customerId);
   };

   // Handle confirm delete
   const handleConfirmDelete = async () => {
      if (!customerToDelete) return;
      
      try {
         setIsDeleting(true);
         
         // Use the enhanced delete function that handles appointments too
         await indexedDBService.deleteCustomer(customerToDelete);
         
         toast.success("Customer deleted successfully");
         
         // Reload customer list
         await loadCustomers();
      } catch (error) {
         console.error("Failed to delete customer:", error);
         toast.error("Failed to delete customer");
      } finally {
         setIsDeleting(false);
         setCustomerToDelete(null); // Close dialog
      }
   };

   // Handle cancel delete
   const handleCancelDelete = () => {
      setCustomerToDelete(null);
   };

   // Handle edit customer
   const handleEditCustomer = (customerId: string) => {
      router.push(`/dashboard/customers/edit/${customerId}`);
   };

   // Clear all filters and search
   const clearAllFilters = () => {
      setSearchTerm("");
      setActiveFilter(null);
      const sorted = sortCustomers(customers, sortOption);
      setFilteredCustomers(sorted);
   };
   
   // Handle search field change
   const handleSearchFieldChange = (field: string) => {
      setSearchField(field);
      if (searchTerm) {
         // Re-apply search with the new field selection
         handleSearch(searchTerm);
      }
   };

   // Function to open appointment history dialog
   const openAppointmentHistory = (customerId: string, customerName: string) => {
      setSelectedCustomerId(customerId);
      setSelectedCustomerName(customerName);
      setAppointmentHistoryOpen(true);
      // Refresh visit counts as soon as the dialog opens
      loadCustomerVisitCounts();
   };

   // Handle closing the appointment history dialog
   const handleCloseAppointmentHistory = () => {
      setAppointmentHistoryOpen(false);
      // Refresh visit counts after the dialog closes
      loadCustomerVisitCounts();
   };

   // Function to manually refresh a specific customer's visit count
   const refreshCustomerVisitCount = async (customerId: string) => {
      try {
         // Make sure database is initialized
         if (!indexedDBService.db) {
            await indexedDBService.initDB();
         }
         
         // Get latest appointments for this customer using the correct function
         const appointments = await indexedDBService.getAppointmentsByCustomer(customerId);
         
         // Update just this customer's visit count
         setCustomerVisitCounts(prev => ({
            ...prev,
            [customerId]: appointments.length
         }));
         
         // Show success message
         toast.success(t('refreshed_appointment_count'));
         
         return appointments.length;
      } catch (error) {
         console.error("Error refreshing visit count:", error);
         toast.error(t('error_refreshing_count'));
         return null;
      }
   };

   // Add helper function to debug appointment issues
   async function verifyAppointmentLinks() {
      try {
         console.log("Verifying appointment-customer links...");
         
         // Make sure database is initialized
         if (!indexedDBService.db) {
            await indexedDBService.initDB();
         }
         
         // Get all appointments
         const allAppointments = await indexedDBService.getAllAppointments();
         console.log(`Found ${allAppointments.length} total appointments in database`);
         
         // Check each appointment for customer field
         const appointmentsWithoutCustomer = allAppointments.filter(app => !app.customer);
         if (appointmentsWithoutCustomer.length > 0) {
            console.error(`Found ${appointmentsWithoutCustomer.length} appointments without customer:`, appointmentsWithoutCustomer);
         }
         
         // Check customer links
         for (const customer of customers) {
            const linkedAppointments = allAppointments.filter(app => {
               if (typeof app.customer === 'string') {
                  return app.customer === customer._id;
               } else {
                  return app.customer._id === customer._id;
               }
            });
            console.log(`Customer ${customer._id} (${customer.firstName} ${customer.lastName}) has ${linkedAppointments.length} linked appointments`);
         }
         
         // If you're having issues with appointments not showing, dump a more detailed log
         if (allAppointments.length > 0) {
            console.log("First appointment details:", JSON.stringify(allAppointments[0]));
         }
      } catch (error) {
         console.error("Error verifying appointment links:", error);
      }
   }

   // Call this verification during initial load or when troubleshooting
   useEffect(() => {
      if (customers.length > 0) {
         // Verify appointment links after data loads
         verifyAppointmentLinks();
      }
   }, [customers]);

   // Function to open medical info dialog
   const openMedicalInfo = (customerId: string, customerName: string) => {
      setSelectedCustomerId(customerId);
      setSelectedCustomerName(customerName);
      setMedicalInfoOpen(true);
   };

   // Handle closing the medical info dialog
   const handleCloseMedicalInfo = () => {
      setMedicalInfoOpen(false);
   };

   return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
         {/* Decorative element */}
         <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
         
         <div className="relative p-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
               <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                     {t('customers.customers')}
                  </h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                     {t('customers.customer_list')}
                  </p>
               </div>
               
               <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
                  <button
                     onClick={() => loadCustomers()}
                     disabled={loading}
                     className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                        darkMode
                           ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                           : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                     } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                     <ArrowPathIcon
                        className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`}
                     />
                     {loading ? t('common.refreshing') : t('common.refresh')}
                  </button>
                  
                  <Link
                     href="/dashboard/customers/add"
                     className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                        darkMode
                           ? "bg-purple-600 text-white hover:bg-purple-700"
                           : "bg-purple-600 text-white hover:bg-purple-700"
                     }`}
                  >
                     <UserPlusIcon className="h-5 w-5 mr-2" />
                     {t('customers.add_customer')}
                  </Link>
               </div>
            </div>
            
            {/* Filters and search */}
            <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-4 mb-6 border shadow-lg transition-all`}>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="relative flex-1">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                     </div>
                     <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('customers.search_customers')}
                        className={`block w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                           darkMode 
                              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-purple-500/50" 
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-purple-500/30"
                        }`}
                     />
                  </div>
                  
                  <div className="flex space-x-2">
                     <div className="relative">
                        <div
                           onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                           className={`cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                              darkMode
                                 ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                 : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                           } ${activeFilter ? "border border-purple-500/70" : ""}`}
                        >
                           <FunnelIcon className="h-5 w-5 mr-2" />
                           {t('common.filter')} {activeFilter ? `• ${activeFilter}` : ""}
                        </div>
                        {showAdvancedFilters && (
                           <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                              darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                           }`}>
                              <div className="py-1">
                                 <button
                                    onClick={() => {
                                       applyFilter("name");
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-100"
                                    } ${activeFilter === "name" ? "bg-purple-500/20" : ""}`}
                                 >
                                    {t('customers.filter_by_name')}
                                 </button>
                                 <button
                                    onClick={() => {
                                       applyFilter("email");
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-100"
                                    } ${activeFilter === "email" ? "bg-purple-500/20" : ""}`}
                                 >
                                    {t('customers.filter_by_email')}
                                 </button>
                                 <button
                                    onClick={() => {
                                       applyFilter("phone");
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-100"
                                    } ${activeFilter === "phone" ? "bg-purple-500/20" : ""}`}
                                 >
                                    {t('customers.filter_by_phone')}
                                 </button>
                                 <button
                                    onClick={() => {
                                       clearAllFilters();
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left border-t ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700 border-gray-700"
                                          : "text-gray-700 hover:bg-gray-100 border-gray-200"
                                    }`}
                                 >
                                    {t('common.clear_filters')}
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                     
                     <div className="relative">
                        <div
                           onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                           className={`cursor-pointer inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                              darkMode
                                 ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                 : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                           } ${sortOption !== "newest" ? "border border-purple-500/70" : ""}`}
                        >
                           <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
                           {t('common.sort')}
                        </div>
                        {showAdvancedFilters && (
                           <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                              darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                           }`}>
                              <div className="py-1">
                                 <button
                                    onClick={() => {
                                       handleSortChange("name");
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-100"
                                    } ${sortOption === "name" ? "bg-purple-500/20" : ""}`}
                                 >
                                    {t('customers.sort_by_name')}
                                 </button>
                                 <button
                                    onClick={() => {
                                       handleSortChange("newest");
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-100"
                                    } ${sortOption === "newest" ? "bg-purple-500/20" : ""}`}
                                 >
                                    {t('customers.sort_by_newest')}
                                 </button>
                                 <button
                                    onClick={() => {
                                       handleSortChange("oldest");
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-100"
                                    } ${sortOption === "oldest" ? "bg-purple-500/20" : ""}`}
                                 >
                                    {t('customers.sort_by_oldest')}
                                 </button>
                                 <button
                                    onClick={() => {
                                       handleSortChange("visits");
                                       setShowAdvancedFilters(false);
                                    }}
                                    className={`block px-4 py-2 text-sm w-full text-left ${
                                       darkMode
                                          ? "text-gray-300 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-100"
                                    } ${sortOption === "visits" ? "bg-purple-500/20" : ""}`}
                                 >
                                    {t('customers.sort_by_visits')}
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
               
               {activeFilter && (
                  <div className="mt-3 flex items-center">
                     <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {t('customers.filter_by')}: 
                     </span>
                     <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                        darkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-800"
                     }`}>
                        {activeFilter === "name" 
                           ? t('customers.filter_by_name')
                           : activeFilter === "email" 
                             ? t('customers.filter_by_email') 
                             : t('customers.filter_by_phone')}
                     </span>
                     <button
                        onClick={clearAllFilters}
                        className={`ml-2 inline-flex items-center p-1 rounded-md ${
                           darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                        }`}
                     >
                        <XCircleIcon className="h-4 w-4" />
                     </button>
                  </div>
               )}
            </div>

            {/* Customer list */}
            {loading ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl flex justify-center items-center py-12`}>
                  <LoadingSpinner />
               </div>
            ) : error ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl`}>
                  <div className={`text-center py-8 ${darkMode ? "text-red-400" : "text-red-600"}`}>
                     {error}
                  </div>
               </div>
            ) : filteredCustomers.length === 0 ? (
               <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl`}>
                  <div className="text-center py-8">
                     {searchTerm ? (
                        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                           {t('common.no_results')}
                        </p>
                     ) : (
                        <>
                           <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                              {t('customers.no_customers')}
                           </p>
                           <Link
                              href="/dashboard/customers/add"
                              className={`mt-4 inline-flex items-center px-4 py-2 rounded-lg ${
                                 darkMode
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                              }`}
                           >
                              <UserPlusIcon className="h-5 w-5 mr-2" />
                              {t('customers.add_first_customer')}
                           </Link>
                        </>
                     )}
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCustomers.map((customer) => (
                     <div
                        key={customer._id}
                        className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl relative transition-all hover:shadow-lg`}
                     >
                        <div className="flex justify-between">
                           <h3 className={`font-medium text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {customer.firstName} {customer.lastName}
                           </h3>
                           <div className="flex space-x-1">
                              <button
                                 onClick={() => openMedicalInfo(customer._id, `${customer.firstName} ${customer.lastName}`)}
                                 title={t('medical_info')}
                                 className={`p-1 rounded-md transition ${
                                    darkMode
                                       ? "text-gray-400 hover:text-red-300 hover:bg-red-900/20"
                                       : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                                 }`}
                              >
                                 <HeartIcon className="h-5 w-5" />
                              </button>
                              <button
                                 onClick={() => openAppointmentHistory(customer._id, `${customer.firstName} ${customer.lastName}`)}
                                 title={t('customers.view_appointments')}
                                 className={`p-1 rounded-md transition ${
                                    darkMode
                                       ? "text-gray-400 hover:text-white hover:bg-white/10"
                                       : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                 }`}
                              >
                                 <CalendarIcon className="h-5 w-5" />
                              </button>
                              <button
                                 onClick={() => handleEditCustomer(customer._id)}
                                 title={t('common.edit')}
                                 className={`p-1 rounded-md transition ${
                                    darkMode
                                       ? "text-gray-400 hover:text-white hover:bg-white/10"
                                       : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                 }`}
                              >
                                 <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                 onClick={() => handleDeleteCustomer(customer._id)}
                                 title={t('common.delete')}
                                 className={`p-1 rounded-md transition ${
                                    darkMode
                                       ? "text-gray-400 hover:text-red-300 hover:bg-red-900/20"
                                       : "text-gray-500 hover:text-red-700 hover:bg-red-50"
                                 }`}
                              >
                                 <TrashIcon className="h-5 w-5" />
                              </button>
                           </div>
                        </div>
                        <div className="mt-2">
                           {customer.phone && (
                              <p className="flex items-center gap-2 mt-1">
                                 <PhoneIcon className={`h-4 w-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                                 <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                                    {customer.phone}
                                 </span>
                              </p>
                           )}
                           {customer.email && (
                              <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"} truncate`}>
                                 {customer.email}
                              </p>
                           )}
                        </div>
                        
                        {/* Visit information */}
                        {customerVisitCounts[customer._id] !== undefined && (
                           <div className={`mt-3 pt-3 border-t ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
                              <div className="flex justify-between">
                                 <div>
                                    <span className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                       {t('customers.visit_count')}:
                                    </span>
                                    <span className={`ml-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                       {customerVisitCounts[customer._id]}
                                    </span>
                                 </div>
                                 
                                 {/* Last visit date if available */}
                                 {customer.lastVisit && (
                                    <div>
                                       <span className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                          {t('customers.last_visit')}:
                                       </span>
                                       <span className={`ml-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                          {new Date(customer.lastVisit).toLocaleDateString()}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Delete confirmation dialog */}
         <DeleteCustomerDialog 
            isOpen={!!customerToDelete}
            isDeleting={isDeleting}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
         />

         {/* Appointment history dialog */}
         <AppointmentHistoryDialog
            isOpen={appointmentHistoryOpen}
            onClose={handleCloseAppointmentHistory}
            customerId={selectedCustomerId || ''}
            customerName={selectedCustomerName}
            darkMode={darkMode}
         />

         {/* Medical info dialog */}
         <MedicalInfoDialog
            isOpen={medicalInfoOpen}
            onClose={handleCloseMedicalInfo}
            customerId={selectedCustomerId || ''}
            customerName={selectedCustomerName}
            darkMode={darkMode}
         />
      </div>
   );
}
