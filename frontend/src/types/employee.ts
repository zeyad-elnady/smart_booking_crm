export interface EmployeeData {
  firstName: string;
  lastName: string;
  role: string;
  specialization?: string; // For doctors
  email?: string; // Now optional
  phone: string; // Required - unique identifier
  address?: string;
  qualifications?: string;
  yearsOfExperience?: number;
  rate?: number; // Hourly or monthly rate
  currency?: string; // Default to EGP
  hiringDate?: string;
  schedule?: {
    sunday?: { start?: string; end?: string; };
    monday?: { start?: string; end?: string; };
    tuesday?: { start?: string; end?: string; };
    wednesday?: { start?: string; end?: string; };
    thursday?: { start?: string; end?: string; };
    friday?: { start?: string; end?: string; };
    saturday?: { start?: string; end?: string; };
  };
  notes?: string;
  isActive?: boolean;
}

export interface Employee extends EmployeeData {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EmployeeRole = 
  | "Doctor" 
  | "Nurse" 
  | "Receptionist" 
  | "Administrator" 
  | "Pharmacist"
  | "Laboratory Technician"
  | "X-Ray Technician"
  | "Accountant"
  | "Other";

export const employeeRoles: EmployeeRole[] = [
  "Doctor", 
  "Nurse", 
  "Receptionist", 
  "Administrator", 
  "Pharmacist",
  "Laboratory Technician",
  "X-Ray Technician", 
  "Accountant",
  "Other"
];

export const doctorSpecializations = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Urology",
  "Other"
]; 