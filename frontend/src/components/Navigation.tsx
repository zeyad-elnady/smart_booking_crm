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
   ChartBarIcon,
   Cog6ToothIcon,
   Bars3Icon,
   XMarkIcon,
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
   { name: "Analytics", href: "/dashboard/analytics", icon: ChartBarIcon },
   { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

export default function Navigation() {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [mounted, setMounted] = useState(false);
   const pathname = usePathname();
   const { darkMode } = useTheme();

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
         className={`fixed w-[calc(100%-2rem)] mx-4 top-4 z-20 ${
            darkMode
               ? "glass-dark border-b border-white/10"
               : "glass-light border-b border-gray-200"
         } backdrop-blur-md rounded-xl`}
      >
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
               <div className="flex items-center">
                  <Link
                     href="/dashboard"
                     className={`text-xl font-bold flex items-center ${
                        darkMode
                           ? "text-white hover:text-purple-300"
                           : "text-gray-900 hover:text-purple-600"
                     } transition-colors`}
                  >
                     <span
                        className={`mr-2 ${
                           darkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                     >
                        <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className="h-6 w-6"
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
                     </span>
                     Smart Booking
                  </Link>
               </div>

               {/* Desktop Navigation */}
               <div className="hidden md:flex md:items-center md:space-x-6">
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
               </div>
            </div>
         )}
      </nav>
   );
}
