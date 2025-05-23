import type { Appointment } from "./appointment";

export interface Customer {
   _id: string;
   firstName: string;
   lastName: string;
   email?: string;
   phone: string;
   address?: string;
   notes?: string;
   createdAt?: string;
   updatedAt?: string;
   appointments?: Appointment[]; // Array of appointments with proper typing
   lastVisit?: string; // Date string of customer's last appointment
}
