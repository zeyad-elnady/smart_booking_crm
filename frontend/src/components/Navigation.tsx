"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import {
   HomeIcon,
   CalendarIcon,
   UserGroupIcon,
   Squares2X2Icon,
   Cog6ToothIcon,
   Bars3Icon,
   XMarkIcon,
   SunIcon,
   MoonIcon,
} from "@heroicons/react/24/outline";

// Navigation links with icons for reusability
const navigationLinks = [
   { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
   {
      name: "Appointments",
      href: "/dashboard/appointments",
      icon: CalendarIcon,
   },
   { name: "Customers", href: "/dashboard/customers", icon: UserGroupIcon },
   { name: "Services", href: "/dashboard/services", icon: Squares2X2Icon },
   { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

export default function Navigation() {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [mounted, setMounted] = useState(false);
   const pathname = usePathname();
   const { darkMode, toggleTheme } = useTheme();

   useEffect(() => {
      setMounted(true);
   }, []);

   const isActive = (path: string) => {
      if (path === "/dashboard") {
         return pathname === path;
      }
      return pathname?.startsWith(path) || false;
   };

   if (!mounted) {
      return (
         <nav className="fixed w-full top-0 z-20 glass-dark border-b border-white/10 backdrop-blur-md h-16"></nav>
      );
   }

   return (
      <nav
         className={`fixed w-[calc(100%-2rem)] mx-4 top-4 z-20 backdrop-blur-md rounded-xl ${
            darkMode
               ? "glass-dark border-b border-white/10"
               : "bg-white/25 border-b border-white/25"
         }`}
      >
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
               <div className="flex items-center">
                  <Link
                     href="/dashboard"
                     className={`text-xl font-bold flex items-center ${
                        darkMode
                           ? "text-purple-300 hover:text-purple-200"
                           : "text-purple-500 hover:text-purple-600"
                     } transition-colors`}
                  >
                     <span
                        className={`mr-2 ${
                           darkMode ? "text-purple-300" : "text-purple-500"
                        }`}
                     >
                        <img
                           src="/icon.svg"
                           alt="Smart Booking"
                           className={`h-6 w-6 ${
                              darkMode ? "opacity-85" : "opacity-90"
                           }`}
                           style={{
                              filter: `brightness(0) saturate(100%) ${
                                 darkMode
                                    ? "invert(85%) sepia(15%) saturate(1000%) hue-rotate(200deg) brightness(98%) contrast(92%)"
                                    : "invert(45%) sepia(30%) saturate(1000%) hue-rotate(235deg) brightness(95%) contrast(88%)"
                              }`,
                           }}
                        />
                     </span>
                     Smart Booking
                  </Link>
               </div>

               {/* Desktop Navigation */}
               <div className="hidden md:flex md:items-center md:justify-center flex-1 mx-8">
                  <div className="flex items-center space-x-4">
                     {navigationLinks.map((item) => {
                        const isCurrentPage = isActive(item.href);
                        return (
                           <Link
                              key={item.name}
                              href={item.href}
                              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                 isCurrentPage
                                    ? darkMode
                                       ? "bg-purple-500/20 text-white border border-purple-500/30"
                                       : "bg-purple-50 text-purple-700 border border-purple-100"
                                    : darkMode
                                    ? "text-gray-300 hover:bg-white/10 hover:text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                           >
                              <item.icon
                                 className={`mr-2 h-5 w-5 ${
                                    isCurrentPage
                                       ? darkMode
                                          ? "text-purple-300"
                                          : "text-purple-600"
                                       : darkMode
                                       ? "text-gray-400"
                                       : "text-gray-500"
                                 }`}
                              />
                              {item.name}
                           </Link>
                        );
                     })}
                  </div>
               </div>

               {/* Theme Toggle Button */}
               <div className="hidden md:block">
                  <button
                     onClick={toggleTheme}
                     className="relative w-14 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 transition-all duration-300 ease-in-out focus:outline-none flex items-center justify-start overflow-hidden"
                     aria-label="Toggle theme"
                  >
                     <div
                        className={`absolute h-6 w-6 rounded-full transition-all duration-500 ease-in-out transform ${
                           darkMode
                              ? "translate-x-7 bg-purple-300 rotate-[360deg]"
                              : "translate-x-1 bg-yellow-400 rotate-0"
                        } flex items-center justify-center shadow-sm`}
                     >
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200">
                           {darkMode ? (
                              <MoonIcon className="h-4.5 w-4.5 text-purple-900 stroke-[2.5] animate-fadeIn" />
                           ) : (
                              <SunIcon className="h-4.5 w-4.5 text-yellow-600 stroke-[2.5] animate-fadeIn" />
                           )}
                        </div>
                     </div>
                  </button>
               </div>

               {/* Mobile menu button */}
               <div className="flex md:hidden">
                  <button
                     onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                     className={`inline-flex items-center justify-center p-2 rounded-md ${
                        darkMode
                           ? "text-gray-400 hover:text-white hover:bg-white/10"
                           : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                     }`}
                  >
                     <span className="sr-only">Open main menu</span>
                     {mobileMenuOpen ? (
                        <XMarkIcon
                           className="block h-6 w-6"
                           aria-hidden="true"
                        />
                     ) : (
                        <Bars3Icon
                           className="block h-6 w-6"
                           aria-hidden="true"
                        />
                     )}
                  </button>
               </div>
            </div>
         </div>

         {/* Mobile menu */}
         {mobileMenuOpen && (
            <div className="md:hidden">
               <div
                  className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${
                     darkMode
                        ? "border-t border-white/10"
                        : "border-t border-gray-200"
                  }`}
               >
                  {navigationLinks.map((item) => {
                     const isCurrentPage = isActive(item.href);
                     return (
                        <Link
                           key={item.name}
                           href={item.href}
                           className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                              isCurrentPage
                                 ? darkMode
                                    ? "bg-white/10 text-white"
                                    : "bg-gray-100 text-gray-900"
                                 : darkMode
                                 ? "text-gray-300 hover:bg-white/10 hover:text-white"
                                 : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                           }`}
                        >
                           <item.icon
                              className={`mr-3 h-6 w-6 ${
                                 isCurrentPage
                                    ? darkMode
                                       ? "text-white"
                                       : "text-gray-900"
                                    : darkMode
                                    ? "text-gray-400"
                                    : "text-gray-500"
                              }`}
                           />
                           {item.name}
                        </Link>
                     );
                  })}

                  {/* Update Mobile Theme Toggle Button */}
                  <button
                     onClick={toggleTheme}
                     className="relative w-full flex items-center px-3 py-2 rounded-md text-base font-medium"
                  >
                     <div className="relative w-14 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 transition-all duration-300 ease-in-out focus:outline-none mr-3 flex items-center justify-start overflow-hidden">
                        <div
                           className={`absolute h-6 w-6 rounded-full transition-all duration-500 ease-in-out transform ${
                              darkMode
                                 ? "translate-x-7 bg-purple-300 rotate-[360deg]"
                                 : "translate-x-1 bg-yellow-400 rotate-0"
                           } flex items-center justify-center shadow-sm`}
                        >
                           <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200">
                              {darkMode ? (
                                 <MoonIcon className="h-4.5 w-4.5 text-purple-900 stroke-[2.5] animate-fadeIn" />
                              ) : (
                                 <SunIcon className="h-4.5 w-4.5 text-yellow-600 stroke-[2.5] animate-fadeIn" />
                              )}
                           </div>
                        </div>
                     </div>
                     <span
                        className={darkMode ? "text-gray-300" : "text-gray-600"}
                     >
                        Toggle Theme
                     </span>
                  </button>
               </div>
            </div>
         )}

         <style jsx global>{`
            @keyframes fadeIn {
               from {
                  opacity: 0;
                  transform: scale(0.8) rotate(-30deg);
               }
               to {
                  opacity: 1;
                  transform: scale(1) rotate(0);
               }
            }
            .animate-fadeIn {
               animation: fadeIn 0.3s ease-out forwards;
            }
         `}</style>
      </nav>
   );
}
