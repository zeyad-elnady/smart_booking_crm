import { Customer } from "./customer";
import { Service } from "./service";

export type AppointmentStatus =
   | "Pending"
   | "Confirmed"
   | "Canceled"
   | "Completed";

export interface AppointmentData {
   customer: string;
   service: string;
   date: string;
   time: string;
   duration: string;
   notes?: string;
   status?: AppointmentStatus;
   customerInfo?: {
      name: string;
      firstName: string;
      lastName: string;
   };
   serviceInfo?: {
      name: string;
      price: number;
      duration: string;
   };
}

export interface Appointment extends AppointmentData {
   _id: string;
   customer: string | { _id: string; firstName: string; lastName: string };
   service: string | { _id: string; name: string; price: number; duration: string };
   date: string;
   time: string;
   duration: string;
   notes?: string;
   status: AppointmentStatus;
   createdAt?: string;
   updatedAt?: string;
   price?: number;
   customerInfo?: {
      name: string;
      firstName: string;
      lastName: string;
   };
   serviceInfo?: {
      name: string;
      price: number;
      duration: string;
   };
   pendingSync?: boolean;
   pendingDelete?: boolean;
   userId?: string;
   user?: {
      _id: string;
      name?: string;
      email?: string;
   };
}

export interface AppointmentFormData {
   customer: string;
   service: string;
   date: string;
   time: string;
   notes?: string;
   status?: AppointmentStatus;
}

export const getStatusColor = (status: AppointmentStatus): string => {
   switch (status) {
      case "Confirmed":
         return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Canceled":
         return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Completed":
         return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Pending":
      default:
         return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
   }
};
