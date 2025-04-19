"use client";

import { useState, useEffect } from "react";
import { authAPI } from "@/services/api";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";
import { Switch } from "@headlessui/react";
import { toast } from "react-hot-toast";

interface User {
   email: string;
   name: string;
   businessName: string;
}

type NotificationType = "email" | "appointment" | "marketing";

export default function Settings() {
   const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState<boolean>(true);

   // Add state for edit mode and edited user info
   const [editMode, setEditMode] = useState<boolean>(false);
   const [editedUser, setEditedUser] = useState<User | null>(null);

   // Service link states
   const [serviceLink, setServiceLink] = useState<string>("");
   const [serviceName, setServiceName] = useState<string>("");
   const [hasServiceLink, setHasServiceLink] = useState<boolean>(false);
   const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

   // Get theme from global context
   const { darkMode, toggleTheme } = useTheme();

   // Notification settings
   const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
   const [appointmentReminders, setAppointmentReminders] =
      useState<boolean>(true);
   const [marketingEmails, setMarketingEmails] = useState<boolean>(false);

   useEffect(() => {
      // Get current user from localStorage
      const currentUser = authAPI.getCurrentUser();
      if (currentUser) {
         setUser(currentUser as User);
         setEditedUser(currentUser as User);
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

      setLoading(false);
   }, []);

   const handleServiceLinkSave = () => {
      if (serviceLink && serviceName) {
         localStorage.setItem("serviceLink", serviceLink);
         localStorage.setItem("serviceName", serviceName);
         localStorage.setItem("serviceChoice", "yes");
         setHasServiceLink(true);
         setSaveSuccess(true);
         toast.success("Service link saved successfully!");

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

   const handleNotificationToggle = (
      type: NotificationType,
      value: boolean
   ) => {
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

   const handleSignOut = () => {
      authAPI.logout();
      toast.success("Signed out successfully!");
   };

   // Handle editing and saving user information
   const handleEditToggle = () => {
      setEditMode(!editMode);
      if (!editMode && user) {
         // When entering edit mode, copy current user to edited user
         setEditedUser(user);
      }
   };

   const handleInputChange = (field: keyof User, value: string) => {
      if (editedUser) {
         const newUser = { ...editedUser, [field]: value };
         setEditedUser(newUser as User);
      }
   };

   const handleSaveUserInfo = () => {
      if (
         !editedUser?.email ||
         !editedUser?.name ||
         !editedUser?.businessName
      ) {
         // You might want to add toast or other error notification here
         console.error("All fields are required");
         return;
      }

      // At this point, we know all required fields are present
      setUser(editedUser);
      localStorage.setItem("currentUser", JSON.stringify(editedUser));
      setEditMode(false);
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
            <div className="flex justify-between items-center mb-4">
               <h2
                  className={`text-xl font-semibold ${
                     darkMode ? "text-white" : "text-gray-800"
                  }`}
               >
                  Personal Information
               </h2>
               <button
                  onClick={handleEditToggle}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                     darkMode
                        ? editMode
                           ? "bg-gray-700 text-white hover:bg-gray-600"
                           : "bg-indigo-600 text-white hover:bg-indigo-700"
                        : editMode
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
               >
                  {editMode ? "Cancel" : "Edit"}
               </button>
            </div>
            {editMode ? (
               // Edit mode view
               <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                     <label
                        htmlFor="userEmail"
                        className={`text-sm ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Email
                     </label>
                     <input
                        type="email"
                        id="userEmail"
                        value={editedUser?.email || ""}
                        onChange={(e) =>
                           handleInputChange("email", e.target.value)
                        }
                        className={`px-3 py-2 border rounded-md ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                        }`}
                     />
                  </div>
                  <div className="flex flex-col space-y-2">
                     <label
                        htmlFor="userName"
                        className={`text-sm ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Name
                     </label>
                     <input
                        type="text"
                        id="userName"
                        value={editedUser?.name || ""}
                        onChange={(e) =>
                           handleInputChange("name", e.target.value)
                        }
                        className={`px-3 py-2 border rounded-md ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                        }`}
                     />
                  </div>
                  <div className="flex flex-col space-y-2">
                     <label
                        htmlFor="userBusinessName"
                        className={`text-sm ${
                           darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                     >
                        Business Name
                     </label>
                     <input
                        type="text"
                        id="userBusinessName"
                        value={editedUser?.businessName || ""}
                        onChange={(e) =>
                           handleInputChange("businessName", e.target.value)
                        }
                        className={`px-3 py-2 border rounded-md ${
                           darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                        }`}
                     />
                  </div>
                  <div className="flex justify-end pt-2">
                     <button
                        onClick={handleSaveUserInfo}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                           darkMode
                              ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                     >
                        Save Changes
                     </button>
                  </div>
               </div>
            ) : (
               // Read-only view
               <>
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
               </>
            )}
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
                        className={`w-12 h-6 rounded-full transition-all duration-300 ease-in-out ${
                           darkMode
                              ? "bg-gray-700 shadow-inner"
                              : "bg-gray-200 shadow-inner"
                        } peer peer-checked:after:translate-x-6 peer-checked:after:border-white peer-checked:shadow-lg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-0 after:shadow-md after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out peer-checked:bg-indigo-600`}
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
                        className={`w-12 h-6 rounded-full transition-all duration-300 ease-in-out ${
                           darkMode
                              ? "bg-gray-700 shadow-inner"
                              : "bg-gray-200 shadow-inner"
                        } peer peer-checked:after:translate-x-6 peer-checked:after:border-white peer-checked:shadow-lg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-0 after:shadow-md after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out peer-checked:bg-indigo-600`}
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
                        className={`w-12 h-6 rounded-full transition-all duration-300 ease-in-out ${
                           darkMode
                              ? "bg-gray-700 shadow-inner"
                              : "bg-gray-200 shadow-inner"
                        } peer peer-checked:after:translate-x-6 peer-checked:after:border-white peer-checked:shadow-lg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-0 after:shadow-md after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out peer-checked:bg-indigo-600`}
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
