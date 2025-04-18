export interface Service {
   _id: string;
   name: string;
   description?: string;
   duration: string; // Duration as string to match Appointment model
   price: number;
   category?: string;
   createdAt?: string;
   updatedAt?: string;
}
