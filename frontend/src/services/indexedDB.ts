import { Appointment } from "./api";

const DB_NAME = "smartBookingCRM";
const DB_VERSION = 1;
const APPOINTMENTS_STORE = "appointments";

export class IndexedDBService {
   private db: IDBDatabase | null = null;

   async initDB(): Promise<void> {
      return new Promise((resolve, reject) => {
         const request = indexedDB.open(DB_NAME, DB_VERSION);

         request.onerror = () => {
            console.error("Error opening IndexedDB");
            reject(request.error);
         };

         request.onsuccess = () => {
            this.db = request.result;
            resolve();
         };

         request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(APPOINTMENTS_STORE)) {
               const store = db.createObjectStore(APPOINTMENTS_STORE, {
                  keyPath: "_id",
               });
               store.createIndex("date", "date", { unique: false });
               store.createIndex("status", "status", { unique: false });
            }
         };
      });
   }

   async getAllAppointments(): Promise<Appointment[]> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readonly"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const request = store.getAll();

         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(request.error);
      });
   }

   async saveAppointment(appointment: Appointment): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readwrite"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const request = store.put(appointment);

         request.onsuccess = () => resolve();
         request.onerror = () => reject(request.error);
      });
   }

   async deleteAppointment(id: string): Promise<void> {
      await this.ensureDBConnection();
      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(
            [APPOINTMENTS_STORE],
            "readwrite"
         );
         const store = transaction.objectStore(APPOINTMENTS_STORE);
         const request = store.delete(id);

         request.onsuccess = () => resolve();
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

         appointments.forEach((appointment) => {
            store.put(appointment);
         });

         transaction.oncomplete = () => resolve();
         transaction.onerror = () => reject(transaction.error);
      });
   }

   private async ensureDBConnection(): Promise<void> {
      if (!this.db) {
         await this.initDB();
      }
   }
}

export const indexedDBService = new IndexedDBService();
