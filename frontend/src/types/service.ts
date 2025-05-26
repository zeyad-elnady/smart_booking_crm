export interface Service {
   _id: string;
   name: string;
   description?: string;
   duration: string; // Duration as string to match Appointment model
   price: number;
   category?: string;
   image?: string;
   availability?: {
      useBusinessHours: boolean;
      customHours?: {
         start: string;
         end: string;
      };
      daysAvailable?: number[];
   };
   isActive?: boolean;
   assignedEmployeeIds?: string[]; // Array of employee IDs assigned to this service
   createdAt?: string;
   updatedAt?: string;
}
