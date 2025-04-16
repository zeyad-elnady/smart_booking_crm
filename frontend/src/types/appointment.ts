import { Customer } from "./customer";
import { Service } from "./service";

export type AppointmentStatus = "Waiting" | "Cancelled" | "Completed";

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
      case "Waiting":
         return "from-blue-500 to-blue-600";
      case "Cancelled":
         return "from-red-500 to-red-600";
      case "Completed":
         return "from-green-500 to-green-600";
      default:
         return "from-gray-500 to-gray-600";
   }
};
