"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { checkDatabaseVersion, upgradeDatabase } from "@/services/dbMigrationUtils";

/**
 * Component that checks if a database upgrade is needed and shows a notification
 */
export default function DatabaseUpgradeAlert() {
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    // Check both localStorage flag and actual DB version
    const checkUpgradeNeeded = async () => {
      const localFlag = localStorage.getItem("dbVersionUpgradeNeeded") === "true";
      const needsVersionUpgrade = await checkDatabaseVersion();
      
      setUpgradeNeeded(localFlag || needsVersionUpgrade);
      
      // Set the flag if version check indicates an upgrade is needed
      if (needsVersionUpgrade) {
        localStorage.setItem("dbVersionUpgradeNeeded", "true");
      }
    };
    
    checkUpgradeNeeded();
  }, []);
  
  // Don't render anything if no upgrade is needed
  if (!upgradeNeeded) {
    return null;
  }
  
  const handleUpgrade = async () => {
    // Set updating state to show progress
    setIsUpdating(true);
    
    try {
      // Upgrade the database
      await upgradeDatabase();
      
      // Clear the flag and set state
      localStorage.removeItem("dbVersionUpgradeNeeded");
      setUpgradeNeeded(false);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error upgrading database:", error);
      // Keep the alert visible
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-amber-900/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-xl border border-amber-500/30 animate-fadeIn">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium mb-1">Database Update Required</h3>
          <p className="text-sm text-amber-100/90 mb-3">
            The application database structure has been updated. Please update now to ensure everything works correctly.
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleUpgrade}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Update Database"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 