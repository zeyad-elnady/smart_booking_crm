import { Customer } from "./customer";
import { Service } from "./service";

export type AppointmentStatus = "Pending" | "Confirmed" | "Canceled";

export interface AppointmentData {
   customer: string;
   service: string;
   date: string;
   time: string;
   duration: string;
   notes?: string;
   status: AppointmentStatus;
}

export interface Appointment
   extends Omit<AppointmentData, "customer" | "service"> {
   _id: string;
   customer: Customer | string;
   service: Service | string;
   createdAt?: string;
   updatedAt?: string;
}

export interface AppointmentFormData {
   customerId: string;
   serviceId: string;
   date: string;
   time: string;
   duration: string;
   notes?: string;
   status: AppointmentStatus;
}

export const getStatusColor = (status: AppointmentStatus): string => {
   switch (status) {
      case "Pending":
         return "from-yellow-500 to-yellow-600";
      case "Canceled":
         return "from-red-500 to-red-600";
      case "Confirmed":
         return "from-green-500 to-green-600";
      default:
         return "from-gray-500 to-gray-600";
   }
};
