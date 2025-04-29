import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { DarkModeProvider } from "@/context/DarkModeContext";
import CustomToaster from "@/components/CustomToaster";

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
               <ThemeProvider>
                  <main>{children}</main>
                  <CustomToaster
                     position="top-right"
                     toastOptions={{
                        duration: 2000,
                     }}
                  />
               </ThemeProvider>
            </DarkModeProvider>
         </body>
      </html>
   );
}
