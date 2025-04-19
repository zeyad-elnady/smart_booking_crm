"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function Settings() {
   const { darkMode } = useTheme();
   const [dbSize, setDbSize] = useState("Unknown");
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      // Simple effect to simulate data loading
      const timer = setTimeout(() => {
         setLoading(false);
         // Set a mock DB size
         setDbSize("1.24 MB");
      }, 500);
      
      return () => clearTimeout(timer);
   }, []);

   const handleSignOut = () => {
      // Just clear everything in localStorage
      localStorage.clear();
      // Reload the page to simulate logout
      window.location.href = "/";
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className={darkMode ? "text-white" : "text-gray-800"}>
               Loading settings...
            </div>
         </div>
      );
   }

   return (
      <div className={`p-6 space-y-8 max-w-5xl mx-auto ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
         <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-1 text-sm opacity-80">
               Manage your application preferences and data
            </p>
         </div>

         {/* Database Information Section */}
         <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className="text-lg font-medium mb-4">Database Information</h3>
            
            <div className="space-y-4">
               <div className="flex items-center">
                  <span>Database name: <span className="font-medium">smartBookingDB</span></span>
               </div>
               
               <div className="flex items-center">
                  <span>Storage size: <span className="font-medium">{dbSize}</span></span>
               </div>
               
               <div className="flex items-center">
                  <span>Storage type: <span className="font-medium">IndexedDB (Browser Storage)</span></span>
               </div>
            </div>
         </div>

         {/* Danger Zone */}
         <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-red-900/20" : "border-gray-200 bg-red-50"}`}>
            <h3 className="text-lg font-medium mb-4">Danger Zone</h3>
            <button
               onClick={handleSignOut}
               className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
               Sign Out
            </button>
         </div>
      </div>
   );
}
