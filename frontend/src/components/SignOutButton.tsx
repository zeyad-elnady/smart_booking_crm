"use client";

import React from "react";

export default function SignOutButton({ className = "" }) {
   const handleSignOut = (e: React.MouseEvent) => {
      e.preventDefault();

      try {
         // Clear localStorage
         window.localStorage.removeItem("token");
         window.localStorage.removeItem("user");

         // Clear cookies with multiple approaches
         document.cookie =
            "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
         document.cookie =
            "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" +
            window.location.hostname;
         document.cookie = "token=; max-age=0; path=/;";

         console.log("SignOutButton: Cleared all authentication data");

         // Force navigation
         window.location.href = "/login";

         // Fallback in case the above doesn't trigger immediately
         setTimeout(() => {
            window.location.href = "/login";
         }, 100);
      } catch (error) {
         console.error("SignOut error:", error);
         alert("Error signing out. Please try refreshing the page.");
         window.location.reload();
      }
   };

   return (
      <button
         onClick={handleSignOut}
         className={`text-red-400 hover:text-red-300 ${className}`}
      >
         Sign Out
      </button>
   );
}
