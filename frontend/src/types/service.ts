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
   staffCount?: number; // Number of staff members working on this service
   createdAt?: string;
   updatedAt?: string;
}
