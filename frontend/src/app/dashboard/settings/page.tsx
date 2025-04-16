"use client";

import { useState, useEffect } from "react";
import { authAPI } from "@/services/api";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";

interface User {
   email: string;
   name: string;
   businessName: string;
}

interface BusinessHour {
   day: string;
   open: string;
   close: string;
   isOpen: boolean;
}

export default function Settings() {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);

   // Service link states
   const [serviceLink, setServiceLink] = useState("");
   const [serviceName, setServiceName] = useState("");
   const [hasServiceLink, setHasServiceLink] = useState(false);
   const [saveSuccess, setSaveSuccess] = useState(false);

   // Get theme from global context
   const { darkMode, toggleTheme } = useTheme();

   // Notification settings
   const [emailNotifications, setEmailNotifications] = useState(true);
   const [appointmentReminders, setAppointmentReminders] = useState(true);
   const [marketingEmails, setMarketingEmails] = useState(false);

   // Business hours
   const [businessHours, setBusinessHours] = useState<BusinessHour[]>([
      { day: "Monday", open: "09:00", close: "17:00", isOpen: true },
      { day: "Tuesday", open: "09:00", close: "17:00", isOpen: true },
      { day: "Wednesday", open: "09:00", close: "17:00", isOpen: true },
      { day: "Thursday", open: "09:00", close: "17:00", isOpen: true },
      { day: "Friday", open: "09:00", close: "17:00", isOpen: true },
      { day: "Saturday", open: "10:00", close: "15:00", isOpen: true },
      { day: "Sunday", open: "10:00", close: "15:00", isOpen: false },
   ]);

   useEffect(() => {
      // Get current user from localStorage
      const currentUser = authAPI.getCurrentUser();
      if (currentUser) {
         setUser(currentUser as User);
      }

      // Load saved service link if exists
      const savedServiceLink = localStorage.getItem("serviceLink");
      const savedServiceName = localStorage.getItem("serviceName");
      if (savedServiceLink && savedServiceName) {
         setServiceLink(savedServiceLink);
         setServiceName(savedServiceName);
         setHasServiceLink(true);
      }

      // Load saved notification settings if exists
      const savedEmailNotifications =
         localStorage.getItem("emailNotifications");
      if (savedEmailNotifications !== null) {
         setEmailNotifications(savedEmailNotifications === "true");
      }

      const savedAppointmentReminders = localStorage.getItem(
         "appointmentReminders"
      );
      if (savedAppointmentReminders !== null) {
         setAppointmentReminders(savedAppointmentReminders === "true");
      }

      const savedMarketingEmails = localStorage.getItem("marketingEmails");
      if (savedMarketingEmails !== null) {
         setMarketingEmails(savedMarketingEmails === "true");
      }

      // Load saved business hours if exists
      const savedBusinessHours = localStorage.getItem("businessHours");
      if (savedBusinessHours) {
         setBusinessHours(JSON.parse(savedBusinessHours));
      }

      setLoading(false);
   }, []);

   const handleServiceLinkSave = () => {
      if (serviceLink && serviceName) {
         localStorage.setItem("serviceLink", serviceLink);
         localStorage.setItem("serviceName", serviceName);
         localStorage.setItem("serviceChoice", "yes");
         setHasServiceLink(true);
         setSaveSuccess(true);

         // Clear success message after 3 seconds
         setTimeout(() => setSaveSuccess(false), 3000);
      }
   };

   const handleServiceLinkRemove = () => {
      localStorage.removeItem("serviceLink");
      localStorage.removeItem("serviceName");
      localStorage.setItem("serviceChoice", "no");
      setServiceLink("");
      setServiceName("");
      setHasServiceLink(false);
   };

   const handleNotificationToggle = (type: string, value: boolean) => {
      switch (type) {
         case "email":
            setEmailNotifications(value);
            localStorage.setItem("emailNotifications", String(value));
            break;
         case "appointment":
            setAppointmentReminders(value);
            localStorage.setItem("appointmentReminders", String(value));
            break;
         case "marketing":
            setMarketingEmails(value);
            localStorage.setItem("marketingEmails", String(value));
            break;
      }
   };

   const updateBusinessHours = (
      index: number,
      field: keyof BusinessHour,
      value: string | boolean
   ) => {
      const updatedHours = [...businessHours];

      if (field === "isOpen") {
         updatedHours[index].isOpen = value as boolean;
      } else {
         updatedHours[index][field] = value as string;
      }

      setBusinessHours(updatedHours);
      localStorage.setItem("businessHours", JSON.stringify(updatedHours));
   };

   const handleSignOut = () => {
      authAPI.logout();
      window.location.href = "/login";
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className={darkMode ? "text-white" : "text-gray-800"}>
               Loading settings...
            </div>
         </div>
      );
   }

   return (
      <div
         className={`space-y-8 animate-fadeIn ${
            darkMode ? "dark-content" : "light-content"
         }`}
      >
         <div>
            <h1
               className={`text-2xl font-semibold ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Settings
            </h1>
            <p
               className={`mt-1 text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
               }`}
            >
               Manage your account and application preferences.
            </p>
         </div>

         <div
            className={`p-6 rounded-lg ${
               darkMode ? "glass-dark" : "glass-light"
            }`}
         >
            <h2
               className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Personal Information
            </h2>
            <div className="mb-6">
               <p
                  className={`text-sm ${
                     darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
               >
                  Email
               </p>
               <p className={darkMode ? "text-white" : "text-gray-800"}>
                  {user?.email || "Not available"}
               </p>
            </div>
            <div className="mb-6">
               <p
                  className={`text-sm ${
                     darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
               >
                  Name
               </p>
               <p className={darkMode ? "text-white" : "text-gray-800"}>
                  {user?.name || "Not available"}
               </p>
            </div>
            <div className="mb-6">
               <p
                  className={`text-sm ${
                     darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
               >
                  Business Name
               </p>
               <p className={darkMode ? "text-white" : "text-gray-800"}>
                  {user?.businessName || "Not available"}
               </p>
            </div>
         </div>

         <div
            className={`p-6 rounded-lg ${
               darkMode ? "glass-dark" : "glass-light"
            }`}
         >
            <h2
               className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Notification Preferences
            </h2>
            <p
               className={`mb-4 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
               }`}
            >
               Control how and when you receive notifications
            </p>

            <div className="space-y-4">
               <div
                  className={`flex justify-between items-center py-2 border-b ${
                     darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
               >
                  <div>
                     <h3
                        className={`font-medium ${
                           darkMode ? "text-white" : "text-gray-800"
                        }`}
                     >
                        Email Notifications
                     </h3>
                     <p
                        className={`text-sm ${
                           darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                     >
                        Receive notifications via email
                     </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailNotifications}
                        onChange={(e) =>
                           handleNotificationToggle("email", e.target.checked)
                        }
                     />
                     <div
                        className={`w-11 h-6 ${
                           darkMode ? "bg-gray-700" : "bg-gray-200"
                        } rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600`}
                     ></div>
                  </label>
               </div>

               <div
                  className={`flex justify-between items-center py-2 border-b ${
                     darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
               >
                  <div>
                     <h3
                        className={`font-medium ${
                           darkMode ? "text-white" : "text-gray-800"
                        }`}
                     >
                        Appointment Reminders
                     </h3>
                     <p
                        className={`text-sm ${
                           darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                     >
                        Receive reminders about upcoming appointments
                     </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={appointmentReminders}
                        onChange={(e) =>
                           handleNotificationToggle(
                              "appointment",
                              e.target.checked
                           )
                        }
                     />
                     <div
                        className={`w-11 h-6 ${
                           darkMode ? "bg-gray-700" : "bg-gray-200"
                        } rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600`}
                     ></div>
                  </label>
               </div>

               <div className="flex justify-between items-center py-2">
                  <div>
                     <h3
                        className={`font-medium ${
                           darkMode ? "text-white" : "text-gray-800"
                        }`}
                     >
                        Marketing Emails
                     </h3>
                     <p
                        className={`text-sm ${
                           darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                     >
                        Receive promotional and marketing emails
                     </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={marketingEmails}
                        onChange={(e) =>
                           handleNotificationToggle(
                              "marketing",
                              e.target.checked
                           )
                        }
                     />
                     <div
                        className={`w-11 h-6 ${
                           darkMode ? "bg-gray-700" : "bg-gray-200"
                        } rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600`}
                     ></div>
                  </label>
               </div>
            </div>
         </div>

         <div
            className={`p-6 rounded-lg ${
               darkMode ? "glass-dark" : "glass-light"
            }`}
         >
            <h2
               className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Business Hours
            </h2>
            <p
               className={`mb-4 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
               }`}
            >
               Set your regular business hours
            </p>

            <div className="space-y-4">
               {businessHours.map((daySchedule, index) => (
                  <div
                     key={daySchedule.day}
                     className={`flex flex-wrap gap-3 items-center py-2 border-b ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                     }`}
                  >
                     <div className="w-28">
                        <h3
                           className={`font-medium ${
                              darkMode ? "text-white" : "text-gray-800"
                           }`}
                        >
                           {daySchedule.day}
                        </h3>
                     </div>

                     <label className="relative inline-flex items-center cursor-pointer">
                        <input
                           type="checkbox"
                           className="sr-only peer"
                           checked={daySchedule.isOpen}
                           onChange={(e) =>
                              updateBusinessHours(
                                 index,
                                 "isOpen",
                                 e.target.checked
                              )
                           }
                        />
                        <div
                           className={`w-11 h-6 ${
                              darkMode ? "bg-gray-700" : "bg-gray-200"
                           } rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600`}
                        ></div>
                        <span
                           className={`ml-2 text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                           }`}
                        >
                           {daySchedule.isOpen ? "Open" : "Closed"}
                        </span>
                     </label>

                     {daySchedule.isOpen && (
                        <>
                           <div className="flex items-center gap-2">
                              <input
                                 type="time"
                                 value={daySchedule.open}
                                 onChange={(e) =>
                                    updateBusinessHours(
                                       index,
                                       "open",
                                       e.target.value
                                    )
                                 }
                                 className={`px-2 py-1 border rounded-md text-sm ${
                                    darkMode
                                       ? "bg-gray-800/50 border-gray-700 text-white"
                                       : "bg-white border-gray-300 text-gray-800"
                                 }`}
                              />
                              <span
                                 className={
                                    darkMode ? "text-gray-400" : "text-gray-500"
                                 }
                              >
                                 to
                              </span>
                              <input
                                 type="time"
                                 value={daySchedule.close}
                                 onChange={(e) =>
                                    updateBusinessHours(
                                       index,
                                       "close",
                                       e.target.value
                                    )
                                 }
                                 className={`px-2 py-1 border rounded-md text-sm ${
                                    darkMode
                                       ? "bg-gray-800/50 border-gray-700 text-white"
                                       : "bg-white border-gray-300 text-gray-800"
                                 }`}
                              />
                           </div>
                        </>
                     )}
                  </div>
               ))}
            </div>
         </div>

         <div
            className={`p-6 rounded-lg ${
               darkMode ? "glass-dark" : "glass-light"
            }`}
         >
            <h2
               className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Service Link
            </h2>
            <p
               className={`mb-4 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
               }`}
            >
               {hasServiceLink
                  ? "Manage your service link that appears on the dashboard"
                  : "Add a direct link to your service website on your dashboard"}
            </p>

            <div className="space-y-4">
               <div className="flex flex-col space-y-2">
                  <label
                     htmlFor="serviceName"
                     className={`text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                     }`}
                  >
                     Service Name
                  </label>
                  <input
                     type="text"
                     id="serviceName"
                     value={serviceName}
                     onChange={(e) => setServiceName(e.target.value)}
                     placeholder="My Salon Website"
                     className={`px-3 py-2 border rounded-md ${
                        darkMode
                           ? "bg-gray-800/50 border-gray-700 text-white"
                           : "bg-white border-gray-300 text-gray-800"
                     }`}
                  />
               </div>

               <div className="flex flex-col space-y-2">
                  <label
                     htmlFor="serviceLink"
                     className={`text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                     }`}
                  >
                     Service URL
                  </label>
                  <input
                     type="url"
                     id="serviceLink"
                     value={serviceLink}
                     onChange={(e) => setServiceLink(e.target.value)}
                     placeholder="https://your-website.com"
                     className={`px-3 py-2 border rounded-md ${
                        darkMode
                           ? "bg-gray-800/50 border-gray-700 text-white"
                           : "bg-white border-gray-300 text-gray-800"
                     }`}
                  />
               </div>

               <div className="flex flex-wrap gap-3 pt-2">
                  <button
                     onClick={handleServiceLinkSave}
                     disabled={!serviceLink || !serviceName}
                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                           ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
                           : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                     }`}
                  >
                     {hasServiceLink ? "Update Link" : "Save Link"}
                  </button>

                  {hasServiceLink && (
                     <button
                        onClick={handleServiceLinkRemove}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                           darkMode
                              ? "bg-gray-700 text-white hover:bg-gray-600"
                              : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                        }`}
                     >
                        Remove Link
                     </button>
                  )}
               </div>

               {saveSuccess && (
                  <div className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-md text-green-300">
                     Service link saved successfully!
                  </div>
               )}
            </div>
         </div>

         <div
            className={`p-6 rounded-lg ${
               darkMode ? "glass-dark" : "glass-light"
            }`}
         >
            <h2
               className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
               }`}
            >
               Danger Zone
            </h2>
            <button
               onClick={handleSignOut}
               className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
               Sign Out
            </button>
         </div>

         <style jsx global>{`
            /* Global theme classes */
            .dark-theme {
               --bg-primary: #121826;
               --bg-secondary: #1a2234;
               --text-primary: #ffffff;
               --text-secondary: #94a3b8;
               --border-color: rgba(255, 255, 255, 0.1);
               color-scheme: dark;
            }

            .light-theme {
               --bg-primary: #f8fafc;
               --bg-secondary: #ffffff;
               --text-primary: #1e293b;
               --text-secondary: #64748b;
               --border-color: rgba(0, 0, 0, 0.1);
               color-scheme: light;
            }

            body {
               background-color: var(--bg-primary);
               color: var(--text-primary);
               transition: background-color 0.3s ease, color 0.3s ease;
            }

            .glass-dark {
               background-color: rgba(30, 41, 59, 0.6);
               backdrop-filter: blur(8px);
               border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .glass-light {
               background-color: rgba(255, 255, 255, 0.8);
               backdrop-filter: blur(8px);
               border: 1px solid rgba(0, 0, 0, 0.1);
               box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -2px rgba(0, 0, 0, 0.05);
            }

            .dark-content {
               --text-heading: #ffffff;
               --text-body: #94a3b8;
               --text-muted: #64748b;
            }

            .light-content {
               --text-heading: #1e293b;
               --text-body: #334155;
               --text-muted: #64748b;
            }

            @keyframes fadeIn {
               from {
                  opacity: 0;
                  transform: translateY(20px);
               }
               to {
                  opacity: 1;
                  transform: translateY(0);
               }
            }
            .animate-fadeIn {
               animation: fadeIn 0.5s ease-out forwards;
            }

            input[type="date"]::-webkit-calendar-picker-indicator,
            input[type="time"]::-webkit-calendar-picker-indicator {
               filter: ${darkMode ? "invert(0.8)" : "none"};
            }
         `}</style>
      </div>
   );
}
