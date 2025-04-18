"use client";

import { Toaster as HotToaster } from "react-hot-toast";
import { useTheme } from "@/components/ThemeProvider";

export function Toaster() {
   const { darkMode } = useTheme();

   return (
      <HotToaster
         position="top-right"
         toastOptions={{
            className: "",
            duration: 2000,
            style: {
               background: darkMode ? "#1f2937" : "#ffffff",
               color: darkMode ? "#ffffff" : "#000000",
               padding: "16px",
               borderRadius: "8px",
               boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            },
            success: {
               iconTheme: {
                  primary: "#10B981",
                  secondary: "white",
               },
            },
            error: {
               iconTheme: {
                  primary: "#EF4444",
                  secondary: "white",
               },
            },
         }}
         gutter={8}
         containerStyle={{
            top: 60,
         }}
         reverseOrder={false}
      />
   );
}
