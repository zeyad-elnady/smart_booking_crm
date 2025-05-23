import { indexedDBService } from "./indexedDB";
import { toast } from "react-hot-toast";

/**
 * Database migration and data consistency utilities
 */

// Database names and version constants
const DB_NAME = "smartBookingCRM";
const CURRENT_VERSION = 6; // This should match the version in indexedDB.ts

// Check if database needs an upgrade
export const checkDatabaseVersion = async (): Promise<boolean> => {
  try {
    const request = indexedDB.open(DB_NAME);
    
    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const currentVersion = db.version;
        db.close();
        
        console.log(`Current database version: ${currentVersion}, Required version: ${CURRENT_VERSION}`);
        resolve(currentVersion < CURRENT_VERSION);
      };
      
      request.onerror = () => {
        console.error("Error checking database version");
        resolve(false);
      };
    });
  } catch (error) {
    console.error("Exception checking database version:", error);
    return false;
  }
};

// Fix database schema issues by recreating the database
export const upgradeDatabase = async (): Promise<void> => {
  try {
    // First backup all data
    const backupData = await backupAllData();
    
    // Delete the existing database
    await deleteDatabase();
    
    // Reinitialize the database (this will create with new schema)
    await indexedDBService.initDB();
    
    // Restore data
    await restoreAllData(backupData);
    
    // Remove the upgrade needed flag
    localStorage.removeItem("dbVersionUpgradeNeeded");
    
    toast.success("Database updated successfully!");
  } catch (error) {
    console.error("Error during database upgrade:", error);
    toast.error("Database update failed. Please try again.");
  }
};

// Backup all data from the database
const backupAllData = async (): Promise<any> => {
  try {
    const stores = ["customers", "appointments", "services", "employees", "settings"];
    const backup: Record<string, any[]> = {};
    
    for (const store of stores) {
      try {
        backup[store] = await indexedDBService.getAllItems(store);
      } catch (error) {
        console.warn(`Error backing up store ${store}:`, error);
        backup[store] = [];
      }
    }
    
    return backup;
  } catch (error) {
    console.error("Error backing up data:", error);
    throw error;
  }
};

// Delete the database completely
const deleteDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    deleteRequest.onsuccess = () => {
      console.log("Database deleted successfully for upgrade");
      resolve();
    };
    
    deleteRequest.onerror = () => {
      console.error("Error deleting database:", deleteRequest.error);
      reject(deleteRequest.error);
    };
  });
};

// Restore all backed up data
const restoreAllData = async (backupData: Record<string, any[]>): Promise<void> => {
  try {
    // Wait for the database to initialize
    await indexedDBService.initDB();
    
    // Restore each store's data
    for (const [store, items] of Object.entries(backupData)) {
      if (items && items.length > 0) {
        console.log(`Restoring ${items.length} items to ${store}`);
        
        for (const item of items) {
          try {
            await indexedDBService.addItem(store, item);
          } catch (error) {
            console.warn(`Error restoring item to ${store}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error restoring data:", error);
    throw error;
  }
};

// Check for database consistency issues
export const checkDataConsistency = async (): Promise<string[]> => {
  const issues: string[] = [];
  
  try {
    await indexedDBService.initDB();
    
    // Check for employees with duplicate emails
    const employees = await indexedDBService.getAllItems("employees");
    const emailCounts = countDuplicates(employees, "email");
    for (const [email, count] of Object.entries(emailCounts)) {
      if (count > 1) {
        issues.push(`Found ${count} employees with the same email: ${email}`);
      }
    }
    
    // Check for customers with duplicate emails or phones
    const customers = await indexedDBService.getAllItems("customers");
    const customerEmailCounts = countDuplicates(customers, "email");
    const customerPhoneCounts = countDuplicates(customers, "phone");
    
    for (const [email, count] of Object.entries(customerEmailCounts)) {
      if (count > 1 && email) {
        issues.push(`Found ${count} customers with the same email: ${email}`);
      }
    }
    
    for (const [phone, count] of Object.entries(customerPhoneCounts)) {
      if (count > 1 && phone) {
        issues.push(`Found ${count} customers with the same phone: ${phone}`);
      }
    }
  } catch (error) {
    console.error("Error checking data consistency:", error);
    issues.push("Error checking database consistency: " + String(error));
  }
  
  return issues;
};

// Helper to count duplicate values in an array of objects
const countDuplicates = (items: any[], field: string): Record<string, number> => {
  const counts: Record<string, number> = {};
  
  for (const item of items) {
    if (item[field]) {
      const value = item[field];
      counts[value] = (counts[value] || 0) + 1;
    }
  }
  
  // Filter out non-duplicates
  return Object.fromEntries(
    Object.entries(counts).filter(([_, count]) => count > 0)
  );
}; 