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
   CalendarIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Customer } from "@/types/customer";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { indexedDBService } from "@/services/indexedDB";
import DeleteCustomerDialog from "@/components/DeleteCustomerDialog";

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
   const [appointments, setAppointments] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function loadAppointments() {
         if (!isOpen || !customerId) return;
         
         setLoading(true);
         try {
            // Make sure the database is initialized
            if (!indexedDBService.db) {
               await indexedDBService.initDB();
            }
            
            // Use the correct function name
            const customerAppointments = await indexedDBService.getAppointmentsByCustomer(customerId);
            console.log(`Loaded ${customerAppointments.length} appointments for customer ${customerId}`);
            console.log("First appointment data:", customerAppointments[0]);
            setAppointments(customerAppointments);
            setLoading(false);
         } catch (error) {
            console.error("Failed to load appointments:", error);
            setLoading(false);
         }
      }
      
      // Call loadAppointments immediately when dialog opens
      if (isOpen && customerId) {
         loadAppointments();
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
                           Appointment History for {customerName}
                        </h3>
                        <div className="mt-4 max-h-96 overflow-y-auto">
                           {loading ? (
                              <div className="py-4 text-center">
                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                 <p className="mt-2 text-sm">Loading appointments...</p>
                              </div>
                           ) : appointments.length === 0 ? (
                              <div className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                 No appointment history found for this customer.
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
                                                    <p className="font-medium mb-1">Notes:</p>
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
                     Close
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

export default function Customers() {
   const router = useRouter();
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
               return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
            break;
         case "date-desc":
            sortedCustomers.sort((a, b) => {
               return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
         toast.success("Refreshed appointment count");
         
         return appointments.length;
      } catch (error) {
         console.error("Error refreshing visit count:", error);
         toast.error("Failed to refresh appointment count");
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
         
         // Check each appointment for customerId field
         const appointmentsWithoutCustomer = allAppointments.filter(app => !app.customerId);
         if (appointmentsWithoutCustomer.length > 0) {
            console.error(`Found ${appointmentsWithoutCustomer.length} appointments without customerId:`, appointmentsWithoutCustomer);
         }
         
         // Check customer links
         for (const customer of customers) {
            const linkedAppointments = allAppointments.filter(app => app.customerId === customer._id);
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

   return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
         {/* Decorative element */}
         <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
         
         <div className="relative p-6 max-w-7xl mx-auto">
            <div className="flex flex-col mb-6">
               <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                     Customers
                  </h1>
                  <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                     A list of all customers in your database including their contact information and appointment history.
                  </p>
               </div>
            </div>
            
            {/* Search and filter section */}
            <div className="mb-6">
               {/* Search controls */}
               <div className="flex flex-wrap gap-3 items-center mb-4">
                  {/* Search field selector */}
                  <div className="relative w-40">
                     <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Search in
                     </label>
                     <select
                        value={searchField}
                        onChange={(e) => handleSearchFieldChange(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border appearance-none bg-no-repeat pr-8 ${
                           darkMode 
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-gray-50 border-gray-300 text-gray-900"
                        } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        style={{ 
                           backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${darkMode ? 'white' : 'black'}' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`,
                           backgroundSize: "1.2rem",
                           backgroundPosition: "right 0.5rem center"
                        }}
                     >
                        <option value="all">All Fields</option>
                        <option value="name">Name Only</option>
                        <option value="id">ID Only</option>
                        <option value="phone">Phone Only</option>
                        <option value="email">Email Only</option>
                     </select>
                  </div>
                  
                  {/* Search bar */}
                  <div className="relative flex-1 min-w-[200px]">
                     <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Search
                     </label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <MagnifyingGlassIcon className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                        </div>
                        <input
                           type="text"
                           value={searchTerm}
                           onChange={(e) => handleSearch(e.target.value)}
                           placeholder={`Search by ${searchField === 'all' ? 'name, ID, email or phone' : searchField}...`}
                           className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                              darkMode 
                                 ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                                 : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                           } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        />
                     </div>
                  </div>
                  
                  {/* Filters button */}
                  <div>
                     <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Filters
                     </label>
                     <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`inline-flex w-full items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                           darkMode
                              ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                        } ${showAdvancedFilters ? (darkMode ? "bg-gray-700" : "bg-gray-100") : ""}`}
                     >
                        <FunnelIcon className="h-5 w-5 mr-2" />
                        Filter
                        {activeFilter && <span className="ml-1 w-2 h-2 bg-purple-500 rounded-full"></span>}
                     </button>
                  </div>
               </div>
               
               {/* Second row - Sort and action buttons */}
               <div className="flex flex-wrap gap-3 items-end">
                  {/* Sort dropdown */}
                  <div className="relative w-48">
                     <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Sort by
                     </label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <ArrowsUpDownIcon className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                        </div>
                        <select
                           value={sortOption}
                           onChange={(e) => handleSortChange(e.target.value)}
                           className={`w-full pl-10 pr-3 py-2 rounded-lg border appearance-none bg-no-repeat ${
                              darkMode 
                                 ? "bg-gray-800/50 border-gray-700 text-white"
                                 : "bg-gray-50 border-gray-300 text-gray-900"
                           } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                           style={{ 
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${darkMode ? 'white' : 'black'}' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`,
                              backgroundSize: "1.2rem",
                              backgroundPosition: "right 0.5rem center"
                           }}
                        >
                           <option value="name-asc">Name (A-Z)</option>
                           <option value="name-desc">Name (Z-A)</option>
                           <option value="id-asc">ID (Low-High)</option>
                           <option value="id-desc">ID (High-Low)</option>
                           <option value="date-asc">Oldest First</option>
                           <option value="date-desc">Newest First</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="flex-1"></div> {/* Spacer */}
                  
                  {/* Action buttons */}
                  <div className="flex gap-3">
                     <button
                        onClick={loadCustomers}
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
                        {loading ? "Loading..." : "Refresh"}
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
                        Add Customer
                     </Link>
                  </div>
               </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
               <div className={`mb-6 p-4 rounded-xl ${
                  darkMode 
                     ? "bg-gray-900/60 border border-white/10" 
                     : "bg-white/80 border border-gray-200"
               } backdrop-blur-md`}>
                  <div className="flex flex-wrap gap-2">
                     <button 
                        onClick={() => applyFilter("has-visited")}
                        className={`px-3 py-1.5 text-sm rounded-lg transition ${
                           activeFilter === "has-visited"
                              ? (darkMode ? "bg-purple-600 text-white" : "bg-purple-600 text-white")
                              : (darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
                        }`}
                     >
                        Has Previous Visit
                     </button>
                     <button 
                        onClick={() => applyFilter("never-visited")}
                        className={`px-3 py-1.5 text-sm rounded-lg transition ${
                           activeFilter === "never-visited"
                              ? (darkMode ? "bg-purple-600 text-white" : "bg-purple-600 text-white")
                              : (darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
                        }`}
                     >
                        Never Visited
                     </button>
                     
                     {(activeFilter || searchTerm) && (
                        <button 
                           onClick={clearAllFilters}
                           className={`ml-auto px-3 py-1.5 text-sm rounded-lg transition ${
                              darkMode 
                                 ? "bg-red-900/30 text-red-300 hover:bg-red-900/50" 
                                 : "bg-red-100 text-red-600 hover:bg-red-200"
                           }`}
                        >
                           Clear All Filters
                        </button>
                     )}
                  </div>
               </div>
            )}

            {/* Customer List */}
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
                  {searchTerm || activeFilter ? (
                        <div className="text-center py-8">
                     <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        No customers match your search criteria.
                     </p>
                     <button 
                        onClick={clearAllFilters}
                        className={`mt-2 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition ${
                           darkMode
                              ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                        }`}
                     >
                        <XCircleIcon className="h-5 w-5 mr-2" />
                        Clear Filters
                     </button>
                        </div>
                  ) : (
                        <div className="text-center py-12">
                           <p className={`text-lg mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                           No customers found. Add your first customer to get started.
                        </p>
                        <Link
                           href="/dashboard/customers/add"
                              className={`inline-flex items-center px-4 py-2 rounded-lg transition ${
                              darkMode
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                           }`}
                        >
                           <UserPlusIcon className="h-5 w-5 mr-2" />
                           Add Your First Customer
                        </Link>
                     </div>
                  )}
               </div>
            ) : (
               <>
                  {/* Filter summary - REMOVE THIS SECTION */}
                  <div className={`mb-4 flex justify-between items-center`}>
                     {/* Remove the text showing customer count */}
                     {(searchTerm || activeFilter) && (
                        <button 
                           onClick={clearAllFilters}
                           className={`text-sm flex items-center px-2 py-1 rounded ${
                              darkMode 
                                 ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                           }`}
                        >
                           <XCircleIcon className="h-4 w-4 mr-1" />
                           Clear all
                        </button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCustomers.map((customer) => (
                     <div
                        key={customer._id}
                           className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 border shadow-xl transition-all hover:shadow-lg`}
                        >
                           <div className="flex items-center space-x-3 mb-4">
                                 <div
                                 className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-semibold ${
                                       darkMode
                                          ? "bg-purple-600/20 text-purple-400"
                                          : "bg-purple-100 text-purple-600"
                                    }`}
                                 >
                                 {customer.firstName ? customer.firstName[0].toUpperCase() : ''}
                                 {customer.lastName ? customer.lastName[0].toUpperCase() : ''}
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                                       {customer.firstName} {customer.lastName}
                                    </h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-purple-900/50 text-purple-300 border border-purple-700/50" : "bg-purple-100 text-purple-700 border border-purple-200"}`}>
                                       ID: {customer._id}
                                    </span>
                                 </div>
                                 {customer.phone && (
                                    <div className="flex items-center">
                                       <PhoneIcon 
                                          className={`h-4 w-4 mr-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                       />
                                       <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                          {customer.phone}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                           
                           <div className={`py-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                       Email
                                    </p>
                                    <p className={`text-sm ${darkMode ? "text-white" : "text-gray-800"} truncate`}>
                                       {customer.email || "N/A"}
                                    </p>
                                 </div>
                                 <div>
                                    <div className="flex items-center justify-between">
                                       <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                          Appointments
                                       </p>
                                       <div className="flex items-center gap-1">
                                          <button
                                             onClick={(e) => {
                                                e.stopPropagation(); 
                                                e.preventDefault();
                                                refreshCustomerVisitCount(customer._id);
                                             }}
                                             className={`p-1 rounded-full ${
                                                darkMode 
                                                   ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                                                   : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                             }`}
                                             title="Refresh appointment count"
                                          >
                                             <ArrowPathIcon className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                             onClick={(e) => {
                                                e.stopPropagation(); 
                                                e.preventDefault();
                                                verifyAppointmentLinks(); // Add verification on click
                                                openAppointmentHistory(
                                                   customer._id, 
                                                   `${customer.firstName} ${customer.lastName}`
                                                );
                                             }}
                                             className={`p-1 rounded-full ${
                                                darkMode 
                                                   ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                                                   : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                             }`}
                                             title="View appointment history"
                                          >
                                             <CalendarIcon className="h-3.5 w-3.5" />
                                          </button>
                                       </div>
                                    </div>
                                    <p className={`text-sm flex items-center ${darkMode ? "text-white" : "text-gray-800"}`}>
                                       <span className={`mr-1 ${customerVisitCounts[customer._id] ? 'text-green-500' : ''}`}>
                                          {customerVisitCounts[customer._id] || 0}
                                       </span> 
                                       <span className={customerVisitCounts[customer._id] ? '' : (darkMode ? 'text-gray-500' : 'text-gray-500')}>
                                          {customerVisitCounts[customer._id] === 1 ? 'appointment' : 'appointments'}
                                       </span>
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div className="flex justify-end space-x-2 mt-4">
                              <button
                                 onClick={() => handleEditCustomer(customer._id)}
                                 className={`inline-flex items-center p-2 rounded-lg transition ${
                                    darkMode
                                       ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                                       : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                 }`}
                              >
                                 <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                 onClick={() => handleDeleteCustomer(customer._id)}
                                 className={`inline-flex items-center p-2 rounded-lg transition ${
                                    darkMode
                                       ? "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                                       : "bg-red-100 text-red-600 hover:bg-red-200"
                                 }`}
                              >
                                 <TrashIcon className="h-5 w-5" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </>
            )}

               {/* Delete Customer Confirmation Dialog */}
               <DeleteCustomerDialog
                  isOpen={!!customerToDelete}
                  isDeleting={isDeleting}
                  onClose={handleCancelDelete}
                  onConfirm={handleConfirmDelete}
                  darkMode={darkMode}
               />
               
               {/* Appointment History Dialog */}
               <AppointmentHistoryDialog
                  isOpen={appointmentHistoryOpen}
                  onClose={handleCloseAppointmentHistory}
                  customerId={selectedCustomerId || ""}
                  customerName={selectedCustomerName}
                  darkMode={darkMode}
               />
            </div>
         </div>
      );
   }
