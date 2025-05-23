import type { Appointment } from "@/types/appointment";
import type { Customer } from "@/types/customer";
import type { Service } from "@/types/service";
import type { Transaction, Category } from "@/types/finance";
import { appointmentAPI } from "./api";

const DB_NAME = "smartBookingCRM";
const DB_VERSION = 7;
const APPOINTMENTS_STORE = "appointments";
const CUSTOMERS_STORE = "customers";
const SETTINGS_STORE = "settings";
const SERVICES_STORE = "services";
const EMPLOYEES_STORE = "employees";
const TRANSACTIONS_STORE = "transactions";
const CATEGORIES_STORE = "categories";

export class IndexedDBService {
   db: IDBDatabase | null = null;

   async initDB(): Promise<void> {
      console.log("Initializing IndexedDB with database name:", DB_NAME);
      
      // Delete old database if it exists
      try {
         await this.deleteOldDatabase();
      } catch (error) {
         console.error("Error deleting old database:", error);
      }
      
      // Check if we need a database upgrade
      const currentVersion = await this.checkDatabaseVersion();
      if (currentVersion && currentVersion < DB_VERSION) {
         console.log(`Database needs upgrade from version ${currentVersion} to ${DB_VERSION}`);
         // Show notification if in browser environment
         if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('dbVersionUpgradeNeeded', 'true');
         }
      }
      
      return new Promise((resolve, reject) => {
         const request = indexedDB.open(DB_NAME, DB_VERSION);

         request.onerror = (event) => {
            console.error("Error opening IndexedDB:", event);
            reject(request.error);
         };

         request.onsuccess = async () => {
            this.db = request.result;
            console.log(`IndexedDB connected successfully to ${DB_NAME}, version ${DB_VERSION}`);
            
            // Check if we need to migrate customer IDs
            try {
               const needsMigration = await this.checkIfCustomersMigrationNeeded();
               if (needsMigration) {
                  console.log("Need to migrate customer IDs to sequential format");
                  await this.migrateCustomersToSequentialIds();
               }
            } catch (migrationError) {
               console.error("Error during migration check:", migrationError);
               // Continue even if migration check fails
            }
            
            resolve();
         };

         request.onupgradeneeded = (event) => {
            console.log(`Upgrading database ${DB_NAME} to version ${DB_VERSION}`);
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Create appointments store if it doesn't exist
            if (!db.objectStoreNames.contains(APPOINTMENTS_STORE)) {
               const store = db.createObjectStore(APPOINTMENTS_STORE, {
                  keyPath: "_id",
               });
               store.createIndex("date", "date", { unique: false });
               store.createIndex("status", "status", { unique: false });
               store.createIndex("customer", "customer", { unique: false });
               console.log(`Created ${APPOINTMENTS_STORE} store`);
            }
            
            // Create customers store if it doesn't exist
            if (!db.objectStoreNames.contains(CUSTOMERS_STORE)) {
               const store = db.createObjectStore(CUSTOMERS_STORE, {
                  keyPath: "_id",
               });
               store.createIndex("email", "email", { unique: false });
               store.createIndex("phone", "phone", { unique: false });
               store.createIndex("name", ["firstName", "lastName"], { unique: false });
               console.log(`Created ${CUSTOMERS_STORE} store`);
            }
            
            // Create settings store if it doesn't exist
            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
               db.createObjectStore(SETTINGS_STORE, {
                  keyPath: "key",
               });
               console.log(`Created ${SETTINGS_STORE} store`);
            }
            
            // Create services store if it doesn't exist
            if (!db.objectStoreNames.contains(SERVICES_STORE)) {
               const store = db.createObjectStore(SERVICES_STORE, {
                  keyPath: "_id",
               });
               store.createIndex("name", "name", { unique: false });
               store.createIndex("category", "category", { unique: false });
               console.log(`Created ${SERVICES_STORE} store successfully`);
            }
            
            // Create employees store if it doesn't exist
            if (!db.objectStoreNames.contains(EMPLOYEES_STORE)) {
               const store = db.createObjectStore(EMPLOYEES_STORE, {
                  keyPath: "_id",
               });
               store.createIndex("role", "role", { unique: false });
               store.createIndex("isActive", "isActive", { unique: false });
               store.createIndex("email", "email", { unique: false });
               console.log(`Created ${EMPLOYEES_STORE} store successfully`);
            }
            
            // Create transactions store if it doesn't exist
            if (!db.objectStoreNames.contains(TRANSACTIONS_STORE)) {
               const store = db.createObjectStore(TRANSACTIONS_STORE, {
                  keyPath: "_id",
               });
               store.createIndex("date", "date", { unique: false });
               store.createIndex("type", "type", { unique: false });
               store.createIndex("category", "category", { unique: false });
               store.createIndex("status", "status", { unique: false });
               console.log(`Created ${TRANSACTIONS_STORE} store successfully`);
            }
            
            // Create categories store if it doesn't exist
            if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
               const store = db.createObjectStore(CATEGORIES_STORE, {
                  keyPath: "_id",
               });
               store.createIndex("name", "name", { unique: false });
               store.createIndex("type", "type", { unique: false });
               console.log(`Created ${CATEGORIES_STORE} store successfully`);
            }
         };
      });
   }

   // Helper to delete old database name if it exists
   private async deleteOldDatabase(): Promise<void> {
      return new Promise((resolve, reject) => {
         const OLD_DB_NAME = "smartBookingDB";
         const deleteRequest = indexedDB.deleteDatabase(OLD_DB_NAME);
         
         deleteRequest.onsuccess = () => {
            console.log("Old database deleted successfully");
            resolve();
         };
         
         deleteRequest.onerror = () => {
            console.error("Error deleting old database:", deleteRequest.error);
            reject(deleteRequest.error);
         };
      });
   }

   // Save a setting value
   async saveSetting(key: string, value: string): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([SETTINGS_STORE], "readwrite");
         const store = transaction.objectStore(SETTINGS_STORE);
         const request = store.put({ key, value });

         request.onsuccess = () => resolve();
         request.onerror = () => reject(request.error);
      });
   }

   // Get a setting value
   async getSetting(key: string): Promise<string | null> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([SETTINGS_STORE], "readonly");
         const store = transaction.objectStore(SETTINGS_STORE);
         const request = store.get(key);

         request.onsuccess = () => resolve(request.result ? request.result.value : null);
         request.onerror = () => reject(request.error);
      });
   }

   // === SERVICE METHODS ===

   // Get all services from IndexedDB
   async getAllServices(): Promise<Service[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([SERVICES_STORE], "readonly");
         const store = transaction.objectStore(SERVICES_STORE);
         const request = store.getAll();

         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
      });
   }

   // Get service by ID
   async getServiceById(id: string): Promise<Service | null> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([SERVICES_STORE], "readonly");
         const store = transaction.objectStore(SERVICES_STORE);
         const request = store.get(id);

         request.onsuccess = () => resolve(request.result || null);
         request.onerror = () => reject(request.error);
      });
   }

   // Search services by name
   async searchServicesByName(searchTerm: string): Promise<Service[]> {
      const allServices = await this.getAllServices();
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      
      return allServices.filter(service => 
         service.name.toLowerCase().includes(lowercaseSearchTerm) ||
         (service.category && service.category.toLowerCase().includes(lowercaseSearchTerm))
      );
   }

   // Validate service data before saving
   private validateService(service: Service): Service {
      // Ensure _id exists
      if (!service._id) {
         service._id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Ensure price is a number
      if (typeof service.price !== 'number') {
         service.price = Number(service.price) || 0;
      }
      
      // Ensure duration exists
      if (!service.duration) {
         service.duration = "30";
      }
      
      // Ensure timestamps exist
      if (!service.createdAt) {
         service.createdAt = new Date().toISOString();
      }
      
      if (!service.updatedAt) {
         service.updatedAt = new Date().toISOString();
      }
      
      return service;
   }

   // Save or update a service
   async saveService(service: Service): Promise<void> {
      await this.ensureDBConnection();
      
      // Validate service data before saving
      const validatedService = this.validateService({...service});
      
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([SERVICES_STORE], "readwrite");
         const store = transaction.objectStore(SERVICES_STORE);
         const request = store.put(validatedService);
         
         request.onsuccess = () => {
            console.log(`Service ${service._id} saved successfully`);
            // Trigger refresh notification
            localStorage.setItem("serviceListShouldRefresh", "true");
            resolve();
         };
         
         request.onerror = () => {
            console.error(`Error saving service ${service._id}:`, request.error);
            reject(request.error);
         };
      });
   }

   // Delete a service
   async deleteService(id: string): Promise<void> {
      await this.ensureDBConnection();
      
      // First, delete all appointments related to this service
      const appointments = await this.getAppointmentsByService(id);
      console.log(`Found ${appointments.length} appointments related to service ${id}`);
      
      for (const appointment of appointments) {
         await this.deleteAppointment(appointment._id);
      }
      
      // Then delete the service
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([SERVICES_STORE], "readwrite");
         const store = transaction.objectStore(SERVICES_STORE);
         const request = store.delete(id);
         
         request.onsuccess = () => {
            console.log(`Service ${id} deleted successfully along with ${appointments.length} appointments`);
            // Trigger refresh notification
            localStorage.setItem("serviceListShouldRefresh", "true");
            // Also trigger refresh for appointments if any were deleted
            if (appointments.length > 0) {
               localStorage.setItem("appointmentListShouldRefresh", "true");
            }
            resolve();
         };
         
         request.onerror = () => {
            console.error(`Error deleting service ${id}:`, request.error);
            reject(request.error);
         };
      });
   }

   // Bulk save multiple services
   async bulkSaveServices(services: Service[]): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SERVICES_STORE], "readwrite");
      const store = transaction.objectStore(SERVICES_STORE);
      
         // Validate services before saving
         const validatedServices = services.map(service => 
            this.validateService({...service})
         );

         validatedServices.forEach((service) => {
            store.put(service);
         });

         transaction.oncomplete = () => resolve();
         transaction.onerror = () => reject(transaction.error);
      });
   }

   // Migrate services from localStorage to IndexedDB
   async migrateServicesFromLocalStorage(): Promise<void> {
      try {
         console.log("Starting migration of services from localStorage to IndexedDB");
         await this.ensureDBConnection();
         
         // Check if there are services in localStorage
         const storedServices = localStorage.getItem("mockServices");
         
         if (storedServices) {
            console.log("Found services in localStorage, migrating to IndexedDB");
            
            try {
               // Parse the stored services
               const services = JSON.parse(storedServices);
               
               if (Array.isArray(services) && services.length > 0) {
                  // Save the services to IndexedDB
                  await this.bulkSaveServices(services);
                  console.log(`Migrated ${services.length} services from localStorage to IndexedDB`);
               }
            } catch (parseError) {
               console.error("Error parsing services from localStorage:", parseError);
            }
            
            // Remove from localStorage after migration
            localStorage.removeItem("mockServices");
         } else {
            console.log("No services found in localStorage to migrate");
         }
         
         console.log("Services migration completed");
         return;
      } catch (error) {
         console.error("Error migrating services from localStorage:", error);
         throw error;
      }
   }

   // Appointment methods
   async getAllAppointments(): Promise<Appointment[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         if (!this.db) {
            console.error("Database connection not established");
            return resolve([]);
         }

         try {
            const transaction = this.db.transaction([APPOINTMENTS_STORE], "readonly");
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const request = store.getAll();

            request.onsuccess = () => {
               const appointments = request.result || [];
               console.log(`Retrieved ${appointments.length} appointments from IndexedDB`);
               resolve(appointments);
            };
            
            request.onerror = (event) => {
               console.error("Error fetching appointments:", event);
               reject(request.error);
            };
            
            transaction.oncomplete = () => {
               console.log("Transaction completed for appointments fetch");
            };
            
            transaction.onerror = (event) => {
               console.error("Transaction error for appointments fetch:", event);
            };
         } catch (error) {
            console.error("Exception in getAllAppointments:", error);
            resolve([]);
         }
      });
   }
   
   // Get appointments by date range
   async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readonly"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const index = store.index("date");
         const range = IDBKeyRange.bound(startDate, endDate);
         const request = index.getAll(range);

         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
      });
   }
   
   // Get appointments by customer
   async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readonly"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const index = store.index("customer");
         const request = index.getAll(customerId);

         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
      });
   }

   // Get appointments by service
   async getAppointmentsByService(serviceId: string): Promise<Appointment[]> {
      await this.ensureDBConnection();
      
      // Get all appointments since there's no direct index for service
      const allAppointments = await this.getAllAppointments();
      
      // Filter appointments by service ID
      return allAppointments.filter(appointment => {
         if (typeof appointment.service === 'string') {
            return appointment.service === serviceId;
         } else if (appointment.service && typeof appointment.service === 'object') {
            // Handle case where service is an object with _id property
            return appointment.service._id === serviceId;
         }
         return false;
      });
   }

   private validateAppointment(appointment: Appointment): Appointment {
      // Ensure _id exists
      if (!appointment._id) {
         appointment._id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Ensure customer exists
      if (!appointment.customer) {
         appointment.customer = "Unknown";
      }
      
      // Ensure service exists
      if (!appointment.service) {
         appointment.service = "Unknown";
      }
      
      // Ensure date is in correct format (YYYY-MM-DD)
      if (!appointment.date || !/^\d{4}-\d{2}-\d{2}$/.test(appointment.date)) {
         const today = new Date();
         appointment.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      
      // Ensure time exists in format HH:MM
      if (!appointment.time || !/^\d{1,2}:\d{2}$/.test(appointment.time)) {
         appointment.time = "12:00";
      }
      
      // Ensure duration exists
      if (!appointment.duration) {
         appointment.duration = "30";
      }
      
      // Ensure status is valid
      if (!appointment.status || !["Pending", "Confirmed", "Canceled", "Completed"].includes(appointment.status)) {
         appointment.status = "Pending";
      }
      
      // Ensure timestamps exist
      if (!appointment.createdAt) {
         appointment.createdAt = new Date().toISOString();
      }
      
      if (!appointment.updatedAt) {
         appointment.updatedAt = new Date().toISOString();
      }
      
      return appointment;
   }

   async saveAppointment(appointment: Appointment): Promise<void> {
      try {
         await this.ensureDBConnection();
         
         // Validate appointment data before saving
         const validatedAppointment = this.validateAppointment({...appointment});
         
         // Check if this is an update or a new appointment by looking for existing ID
         const isUpdate = await this.getAppointmentById(validatedAppointment._id) !== null;
         
         return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
               [APPOINTMENTS_STORE],
               "readwrite"
            );
            const store = transaction.objectStore(APPOINTMENTS_STORE);
            const request = store.put(validatedAppointment);

            request.onsuccess = () => {
               // Emit custom event for real-time chart updates
               const eventName = isUpdate ? 'appointmentUpdated' : 'appointmentAdded';
               window.dispatchEvent(new CustomEvent(eventName, { 
                  detail: validatedAppointment 
               }));
               
               // Set flag for components that rely on localStorage change events
               localStorage.setItem("appointmentListShouldRefresh", Date.now().toString());
               
               resolve();
            };
            request.onerror = () => {
               console.error("Error saving appointment:", request.error);
               reject(request.error);
            };
         });
      } catch (error) {
         console.error("Error in saveAppointment:", error);
         throw error;
      }
   }

   async deleteAppointment(id: string): Promise<void> {
      await this.ensureDBConnection();
      
      // First get the appointment to include in the event detail
      const appointment = await this.getAppointmentById(id);
      
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readwrite"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const request = store.delete(id);

         request.onsuccess = () => {
            // Emit custom event for real-time chart updates
            if (appointment) {
               window.dispatchEvent(new CustomEvent('appointmentDeleted', { 
                  detail: appointment 
               }));
            }
            
            // Set flag for components that rely on localStorage change events 
            localStorage.setItem("appointmentListShouldRefresh", Date.now().toString());
            
            resolve();
         };
         request.onerror = () => reject(request.error);
      });
   }

   async getAppointmentById(id: string): Promise<Appointment | null> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readonly"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const request = store.get(id);

         request.onsuccess = () => resolve(request.result || null);
         request.onerror = () => reject(request.error);
      });
   }

   async bulkSaveAppointments(appointments: Appointment[]): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readwrite"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);

         // Validate appointments before saving
         const validatedAppointments = appointments.map(appointment => 
            this.validateAppointment({...appointment})
         );

         validatedAppointments.forEach((appointment) => {
            store.put(appointment);
         });

         transaction.oncomplete = () => {
            // Emit a bulk update event
            window.dispatchEvent(new CustomEvent('appointmentsBulkUpdated', { 
               detail: { count: validatedAppointments.length } 
            }));
            
            // Set flag for components that rely on localStorage change events
            localStorage.setItem("appointmentListShouldRefresh", Date.now().toString());
            
            resolve();
         };
         transaction.onerror = () => reject(transaction.error);
      });
   }

   // Customer methods
   async getAllCustomers(): Promise<Customer[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         try {
            const transaction = this.db!.transaction(
               [CUSTOMERS_STORE],
               "readonly"
            );
            const store = transaction.objectStore(CUSTOMERS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
         } catch (error) {
            console.error("Error getting all customers:", error);
            reject(error);
         }
      });
   }
   
   // Search customers by name
   async searchCustomersByName(searchTerm: string): Promise<Customer[]> {
      const allCustomers = await this.getAllCustomers();
      
      if (!searchTerm) return allCustomers;
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return allCustomers.filter(customer => {
         const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
         return fullName.includes(lowerSearchTerm) || 
            (customer.email && customer.email.toLowerCase().includes(lowerSearchTerm)) ||
            (customer.phone && customer.phone.includes(lowerSearchTerm));
      });
   }

   // Search customers by exact field match (e.g., email, phone)
   async searchCustomers(criteria: Partial<Customer>): Promise<Customer[]> {
      const allCustomers = await this.getAllCustomers();
      
      return allCustomers.filter(customer => {
         for (const [key, value] of Object.entries(criteria)) {
            if (!value) continue;
            
            if (key === 'phone' && customer.phone) {
               // Normalize phone numbers by removing spaces, parentheses, etc.
               const normalizedSearchPhone = value.replace(/\s+|-|\(|\)|\+/g, '');
               const normalizedCustomerPhone = customer.phone.replace(/\s+|-|\(|\)|\+/g, '');
               
               // If normalized phones don't match, exclude customer
               if (normalizedCustomerPhone !== normalizedSearchPhone) {
                  return false;
               }
            } 
            else if (key === 'email' && customer.email) {
               // Case-insensitive email comparison
               if (customer.email.toLowerCase() !== (value as string).toLowerCase()) {
                  return false;
               }
            }
            else if (customer[key as keyof Customer] !== value) {
               return false;
            }
         }
         return true;
      });
   }

   private validateCustomer(customer: Customer): Customer {
      // Ensure customer has an ID
      if (!customer._id) {
         // Use UUID format for auto-generated IDs (sequential IDs are assigned in customerService)
         customer._id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Ensure first name exists
      if (!customer.firstName) {
         customer.firstName = "Unknown";
      }
      
      // Ensure last name exists
      if (!customer.lastName) {
         customer.lastName = "Customer";
      }
      
      // Ensure timestamps exist
      if (!customer.createdAt) {
         customer.createdAt = new Date().toISOString();
      }
      
      if (!customer.updatedAt) {
         customer.updatedAt = new Date().toISOString();
      }
      
      return customer;
   }

   async saveCustomer(customer: Customer): Promise<void> {
      try {
         await this.ensureDBConnection();
         
         // Validate and ensure required fields
         const validatedCustomer = this.validateCustomer({...customer});
         
         // Check if this is a new customer or an update
         const isNewCustomer = !(await this.getCustomerById(validatedCustomer._id));
         
         return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
               [CUSTOMERS_STORE],
               "readwrite"
            );
            const store = transaction.objectStore(CUSTOMERS_STORE);
            const request = store.put(validatedCustomer);

            request.onsuccess = () => {
               // Emit a custom event when a new customer is added
               if (isNewCustomer) {
                  window.dispatchEvent(new CustomEvent('customerAdded', { 
                     detail: validatedCustomer 
                  }));
                  
                  // Set flag in localStorage for components that listen for storage events
                  localStorage.setItem("newCustomerAdded", Date.now().toString());
               }
               resolve();
            };
            request.onerror = () => {
               console.error("Error saving customer:", request.error);
               reject(request.error);
            };
         });
      } catch (error) {
         console.error("Error in saveCustomer:", error);
         throw error;
      }
   }

   async deleteCustomer(id: string): Promise<void> {
      await this.ensureDBConnection();
      
      // First delete all appointments for this customer
      const appointments = await this.getAppointmentsByCustomer(id);
      for (const appointment of appointments) {
         await this.deleteAppointment(appointment._id);
      }
      
      // Then delete the customer
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [CUSTOMERS_STORE],
            "readwrite"
         );
         const store = transaction.objectStore(CUSTOMERS_STORE);
         const request = store.delete(id);

         request.onsuccess = () => {
            console.log(`Customer ${id} deleted along with ${appointments.length} appointments`);
            resolve();
         };
         request.onerror = () => reject(request.error);
      });
   }

   async getCustomerById(id: string): Promise<Customer | null> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [CUSTOMERS_STORE],
            "readonly"
         );
         const store = transaction.objectStore(CUSTOMERS_STORE);
         const request = store.get(id);

         request.onsuccess = () => resolve(request.result || null);
         request.onerror = () => reject(request.error);
      });
   }

   async bulkSaveCustomers(customers: Customer[]): Promise<void> {
      await this.ensureDBConnection();
      
      // Get existing customer IDs to identify new customers
      const existingCustomers = await this.getAllCustomers();
      const existingIds = new Set(existingCustomers.map(c => c._id));
      
      // Track how many new customers are added
      let newCustomersCount = 0;
      
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [CUSTOMERS_STORE],
            "readwrite"
         );
         const store = transaction.objectStore(CUSTOMERS_STORE);

         // Validate each customer
         const validatedCustomers = customers.map(customer => 
            this.validateCustomer({...customer})
         );

         validatedCustomers.forEach((customer) => {
            // Check if this is a new customer
            if (!existingIds.has(customer._id)) {
               newCustomersCount++;
            }
            store.put(customer);
         });

         transaction.oncomplete = () => {
            // If any new customers were added, dispatch event and update localStorage
            if (newCustomersCount > 0) {
               window.dispatchEvent(new CustomEvent('customersBulkAdded', { 
                  detail: { count: newCustomersCount } 
               }));
               localStorage.setItem("newCustomerAdded", Date.now().toString());
            }
            resolve();
         };
         transaction.onerror = () => reject(transaction.error);
      });
   }

   // Migrate customers from localStorage to IndexedDB
   async migrateCustomersFromLocalStorage(): Promise<void> {
      try {
         const storedCustomers = localStorage.getItem("mockCustomers");
         if (storedCustomers) {
            const customers = JSON.parse(storedCustomers);
            if (Array.isArray(customers) && customers.length > 0) {
               console.log(`Migrating ${customers.length} customers from localStorage to IndexedDB`);
               await this.bulkSaveCustomers(customers);
               console.log("Customer migration completed");
               
               // Clear localStorage data after successful migration
               localStorage.removeItem("mockCustomers");
            }
         }
      } catch (error) {
         console.error("Error migrating customers from localStorage:", error);
      }
   }

   // Migrate existing customers to sequential IDs
   async migrateCustomersToSequentialIds(): Promise<void> {
      try {
         await this.ensureDBConnection();
         
         // Get all existing customers
         const customers = await this.getAllCustomers();
         
         // If no customers, nothing to migrate
         if (customers.length === 0) {
            console.log('No customers to migrate');
            return;
         }
         
         console.log(`Starting migration of ${customers.length} customers`);
         
         // Find the highest current numeric ID
         let highestNumericId = 0;
         const numericIds = customers
            .map(c => parseInt(c._id))
            .filter(id => !isNaN(id));
            
         if (numericIds.length > 0) {
            highestNumericId = Math.max(...numericIds);
         }
         
         // Only convert non-numeric IDs, leave existing numeric IDs intact
         const customersToUpdate = customers.filter(c => isNaN(parseInt(c._id)));
         if (customersToUpdate.length === 0) {
            console.log('No customers need ID conversion');
            return;
         }
         
         console.log(`Converting ${customersToUpdate.length} customers with non-numeric IDs`);
         
         // Create mapping from old to new IDs
         const customerIdMap = new Map();
         
         // Sort by creation date to maintain chronological order
         customersToUpdate.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
         );
         
         // Assign sequential IDs starting after the highest existing ID
         const updatedCustomers = customersToUpdate.map((customer, index) => {
            const newId = String(highestNumericId + index + 1);
            customerIdMap.set(customer._id, newId);
            
            return {
               ...customer,
               _id: newId
            };
         });
         
         // Save each updated customer
         for (const customer of updatedCustomers) {
            // Remove the old customer first
            await this.deleteCustomer(customerIdMap.get(customer._id));
            
            // Then add the updated one
            await this.saveCustomer(customer);
         }
         
         console.log(`Successfully converted ${updatedCustomers.length} customers to sequential IDs`);
         
         // Update appointment references to customer IDs
         const appointments = await this.getAllAppointments();
         const appointmentsToUpdate = appointments.filter(
            app => app.customer && customerIdMap.has(app.customer)
         );
         
         console.log(`Updating ${appointmentsToUpdate.length} appointments with new customer IDs`);
         
         // Update appointment customer references
         for (const appointment of appointmentsToUpdate) {
            const updatedAppointment = {
               ...appointment,
               customer: customerIdMap.get(appointment.customer)
            };
            
            await this.saveAppointment(updatedAppointment);
         }
         
         console.log('Migration complete');
      } catch (error) {
         console.error('Error migrating to sequential IDs:', error);
         throw error;
      }
   }

   // Check if customer IDs need migration to sequential format
   async checkIfCustomersMigrationNeeded(): Promise<boolean> {
      try {
         const customers = await this.getAllCustomers();
         
         // If no customers, no migration needed
         if (customers.length === 0) {
            return false;
         }
         
         // Check if any customer has a non-numeric ID (need to convert those)
         // But we won't resequence existing numeric IDs
         const nonNumericIds = customers.filter(c => isNaN(parseInt(c._id)));
         
         return nonNumericIds.length > 0;
      } catch (error) {
         console.error("Error checking if migration is needed:", error);
         return false;
      }
   }

   // Purge all data but keep the database structure
   async purgeAllData(): Promise<void> {
      await this.ensureDBConnection();
      console.log("Purging all data from database...");
      
      // Purge all customers
      await this.purgeStore(CUSTOMERS_STORE);
      
      // Purge all appointments
      await this.purgeStore(APPOINTMENTS_STORE);
      
      // Purge all services
      await this.purgeStore(SERVICES_STORE);
      
      // Reset settings
      await this.purgeStore(SETTINGS_STORE);
      
      console.log("All data purged successfully");
   }
   
   // Helper to clear a specific store - made public so it can be used externally
   async purgeStore(storeName: string): Promise<void> {
      await this.ensureDBConnection();
      
      return new Promise((resolve, reject) => {
         try {
            const transaction = this.db!.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => {
               console.log(`Successfully cleared ${storeName} store`);
               resolve();
            };

            request.onerror = (event) => {
               console.error(`Error clearing ${storeName} store:`, event);
               reject(request.error);
            };
         } catch (error) {
            console.error(`Error clearing ${storeName} store:`, error);
            reject(error);
         }
      });
   }

   // Reset the database - creates empty database with no sample data
   async resetDatabase(): Promise<void> {
      return new Promise((resolve, reject) => {
         // Close connection if open
         if (this.db) {
            this.db.close();
            this.db = null;
         }
         
         // Delete the database
         const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
         
         deleteRequest.onsuccess = async () => {
            console.log("Database deleted successfully");
            
            // Reinitialize with new schema
            try {
               await this.initDB();
               console.log("Database reinitialized with empty stores");
               resolve();
            } catch (error) {
               console.error("Error reinitializing database:", error);
               reject(error);
            }
         };
         
         deleteRequest.onerror = () => {
            console.error("Error deleting database:", deleteRequest.error);
            reject(deleteRequest.error);
         };
      });
   }

   private async ensureDBConnection(): Promise<void> {
      try {
         if (!this.db) {
            await this.initDB();
         }
         
         // Verify connection is still valid
         if (this.db && !this.db.objectStoreNames.contains(APPOINTMENTS_STORE)) {
            this.db.close();
            this.db = null;
            await this.initDB();
         }
      } catch (error) {
         console.error("Error ensuring DB connection:", error);
         // Try one more time to initialize
         this.db = null;
         await this.initDB();
      }
   }

   // Get an approximate size of all data in the database
   async getApproximateSize(): Promise<number> {
      await this.ensureDBConnection();
      let totalSizeBytes = 0;
      
      const allStores = [
         CUSTOMERS_STORE,
         APPOINTMENTS_STORE,
         SERVICES_STORE,
         SETTINGS_STORE,
         EMPLOYEES_STORE
      ];
      
      for (const storeName of allStores) {
         try {
            const data = await this.getAllFromStore(storeName);
            
            // Estimate the size of this store's data by converting to JSON and measuring string length
            const dataString = JSON.stringify(data);
            const storeSize = new Blob([dataString]).size;
            
            totalSizeBytes += storeSize;
            console.log(`Estimated size of ${storeName}: ${storeSize} bytes`);
         } catch (error) {
            console.error(`Error calculating size for ${storeName}:`, error);
            // Continue with other stores even if one fails
         }
      }
      
      return totalSizeBytes;
   }

   // Generic methods for any store

   // Get all items from any store
   async getAllItems(storeName: string): Promise<any[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         try {
            const transaction = this.db!.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
               console.error(`Error getting all items from ${storeName}:`, request.error);
               reject(request.error);
            };
         } catch (error) {
            console.error(`Error getting all items from ${storeName}:`, error);
            reject(error);
         }
      });
   }

   // Get item by ID from any store
   async getItem(storeName: string, id: string): Promise<any | null> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         try {
            const transaction = this.db!.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => {
               console.error(`Error getting item from ${storeName}:`, request.error);
               reject(request.error);
            };
         } catch (error) {
            console.error(`Error getting item from ${storeName}:`, error);
            reject(error);
         }
      });
   }

   // Add item to any store
   async addItem(storeName: string, item: any): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         try {
            const transaction = this.db!.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            
            // If item doesn't have _id, generate one
            if (!item._id) {
               item._id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }
            
            // Using put instead of add to handle updates as well
            const request = store.put(item);

            request.onsuccess = () => {
               console.log(`Item added/updated in ${storeName} successfully:`, item._id);
               resolve();
            };
            request.onerror = () => {
               console.error(`Error adding/updating item in ${storeName}:`, request.error);
               reject(request.error);
            };
         } catch (error) {
            console.error(`Error in addItem for ${storeName}:`, error);
            reject(error);
         }
      });
   }

   // Update item in any store
   async updateItem(storeName: string, id: string, item: any): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         try {
            const transaction = this.db!.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            
            // Ensure the item has the correct ID
            item._id = id;
            
            const request = store.put(item);

            request.onsuccess = () => {
               console.log(`Item updated in ${storeName} successfully`);
               resolve();
            };
            request.onerror = () => {
               console.error(`Error updating item in ${storeName}:`, request.error);
               reject(request.error);
            };
         } catch (error) {
            console.error(`Error updating item in ${storeName}:`, error);
            reject(error);
         }
      });
   }

   // Delete item from any store
   async deleteItem(storeName: string, id: string): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         try {
            const transaction = this.db!.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
               console.log(`Item deleted from ${storeName} successfully`);
               resolve();
            };
            request.onerror = () => {
               console.error(`Error deleting item from ${storeName}:`, request.error);
               reject(request.error);
            };
         } catch (error) {
            console.error(`Error deleting item from ${storeName}:`, error);
            reject(error);
         }
      });
   }

   // Get all data from any store - helper used by getApproximateSize
   private async getAllFromStore(storeName: string): Promise<any[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([storeName], "readonly");
         const store = transaction.objectStore(storeName);
         const request = store.getAll();

         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
      });
   }

   // Check current database version without opening with upgrade flag
   private async checkDatabaseVersion(): Promise<number | null> {
      return new Promise((resolve) => {
         try {
            const request = indexedDB.open(DB_NAME);
            
            request.onsuccess = (event) => {
               const db = (event.target as IDBOpenDBRequest).result;
               const version = db.version;
               db.close();
               resolve(version);
            };
            
            request.onerror = () => {
               console.error("Error checking database version");
               resolve(null);
            };
         } catch (error) {
            console.error("Exception checking database version:", error);
            resolve(null);
         }
      });
   }

   // === GENERAL STORE METHODS (for any store) ===
   
   async getAllFromStore(storeName: string): Promise<any[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([storeName], "readonly");
         const store = transaction.objectStore(storeName);
         const request = store.getAll();

         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
      });
   }
   
   async getFromStore(storeName: string, id: string): Promise<any | null> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([storeName], "readonly");
         const store = transaction.objectStore(storeName);
         const request = store.get(id);

         request.onsuccess = () => resolve(request.result || null);
         request.onerror = () => reject(request.error);
      });
   }
   
   async saveToStore(storeName: string, item: any): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([storeName], "readwrite");
         const store = transaction.objectStore(storeName);
         const request = store.put(item);

         request.onsuccess = () => resolve();
         request.onerror = () => reject(request.error);
      });
   }
   
   async deleteFromStore(storeName: string, id: string): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction([storeName], "readwrite");
         const store = transaction.objectStore(storeName);
         const request = store.delete(id);

         request.onsuccess = () => resolve();
         request.onerror = () => reject(request.error);
      });
   }
   
   // === TRANSACTION METHODS ===
   
   async getAllTransactions(): Promise<Transaction[]> {
      return this.getAllFromStore(TRANSACTIONS_STORE);
   }
   
   async getTransactionById(id: string): Promise<Transaction | null> {
      return this.getFromStore(TRANSACTIONS_STORE, id);
   }
   
   async saveTransaction(transaction: Transaction): Promise<void> {
      return this.saveToStore(TRANSACTIONS_STORE, transaction);
   }
   
   async deleteTransaction(id: string): Promise<void> {
      return this.deleteFromStore(TRANSACTIONS_STORE, id);
   }
   
   async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.filter((transaction) => {
         const transactionDate = new Date(transaction.date);
         const start = new Date(startDate);
         const end = new Date(endDate);
         
         // Set hours to 0 for date-only comparison
         start.setHours(0, 0, 0, 0);
         end.setHours(23, 59, 59, 999);
         
         return transactionDate >= start && transactionDate <= end;
      });
   }
   
   async getTransactionsByType(type: 'income' | 'expense'): Promise<Transaction[]> {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.filter(transaction => transaction.type === type);
   }
   
   async getTransactionsByCategory(categoryId: string): Promise<Transaction[]> {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.filter(transaction => {
         if (typeof transaction.category === 'string') {
            return transaction.category === categoryId;
         } else {
            return transaction.category._id === categoryId;
         }
      });
   }
   
   // === CATEGORY METHODS ===
   
   async getAllCategories(): Promise<Category[]> {
      return this.getAllFromStore(CATEGORIES_STORE);
   }
   
   async getCategoryById(id: string): Promise<Category | null> {
      return this.getFromStore(CATEGORIES_STORE, id);
   }
   
   async saveCategory(category: Category): Promise<void> {
      return this.saveToStore(CATEGORIES_STORE, category);
   }
   
   async deleteCategory(id: string): Promise<void> {
      return this.deleteFromStore(CATEGORIES_STORE, id);
   }
   
   async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
      const allCategories = await this.getAllCategories();
      return allCategories.filter(category => category.type === type);
   }
}

export const indexedDBService = new IndexedDBService();

// Create a simple function to check if the database exists
async function testDatabaseAccess() {
  try {
    console.log("Attempting direct database open test for:", DB_NAME);
    
    // First try to directly open the database
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      console.log(`Direct test - Database upgrade needed from ${event.oldVersion} to ${DB_VERSION}`);
      const db = request.result;
      
      // Create basic stores if needed
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        console.log("Creating settings store during test");
        db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
      }
    };
    
    request.onsuccess = () => {
      console.log("SUCCESS: Direct database test completed - DB opened successfully:", request.result);
      request.result.close();
    };
    
    request.onerror = (event) => {
      console.error("ERROR: Direct database test failed:", request.error);
    };
  } catch (error) {
    console.error("CRITICAL ERROR during direct database test:", error);
  }
}

// Initialize the database connection when the module is loaded
if (typeof window !== 'undefined') {
  console.log("===== INITIALIZING DATABASE =====");
  console.log("Browser:", navigator.userAgent);
  console.log("Database Name:", DB_NAME);
  console.log("Database Version:", DB_VERSION);
  
  // First try the direct test
  setTimeout(() => {
    testDatabaseAccess().catch(err => console.error("Test database access failed:", err));
  }, 1000);
  
  // Then try the normal initialization
  setTimeout(() => {
    indexedDBService.initDB().catch(error => {
      console.error("Failed to initialize IndexedDB through service:", error);
    });
  }, 2000);
}
