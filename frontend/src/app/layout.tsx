import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CustomToaster from "@/components/CustomToaster";
import ThemeProvider from "@/components/ThemeProvider";
import { DarkModeProvider } from "@/context/DarkModeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: "Smart Booking CRM",
   description: "A comprehensive CRM system for appointment-heavy businesses",
};

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <html lang="en" suppressHydrationWarning>
         <body className={inter.className} suppressHydrationWarning>
            <DarkModeProvider>
               <ThemeProvider>{children}</ThemeProvider>
            </DarkModeProvider>
            <CustomToaster
               position="top-right"
               toastOptions={{
                  className: "",
                  style: {
                     border: "1px solid #713200",
                     padding: "16px",
                     color: "#713200",
                  },
                  duration: 5000,
               }}
            />
         </body>
      </html>
   );
}
