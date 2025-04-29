"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

interface Option {
   id: string;
   label: string;
}

interface CustomDropdownProps {
   options: Option[];
   value: string;
   onChange: (value: string) => void;
   placeholder: string;
   disabled?: boolean;
   error?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
   options,
   value,
   onChange,
   placeholder,
   disabled = false,
   error,
}) => {
   const [isOpen, setIsOpen] = useState(false);
   const [dropUpwards, setDropUpwards] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const menuRef = useRef<HTMLDivElement>(null);
   const selectedOption = options.find((option) => option.id === value);
   const { darkMode } = useTheme();

   // Function to calculate dropdown direction
   const calculateDropdownDirection = () => {
      if (!dropdownRef.current || !menuRef.current) return;

      const buttonRect = dropdownRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // If there's not enough space below and more space above, drop upwards
      setDropUpwards(spaceBelow < menuHeight && spaceAbove > spaceBelow);
   };

   // Calculate direction when opening dropdown
   useEffect(() => {
      if (isOpen) {
         calculateDropdownDirection();
      }
   }, [isOpen]);

   // Recalculate on window resize
   useEffect(() => {
      const handleResize = () => {
         if (isOpen) {
            calculateDropdownDirection();
         }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, [isOpen]);

   // Close dropdown when clicking outside
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
         document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   return (
      <div className="relative" ref={dropdownRef}>
         {/* Dropdown Button */}
         <button
            type="button"
            className={`w-full px-4 py-2 rounded-lg border transition-colors custom-input
          ${
             darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
          }
          ${
             disabled
                ? "opacity-50 cursor-not-allowed"
                : darkMode
                ? "cursor-pointer hover:bg-gray-700"
                : "cursor-pointer hover:bg-gray-50"
          }`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
         >
            <span
               className={
                  selectedOption
                     ? darkMode
                        ? "text-white"
                        : "text-gray-900"
                     : darkMode
                     ? "text-gray-400"
                     : "text-gray-500"
               }
            >
               {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
               <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-200 ${
                     darkMode ? "text-gray-400" : "text-gray-500"
                  } ${
                     isOpen
                        ? dropUpwards
                           ? ""
                           : "rotate-180"
                        : dropUpwards
                        ? "rotate-180"
                        : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
               >
                  <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M19 9l-7 7-7-7"
                  />
               </svg>
            </span>
         </button>

         {/* Error message */}
         {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

         {/* Dropdown Menu */}
         {isOpen && (
            <div
               ref={menuRef}
               style={{
                  maxHeight: "250px",
                  [dropUpwards ? "bottom" : "top"]: "calc(100% + 0.25rem)",
               }}
               className={`absolute left-0 w-full z-10 rounded-lg border shadow-lg overflow-hidden
            ${
               darkMode
                  ? "bg-gray-800 border-gray-700 shadow-black/30"
                  : "bg-white border-gray-300 shadow-gray-200/50"
            }`}
            >
               <div className="overflow-y-auto py-1">
                  {options.length > 0 ? (
                     options.map((option) => (
                        <div
                           key={option.id}
                           className={`px-4 py-2 cursor-pointer transition-colors duration-150
                    ${
                       darkMode
                          ? "text-gray-200 hover:bg-gray-700"
                          : "text-gray-900 hover:bg-gray-50"
                    }
                    ${
                       option.id === value
                          ? darkMode
                             ? "bg-gray-700 text-white"
                             : "bg-gray-100 text-gray-900"
                          : ""
                    }`}
                           onClick={() => {
                              onChange(option.id);
                              setIsOpen(false);
                           }}
                        >
                           {option.label}
                        </div>
                     ))
                  ) : (
                     <div
                        className={`px-4 py-2 text-center ${
                           darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                     >
                        No options available
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default CustomDropdown;
