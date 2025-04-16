export interface Service {
   _id: string;
   name: string;
   description?: string;
   duration: number; // in minutes
   price: number;
   category?: string;
   createdAt?: string;
   updatedAt?: string;
}
