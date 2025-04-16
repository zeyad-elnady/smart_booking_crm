import { useState, useEffect } from "react";

export const useDarkMode = () => {
   const [darkMode, setDarkMode] = useState(false);

   useEffect(() => {
      // Check if user has a dark mode preference in localStorage
      const isDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(isDarkMode);

      // Add listener for system color scheme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
         setDarkMode(e.matches);
         localStorage.setItem("darkMode", String(e.matches));
      };

      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
   }, []);

   const toggleDarkMode = () => {
      setDarkMode(!darkMode);
      localStorage.setItem("darkMode", String(!darkMode));
   };

   return { darkMode, toggleDarkMode };
};
