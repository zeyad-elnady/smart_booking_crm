import { indexedDBService } from "./indexedDB";
import { initializeEmployeeStore } from "./employeeService";
import { checkDatabaseVersion, checkDataConsistency } from "./dbMigrationUtils";
import { initializeFinanceStores } from "./financeService";
import { toast } from "react-hot-toast";

// Initialize all database services
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Initialize IndexedDB
    await indexedDBService.initDB();
    console.log("IndexedDB initialized successfully");
    
    // Initialize employee store
    await initializeEmployeeStore();
    console.log("Employee store initialized successfully");
    
    // Initialize finance stores
    await initializeFinanceStores();
    console.log("Finance stores initialized successfully");
    
    // Check if database version needs upgrading
    const needsUpgrade = await checkDatabaseVersion();
    if (needsUpgrade) {
      console.log("Database version needs upgrading");
      localStorage.setItem("dbVersionUpgradeNeeded", "true");
    }
    
    // Check for data consistency issues
    try {
      await checkDataConsistency();
    } catch (consistencyError) {
      console.error("Error checking data consistency:", consistencyError);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error initializing database:", error);
    toast.error("Failed to initialize database");
    return Promise.reject(error);
  }
}; 