import type { Appointment } from "./appointment";

export interface MedicalCondition {
  name: string;
  details?: string;
}

export interface Allergy {
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

export interface CustomField {
  name: string;
  value?: string;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type fields
}

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
   
   // Medical information
   age?: number;
   medicalConditions?: MedicalCondition[];
   allergies?: Allergy[];
   medicalNotes?: string;
   customFields?: CustomField[];
}
