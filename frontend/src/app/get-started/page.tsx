"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authAPI } from "@/services/api";
import SignOutButton from "@/components/SignOutButton";
import { useTheme } from "@/components/ThemeProvider";

// Simplified and memoized background shapes to prevent re-renders
const BackgroundShapes = memo(() => {
   return (
      <div className="fixed inset-0 overflow-hidden -z-10">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-10 filter blur-3xl floating animation-delay-1000"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-green-400 to-teal-500 opacity-10 filter blur-3xl floating animation-delay-3000"></div>
      </div>
   );
});

BackgroundShapes.displayName = "BackgroundShapes";

export default function GetStarted() {
   const router = useRouter();
   const [mounted, setMounted] = useState(false);
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [showClearButton, setShowClearButton] = useState(false);
   const { darkMode } = useTheme();

   useEffect(() => {
      setMounted(true);

      // Re-enable normal cursor
      document.body.style.cursor = "auto";
      const links = document.querySelectorAll("a, button");
      links.forEach((link) => {
         (link as HTMLElement).style.cursor = "pointer";
      });

      // Check if user is already logged in
      const hasToken =
         typeof window !== "undefined" &&
         (localStorage.getItem("token") !== null ||
            document.cookie
               .split(";")
               .some((c) => c.trim().startsWith("token=")));

      // If URL has force parameter, don't redirect even if logged in
      const urlParams = new URLSearchParams(window.location.search);
      const forceShow = urlParams.get("force") === "true";

      if (hasToken && !forceShow) {
         setIsLoggedIn(true);
         setShowClearButton(true);
      }
   }, []);

   const handleClearAuth = () => {
      // Clear credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie =
         "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Update component state
      setIsLoggedIn(false);
      setShowClearButton(false);

      // Force an immediate and complete page reload/redirect
      window.location.replace("/login");
   };

   const handleContinueToDashboard = () => {
      router.push("/dashboard");
   };

   if (!mounted) return null;

   if (isLoggedIn) {
      return (
         <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white flex items-center justify-center">
            <div className="glass border border-white/10 rounded-xl p-8 max-w-md text-center">
               <h2 className="text-2xl font-bold mb-6 gradient-text">
                  You're already logged in!
               </h2>
               <p className="mb-8 text-gray-300">
                  You are currently logged in to Smart Booking CRM. Would you
                  like to continue to your dashboard or sign out?
               </p>
               <div className="flex flex-col space-y-4">
                  <button
                     onClick={handleContinueToDashboard}
                     className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                           ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
                           : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                     }`}
                  >
                     Go to Dashboard
                  </button>
                  <SignOutButton className="w-full" />
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white">
         <BackgroundShapes />

         {/* Navigation */}
         <nav className="glass-dark bg-opacity-30 fixed w-full z-10 px-8 py-6">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
               <div>
                  <Link
                     href="/"
                     className="text-2xl md:text-3xl font-bold gradient-text text-shadow-light hover:scale-105 transform transition-all"
                  >
                     Smart Booking CRM
                  </Link>
               </div>
               <div className="flex gap-6">
                  <Link
                     href="/login"
                     className="relative text-lg transition-all hover:scale-110 text-white opacity-80 hover:opacity-100 btn-premium px-4 py-2 rounded-full"
                  >
                     Login
                  </Link>
                  <Link
                     href="/register"
                     className="text-lg font-medium btn-premium glass px-6 py-2 rounded-full transition-all hover:scale-110"
                  >
                     Sign Up
                  </Link>
               </div>
            </div>
         </nav>

         {/* Main content */}
         <main className="pt-32 pb-20">
            <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
               <div className="glass text-center p-12 mb-12 w-full max-w-4xl mx-auto border border-opacity-20 rounded-2xl">
                  <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text text-shadow">
                     Get Started
                  </h1>
                  <p className="text-xl md:text-2xl mb-10 text-gray-200 leading-relaxed max-w-3xl mx-auto">
                     Choose your role to access the appropriate view
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                     {/* Admin View Card */}
                     <div className="glass-dark border border-white/10 rounded-xl p-8 flex flex-col items-center hover:scale-105 transition-all duration-300">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mb-6">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-10 w-10 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                              />
                           </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 gradient-text">
                           Admin View
                        </h2>
                        <p className="text-gray-300 text-center mb-8">
                           Full access to manage staff, finances, settings and all system features.
                        </p>
                        <Link
                           href="/dashboard"
                           className="glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center btn-premium w-full"
                        >
                           Access Admin
                        </Link>
                     </div>

                     {/* Doctor View Card */}
                     <div className="glass-dark border border-white/10 rounded-xl p-8 flex flex-col items-center hover:scale-105 transition-all duration-300">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center mb-6">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-10 w-10 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                           </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 gradient-text">
                           Doctor View
                        </h2>
                        <p className="text-gray-300 text-center mb-8">
                           Manage appointments, patient records, and your personal schedule.
                        </p>
                        <Link
                           href="/doctor-dashboard"
                           className="glass-dark bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center btn-premium w-full"
                        >
                           Access Doctor View
                        </Link>
                     </div>

                     {/* Secretary View Card */}
                     <div className="glass-dark border border-white/10 rounded-xl p-8 flex flex-col items-center hover:scale-105 transition-all duration-300">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-6">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-10 w-10 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                           </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 gradient-text">
                           Secretary View
                        </h2>
                        <p className="text-gray-300 text-center mb-8">
                           Schedule appointments, manage the front desk, and handle customer inquiries.
                        </p>
                        <Link
                           href="/secretary-dashboard"
                           className="glass-dark bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center btn-premium w-full"
                        >
                           Access Secretary View
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         {/* Footer */}
         <footer className="glass-dark bg-opacity-30 py-8">
            <div className="max-w-6xl mx-auto px-6 text-center">
               <p className="text-white opacity-80">
                  &copy; {new Date().getFullYear()} Smart Booking CRM. All
                  rights reserved.
               </p>
            </div>
         </footer>
      </div>
   );
}
