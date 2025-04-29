"use client";

import {
   createContext,
   useContext,
   useState,
   useEffect,
   ReactNode,
} from "react";

interface DarkModeContextType {
   darkMode: boolean;
   toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(
   undefined
);

export function DarkModeProvider({ children }: { children: ReactNode }) {
   const [darkMode, setDarkMode] = useState<boolean>(false);

   useEffect(() => {
      // Check if user has dark mode preference
      const isDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(isDarkMode);

      // Apply dark mode class to document
      if (isDarkMode) {
         document.documentElement.classList.add("dark");
      }
   }, []);

   const toggleDarkMode = () => {
      setDarkMode((prev) => {
         const newMode = !prev;
         localStorage.setItem("darkMode", String(newMode));

         if (newMode) {
            document.documentElement.classList.add("dark");
         } else {
            document.documentElement.classList.remove("dark");
         }

         return newMode;
      });
   };

   return (
      <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
         {children}
      </DarkModeContext.Provider>
   );
}

export function useDarkMode() {
   const context = useContext(DarkModeContext);
   if (context === undefined) {
      throw new Error("useDarkMode must be used within a DarkModeProvider");
   }
   return context;
}
