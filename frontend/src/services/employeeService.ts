import { Employee, EmployeeData } from "@/types/employee";
import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";
import axios from "./axiosConfig";

const EMPLOYEE_STORE = "employees";

// Generate a sequential ID for new employees
const generateEmployeeId = async (): Promise<string> => {
  try {
    const employees = await indexedDBService.getAllItems(EMPLOYEE_STORE);
    const numericIds = employees
      .map(e => parseInt(e._id))
      .filter(id => !isNaN(id));
    
    // If no employees yet, start with ID 1000
    const highestId = numericIds.length > 0 ? Math.max(...numericIds) : 999;
    return (highestId + 1).toString();
  } catch (error) {
    console.error("Error generating employee ID:", error);
    // Fallback to timestamp-based ID
    return `temp_${Date.now()}`;
  }
};

// Initialize IndexedDB
export const initializeEmployeeStore = async (): Promise<void> => {
  try {
    await indexedDBService.initDB();
    console.log("Employee store initialized successfully");
  } catch (error) {
    console.error("Error initializing employee store:", error);
  }
};

// Create a new employee
export const createEmployee = async (employeeData: EmployeeData): Promise<Employee> => {
  try {
    await indexedDBService.initDB();
    
    // Generate ID for new employee
    const id = await generateEmployeeId();
    
    // Create employee object
    const employee: Employee = {
      ...employeeData,
      _id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: employeeData.isActive !== undefined ? employeeData.isActive : true
    };
    
    // Save to IndexedDB
    await indexedDBService.addItem(EMPLOYEE_STORE, employee);
    
    // Set flag to refresh employee list in UI
    localStorage.setItem("employeeListShouldRefresh", "true");
    
    toast.success("Employee added successfully");
    return employee;
  } catch (error) {
    console.error("Error creating employee:", error);
    toast.error("Failed to add employee");
    throw error;
  }
};

// Update an existing employee
export const updateEmployee = async (id: string, employeeData: Partial<Employee>): Promise<Employee> => {
  try {
    await indexedDBService.initDB();
    
    // Get existing employee
    const existingEmployee = await indexedDBService.getItem(EMPLOYEE_STORE, id);
    if (!existingEmployee) {
      throw new Error(`Employee with ID ${id} not found`);
    }
    
    // Create updated employee object
    const updatedEmployee: Employee = {
      ...existingEmployee,
      ...employeeData,
      updatedAt: new Date().toISOString()
    };
    
    // Save to IndexedDB
    await indexedDBService.updateItem(EMPLOYEE_STORE, id, updatedEmployee);
    
    // Set flag to refresh employee list in UI
    localStorage.setItem("employeeListShouldRefresh", "true");
    
    toast.success("Employee updated successfully");
    return updatedEmployee;
  } catch (error) {
    console.error(`Error updating employee ${id}:`, error);
    toast.error("Failed to update employee");
    throw error;
  }
};

// Delete an employee
export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await indexedDBService.initDB();
    
    // Delete from IndexedDB
    await indexedDBService.deleteItem(EMPLOYEE_STORE, id);
    
    // Set flag to refresh employee list in UI
    localStorage.setItem("employeeListShouldRefresh", "true");
    
    toast.success("Employee deleted successfully");
  } catch (error) {
    console.error(`Error deleting employee ${id}:`, error);
    toast.error("Failed to delete employee");
    throw error;
  }
};

// Get employee by ID
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    await indexedDBService.initDB();
    return await indexedDBService.getItem(EMPLOYEE_STORE, id);
  } catch (error) {
    console.error(`Error getting employee ${id}:`, error);
    throw error;
  }
};

// Get all employees
export const getAllEmployees = async (): Promise<Employee[]> => {
  try {
    await indexedDBService.initDB();
    return await indexedDBService.getAllItems(EMPLOYEE_STORE);
  } catch (error) {
    console.error("Error getting all employees:", error);
    toast.error("Failed to load employees");
    return [];
  }
};

// Search employees by name or other criteria
export const searchEmployees = async (searchTerm: string): Promise<Employee[]> => {
  try {
    const employees = await getAllEmployees();
    
    if (!searchTerm) {
      return employees;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return employees.filter(employee => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return fullName.includes(lowerSearchTerm) ||
        (employee.email && employee.email.toLowerCase().includes(lowerSearchTerm)) ||
        (employee.phone && employee.phone.includes(lowerSearchTerm)) ||
        (employee.role && employee.role.toLowerCase().includes(lowerSearchTerm)) ||
        (employee.specialization && employee.specialization.toLowerCase().includes(lowerSearchTerm));
    });
  } catch (error) {
    console.error("Error searching employees:", error);
    return [];
  }
};

// Filter employees by role
export const filterEmployeesByRole = async (role: string): Promise<Employee[]> => {
  try {
    const employees = await getAllEmployees();
    
    if (!role) {
      return employees;
    }
    
    return employees.filter(employee => 
      employee.role && employee.role.toLowerCase() === role.toLowerCase()
    );
  } catch (error) {
    console.error(`Error filtering employees by role ${role}:`, error);
    return [];
  }
};

// Create sample employees for initial data
export const createSampleEmployees = async (): Promise<void> => {
  try {
    const employees = await getAllEmployees();
    
    // Only create samples if no employees exist
    if (employees.length === 0) {
      console.log("Creating sample employees");
      
      const sampleEmployees: EmployeeData[] = [
        {
          firstName: "Ahmed",
          lastName: "Mohamed",
          role: "Doctor",
          specialization: "Cardiology",
          email: "ahmed.mohamed@clinic.com",
          phone: "0123456789",
          qualifications: "MD, PhD in Cardiology",
          yearsOfExperience: 10,
          rate: 300,
          currency: "EGP",
          hiringDate: "2020-01-15",
          isActive: true,
          notes: "Senior cardiologist with excellent patient reviews"
        },
        {
          firstName: "Fatma",
          lastName: "Ibrahim",
          role: "Nurse",
          // No email provided
          phone: "0123456788",
          qualifications: "BSc. Nursing",
          yearsOfExperience: 5,
          rate: 150,
          currency: "EGP",
          hiringDate: "2021-03-10",
          isActive: true
        },
        {
          firstName: "Mohamed",
          lastName: "Ali",
          role: "Receptionist",
          email: "mohamed.ali@clinic.com",
          phone: "0123456787",
          yearsOfExperience: 3,
          rate: 100,
          currency: "EGP",
          hiringDate: "2022-05-20",
          isActive: true
        }
      ];
      
      for (const employeeData of sampleEmployees) {
        await createEmployee(employeeData);
      }
      
      console.log("Sample employees created successfully");
    }
  } catch (error) {
    console.error("Error creating sample employees:", error);
  }
};

