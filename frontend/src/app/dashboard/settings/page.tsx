"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
// Import only the icons we're actually using to reduce bundle size
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  LockClosedIcon, 
  EyeIcon,
  CogIcon,
  ArrowPathIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  LanguageIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { getSettings, saveSettings } from "@/services/settingsService";
import { getServices } from "@/services/serviceService";
import type { Service } from "@/types/service";

// Key for storing profile image in localStorage
const PROFILE_IMAGE_STORAGE_KEY = 'userProfileImage';

// Constants for localStorage keys
const NOTIFICATION_SETTINGS_KEY = "notificationSettings";
const PROFILE_SETTINGS_KEY = "profileSettings";

export default function Settings() {
  const { darkMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User profile state
  const [profile, setProfile] = useState({
    name: "John Smith",
    email: "john@example.com",
    phone: "+20 123 456 7890",
    role: "Administrator",
  });
  
  // Notifications settings - with reduced initial complexity
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    appointments: true,
    marketing: false
  });
  
  // Privacy settings - with reduced initial complexity
  const [privacy, setPrivacy] = useState({
    shareData: false,
    analytics: true,
    storeHistory: true,
  });

  // Service link settings
  const [serviceLink, setServiceLink] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [showServicePrompt, setShowServicePrompt] = useState(true);
  const [hasServiceLink, setHasServiceLink] = useState(false);

  // Working Hours settings
  const [workingHours, setWorkingHours] = useState({
    start: "10:00",
    end: "20:00",
    daysOpen: [true, true, true, true, true, true, false] // Mon-Sat open, Sun closed
  });
  
  // Service availability settings - modify to work with real services
  const [services, setServices] = useState<Service[]>([]);
  const [serviceAvailabilities, setServiceAvailabilities] = useState<{
    [serviceId: string]: {
      allDay: boolean;
      start: string;
      end: string;
    }
  }>({});

  // Crop states
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

   useEffect(() => {
      // Simple effect to simulate data loading
      const timer = setTimeout(() => {
         setLoading(false);
      }, 500);

      // Load data from IndexedDB and localStorage
      const loadAllSettings = async () => {
        try {
          // Try to get settings from IndexedDB first
          const settings = await getSettings();
          
          // Load profile data
          if (settings.profile) {
            setProfile(settings.profile);
          } else {
            // Fallback to localStorage
            const savedProfile = localStorage.getItem(PROFILE_SETTINGS_KEY);
            if (savedProfile) {
              try {
                setProfile(JSON.parse(savedProfile));
              } catch (error) {
                console.error("Error parsing profile settings:", error);
              }
            }
          }
          
          // Load profile image
          if (settings.profileImage) {
            setCroppedImage(settings.profileImage);
          } else {
            const savedImage = localStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
            if (savedImage) {
              setCroppedImage(savedImage);
            }
          }
          
          // Load notification settings
          if (settings.notifications) {
            setNotifications(settings.notifications);
          } else {
            const savedNotificationSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
            if (savedNotificationSettings) {
              try {
                const parsedSettings = JSON.parse(savedNotificationSettings);
                setNotifications(prev => ({
                  ...prev,
                  ...parsedSettings
                }));
              } catch (error) {
                console.error("Error parsing notification settings:", error);
              }
            }
          }
          
          // Load privacy settings
          if (settings.privacy) {
            setPrivacy(settings.privacy);
          } else {
            const savedPrivacySettings = localStorage.getItem("privacySettings");
            if (savedPrivacySettings) {
              try {
                const parsedSettings = JSON.parse(savedPrivacySettings);
                setPrivacy(prev => ({
                  ...prev,
                  ...parsedSettings
                }));
              } catch (error) {
                console.error("Error parsing privacy settings:", error);
              }
            }
          }
          
          // Load working hours
          if (settings.workingHours) {
            setWorkingHours(settings.workingHours);
          }
          
          // Load service availabilities
          if (settings.serviceAvailabilities) {
            setServiceAvailabilities(settings.serviceAvailabilities);
          }
          
        } catch (error) {
          console.error("Error loading settings from IndexedDB:", error);
          
          // Fall back to localStorage for everything
          // Load profile image from localStorage
          const savedImage = localStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
          if (savedImage) {
            setCroppedImage(savedImage);
          }
          
          // Load notification settings from localStorage
          const savedNotificationSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
          if (savedNotificationSettings) {
            try {
              const parsedSettings = JSON.parse(savedNotificationSettings);
              setNotifications(prev => ({
                ...prev,
                ...parsedSettings
              }));
            } catch (error) {
              console.error("Error parsing notification settings:", error);
            }
          }
          
          // Load profile from localStorage
          const savedProfile = localStorage.getItem(PROFILE_SETTINGS_KEY);
          if (savedProfile) {
            try {
              setProfile(JSON.parse(savedProfile));
            } catch (error) {
              console.error("Error parsing profile settings:", error);
            }
          }
          
          // Load privacy settings from localStorage
          const savedPrivacySettings = localStorage.getItem("privacySettings");
          if (savedPrivacySettings) {
            try {
              const parsedSettings = JSON.parse(savedPrivacySettings);
              setPrivacy(prev => ({
                ...prev,
                ...parsedSettings
              }));
            } catch (error) {
              console.error("Error parsing privacy settings:", error);
            }
          }
        }
      };
      
      // Load service link settings
      const loadServiceLink = async () => {
        try {
          // Try to get from IndexedDB first
          const settings = await getSettings();
          if (settings.bookingService) {
            setServiceName(settings.bookingService.name);
            setServiceLink(settings.bookingService.link);
            setHasServiceLink(true);
            setShowServicePrompt(false);
          } else {
            // Fallback to localStorage
            const savedServiceName = localStorage.getItem("bookingServiceName");
            const savedServiceLink = localStorage.getItem("bookingServiceLink");
            if (savedServiceName && savedServiceLink) {
              setServiceName(savedServiceName);
              setServiceLink(savedServiceLink);
              setHasServiceLink(true);
              setShowServicePrompt(false);
            }
          }
        } catch (error) {
          console.error("Error loading service link settings:", error);
          // Fallback to localStorage
          const savedServiceName = localStorage.getItem("bookingServiceName");
          const savedServiceLink = localStorage.getItem("bookingServiceLink");
          if (savedServiceName && savedServiceLink) {
            setServiceName(savedServiceName);
            setServiceLink(savedServiceLink);
            setHasServiceLink(true);
            setShowServicePrompt(false);
          }
        }
      };
      
      loadAllSettings();
      loadServiceLink();
      
      return () => clearTimeout(timer);
   }, []);

   // Save notification settings whenever they change
   useEffect(() => {
     localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(notifications));
   }, [notifications]);

   const handleSignOut = () => {
      // Just clear everything in localStorage
      localStorage.clear();
      // Redirect to home page
      window.location.href = "/";
   };
  
  const handleClearData = () => {
    setSaving(true);
    // Use a shorter timeout to avoid memory pressure
    setTimeout(() => {
      toast.success("Application data cleared successfully");
      setSaving(false);
    }, 300);
  };
  
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Save to localStorage for backward compatibility
      localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(profile));
      
      // Save to IndexedDB using settingsService
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        profile: profile
      });
      
      setEditingField(null);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };
  
  // Handle working hours change
  const handleWorkingHoursChange = async (field: string, value: string | boolean[]) => {
    try {
      console.log(`Updating working hours: ${field} = ${value}`);
      const updatedWorkingHours = {
        ...workingHours,
        [field]: value
      };
      
      setWorkingHours(updatedWorkingHours);
      
      // Create a complete business hours settings object
      const businessHoursSettings = JSON.parse(localStorage.getItem('businessHoursSettings') || '{}');
      
      // Ensure we have a properly structured object
      const updatedBusinessHours = {
        workingHours: {
          ...businessHoursSettings.workingHours || {},
          start: field === 'start' ? value : updatedWorkingHours.start,
          end: field === 'end' ? value : updatedWorkingHours.end,
          daysOff: field === 'daysOpen' 
            ? (value as boolean[]).map((isOpen, index) => isOpen ? -1 : index).filter(i => i !== -1)
            : businessHoursSettings.workingHours?.daysOff || []
        },
        daysOpen: {
          monday: { 
            open: field === 'daysOpen' ? (value as boolean[])[0] : updatedWorkingHours.daysOpen[0],
            start: field === 'start' ? value : updatedWorkingHours.start, 
            end: field === 'end' ? value : updatedWorkingHours.end 
          },
          tuesday: { 
            open: field === 'daysOpen' ? (value as boolean[])[1] : updatedWorkingHours.daysOpen[1], 
            start: field === 'start' ? value : updatedWorkingHours.start, 
            end: field === 'end' ? value : updatedWorkingHours.end 
          },
          wednesday: { 
            open: field === 'daysOpen' ? (value as boolean[])[2] : updatedWorkingHours.daysOpen[2], 
            start: field === 'start' ? value : updatedWorkingHours.start, 
            end: field === 'end' ? value : updatedWorkingHours.end 
          },
          thursday: { 
            open: field === 'daysOpen' ? (value as boolean[])[3] : updatedWorkingHours.daysOpen[3], 
            start: field === 'start' ? value : updatedWorkingHours.start, 
            end: field === 'end' ? value : updatedWorkingHours.end 
          },
          friday: { 
            open: field === 'daysOpen' ? (value as boolean[])[4] : updatedWorkingHours.daysOpen[4], 
            start: field === 'start' ? value : updatedWorkingHours.start, 
            end: field === 'end' ? value : updatedWorkingHours.end 
          },
          saturday: { 
            open: field === 'daysOpen' ? (value as boolean[])[5] : updatedWorkingHours.daysOpen[5], 
            start: field === 'start' ? value : updatedWorkingHours.start, 
            end: field === 'end' ? value : updatedWorkingHours.end 
          },
          sunday: { 
            open: field === 'daysOpen' ? (value as boolean[])[6] : updatedWorkingHours.daysOpen[6], 
            start: field === 'start' ? value : updatedWorkingHours.start, 
            end: field === 'end' ? value : updatedWorkingHours.end 
          }
        },
        appointmentBuffer: businessHoursSettings.appointmentBuffer || 15
      };
      
      // Save to localStorage
      localStorage.setItem('businessHoursSettings', JSON.stringify(updatedBusinessHours));
      console.log('Updated business hours saved to localStorage:', updatedBusinessHours);
      
      // Save to IndexedDB
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        workingHours: updatedWorkingHours
      });
      
      // Set flag to refresh appointments
      localStorage.setItem('appointmentListShouldRefresh', 'true');
      
      // Dispatch event to notify other components
      const event = new CustomEvent('businessHoursChanged', { detail: updatedBusinessHours });
      window.dispatchEvent(event);
      
      toast.success("Working hours updated");
    } catch (error) {
      console.error("Error saving working hours:", error);
      toast.error("Failed to save working hours");
    }
  };
  
  // Toggle day of week selection
  const toggleDaySelection = (dayIndex: number) => {
    const newDaysOpen = [...workingHours.daysOpen];
    newDaysOpen[dayIndex] = !newDaysOpen[dayIndex];
    handleWorkingHoursChange('daysOpen', newDaysOpen);
  };
  
  // Handle service availability change
  const handleServiceAvailabilityChange = async (serviceId: string, field: string, value: any) => {
    console.log(`Updating service availability: ${serviceId} - ${field} = ${value}`);
    const updatedAvailabilities = {
      ...serviceAvailabilities,
      [serviceId]: {
        ...serviceAvailabilities[serviceId],
        [field]: value
      }
    };
    
    setServiceAvailabilities(updatedAvailabilities);
    
    try {
      // Save to IndexedDB
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        serviceAvailabilities: updatedAvailabilities
      });
      
      // Update the service availabilities in businessHoursSettings for compatibility
      const businessHoursSettings = JSON.parse(localStorage.getItem('businessHoursSettings') || '{}');
      
      // Create a complete businessHoursSettings object if needed
      if (!businessHoursSettings.serviceAvailabilities) {
        businessHoursSettings.serviceAvailabilities = {};
      }
      
      // Update the specific service
      businessHoursSettings.serviceAvailabilities[serviceId] = {
        ...businessHoursSettings.serviceAvailabilities[serviceId],
        [field]: value,
        // Make sure we have all needed fields
        allDay: field === 'allDay' ? value : 
          businessHoursSettings.serviceAvailabilities[serviceId]?.allDay ?? 
          updatedAvailabilities[serviceId].allDay,
        start: field === 'start' ? value : 
          businessHoursSettings.serviceAvailabilities[serviceId]?.start ?? 
          updatedAvailabilities[serviceId].start,
        end: field === 'end' ? value : 
          businessHoursSettings.serviceAvailabilities[serviceId]?.end ?? 
          updatedAvailabilities[serviceId].end
      };
      
      // Save updated settings to localStorage
      localStorage.setItem('businessHoursSettings', JSON.stringify(businessHoursSettings));
      console.log('Updated service availability saved to localStorage:', businessHoursSettings.serviceAvailabilities);
      
      // Set flag to refresh appointments
      localStorage.setItem('appointmentListShouldRefresh', 'true');
      
      // Dispatch event to notify other components
      const event = new CustomEvent('businessHoursChanged', { detail: businessHoursSettings });
      window.dispatchEvent(event);
      
      toast.success("Service availability updated");
    } catch (error) {
      console.error("Error saving service availability:", error);
      toast.error("Failed to save service availability");
    }
  };
  
  // Load services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const allServices = await getServices();
        setServices(allServices);
        
        // Initialize service availabilities if they don't exist
        const settings = await getSettings();
        if (settings.serviceAvailabilities) {
          setServiceAvailabilities(settings.serviceAvailabilities);
        } else {
          // Set default availabilities for all services
          const defaultAvailabilities: { [key: string]: any } = {};
          allServices.forEach(service => {
            defaultAvailabilities[service._id] = {
              allDay: true,
              start: workingHours.start,
              end: workingHours.end
            };
          });
          setServiceAvailabilities(defaultAvailabilities);
          
          // Save default availabilities
          await saveSettings({
            ...settings,
            serviceAvailabilities: defaultAvailabilities
          });
        }
      } catch (error) {
        console.error("Error loading services:", error);
      }
    };
    
    loadServices();
  }, []);
  
  const handleToggleSetting = async (category: string, setting: string) => {
    if (category === 'notifications') {
      const newNotifications = {
        ...notifications,
        [setting]: !notifications[setting as keyof typeof notifications]
      };
      
      setNotifications(newNotifications);
      
      // Save to localStorage for backward compatibility
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newNotifications));
      
      // Save to IndexedDB
      try {
        const settings = await getSettings();
        await saveSettings({
          ...settings,
          notifications: newNotifications
        });
      } catch (error) {
        console.error("Error saving notification settings to IndexedDB:", error);
      }
      
      toast.success(`${setting} notifications ${notifications[setting as keyof typeof notifications] ? 'disabled' : 'enabled'}`);
    } 
    else if (category === 'privacy') {
      const newPrivacy = {
        ...privacy,
        [setting]: !privacy[setting as keyof typeof privacy]
      };
      
      setPrivacy(newPrivacy);
      
      // Save to localStorage for backward compatibility
      localStorage.setItem("privacySettings", JSON.stringify(newPrivacy));
      
      // Save to IndexedDB
      try {
        const settings = await getSettings();
        await saveSettings({
          ...settings,
          privacy: newPrivacy
        });
      } catch (error) {
        console.error("Error saving privacy settings to IndexedDB:", error);
      }
      
      toast.success(`Privacy setting updated`);
    }
  };
  
  const handleEditField = (field: string) => {
    setEditingField(field);
  };
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
   };

  const handleProfileImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return imageSrc;
    }

    // Set canvas size to the crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Return as data URL
    return canvas.toDataURL('image/jpeg');
  };

  const handleCropImage = async () => {
    if (selectedImage && croppedAreaPixels) {
      try {
        const croppedImg = await getCroppedImg(selectedImage, croppedAreaPixels);
        setCroppedImage(croppedImg);
        
        // Save the cropped image to localStorage
        localStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, croppedImg);
        
        // Also save to IndexedDB
        try {
          const settings = await getSettings();
          await saveSettings({
            ...settings,
            profileImage: croppedImg
          });
        } catch (error) {
          console.error("Error saving profile image to IndexedDB:", error);
        }
        
        setShowCropModal(false);
        toast.success("Profile picture updated successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to crop image");
      }
    }
  };
  
  const handleCancelCrop = () => {
    setSelectedImage(null);
    setShowCropModal(false);
   };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: value
    }));
   };

  const handleSaveServiceLink = async () => {
    if (serviceName && serviceLink) {
      setSaving(true);
      
      try {
        // Store the service link info in localStorage for backward compatibility
        localStorage.setItem("bookingServiceName", serviceName);
        localStorage.setItem("bookingServiceLink", serviceLink);
        
        // Also save to IndexedDB
        const settings = await getSettings();
        await saveSettings({
          ...settings,
          bookingService: {
            name: serviceName,
            link: serviceLink
          }
        });
        
        setSaving(false);
        setShowServicePrompt(false);
        setHasServiceLink(true);
        toast.success("Service link saved successfully");
      } catch (error) {
        console.error("Error saving service link:", error);
        toast.error("Failed to save service link");
        setSaving(false);
      }
    } else {
      toast.error("Please enter both service name and link");
    }
  };

  const handleDeclineServiceLink = () => {
    setShowServicePrompt(false);
    toast.success("You can set this up later in Settings");
  };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 bg-purple-500 rounded-full animate-pulse"></div>
          <span className={darkMode ? "text-white" : "text-gray-800"}>
               {t("loading_settings")}
          </span>
            </div>
         </div>
      );
   }

   return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
      {/* Single decorative element instead of multiple */}
      <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
      
      <div className="relative p-6 max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${darkMode ? "text-white" : "text-gray-800"}`}>
          {t("settings")}
        </h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className={`${darkMode ? "bg-gray-900/60" : "bg-white/80"} backdrop-blur-md rounded-2xl p-4 ${darkMode ? "border border-white/10" : "border border-gray-200"} shadow-xl mb-4`}>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "profile" 
                      ? "bg-purple-600/50 text-white"
                      : darkMode 
                          ? "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  <span>{t("profile")}</span>
                  {activeTab === "profile" && <ChevronRightIcon className="h-4 w-4 ml-auto" />}
                </button>
                
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "notifications" 
                      ? "bg-purple-600/50 text-white"
                      : darkMode 
                          ? "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <BellIcon className="h-5 w-5 mr-3" />
                  <span>{t("notifications")}</span>
                  {activeTab === "notifications" && <ChevronRightIcon className="h-4 w-4 ml-auto" />}
                </button>
                
                <button
                  onClick={() => setActiveTab("privacy")}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "privacy" 
                      ? "bg-purple-600/50 text-white"
                      : darkMode 
                          ? "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <EyeIcon className="h-5 w-5 mr-3" />
                  <span>{t("privacy")}</span>
                  {activeTab === "privacy" && <ChevronRightIcon className="h-4 w-4 ml-auto" />}
                </button>
                
                <button
                  onClick={() => setActiveTab("hours")}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "hours" 
                      ? "bg-purple-600/50 text-white"
                      : darkMode 
                          ? "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <ClockIcon className="h-5 w-5 mr-3" />
                  <span>{t("working_hours")}</span>
                  {activeTab === "hours" && <ChevronRightIcon className="h-4 w-4 ml-auto" />}
                </button>
                
                <button
                  onClick={() => setActiveTab("language")}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "language" 
                      ? "bg-purple-600/50 text-white"
                      : darkMode 
                          ? "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <GlobeAltIcon className="h-5 w-5 mr-3" />
                  <span>{t("language")}</span>
                  {activeTab === "language" && <ChevronRightIcon className="h-4 w-4 ml-auto" />}
                </button>
                
                <button
                  onClick={() => setActiveTab("service_link")}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition ${
                    activeTab === "service_link" 
                      ? "bg-purple-600/50 text-white"
                      : darkMode 
                          ? "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <ChevronRightIcon className="h-5 w-5 mr-3" />
                  <span>{t("booking_link")}</span>
                  {activeTab === "service_link" && <ChevronRightIcon className="h-4 w-4 ml-auto" />}
                </button>
              </nav>
            </div>
            
            <div className={`hidden md:block ${darkMode ? "bg-gray-900/60" : "bg-white/80"} backdrop-blur-md rounded-2xl p-4 ${darkMode ? "border border-white/10" : "border border-gray-200"} shadow-xl`}>
              <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                <p>{t("smart_booking")}</p>
                <p>{t("version")} 1.0.0</p>
                <p className="mt-2">© 2023 {t("all_rights_reserved")}</p>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1">
            <div className={`${darkMode ? "bg-gray-900/60" : "bg-white/80"} backdrop-blur-md rounded-2xl p-6 ${darkMode ? "border border-white/10" : "border border-gray-200"} shadow-xl mb-6`}>
              {/* Profile Section */}
              {activeTab === "profile" && (
                <div className="opacity-100">
                  <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>{t("profile_settings")}</h2>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        {croppedImage ? (
                          <img 
                            src={croppedImage} 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                        <span className="text-4xl font-bold text-white">{profile.name.charAt(0)}</span>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageChange}
                      />
                      <button 
                        onClick={handleProfileImageClick}
                        className="absolute bottom-0 right-0 bg-purple-600 text-white p-1 rounded-full shadow-lg hover:bg-purple-700 transition"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                    
         <div>
                      <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{profile.name}</h3>
                      <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{profile.role}</p>
                    </div>
         </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name Field */}
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>{t("full_name")}</label>
                        <div className="flex items-center">
                          {editingField === 'name' ? (
                            <div className="flex-1 flex items-center">
                              <input 
                                type="text" 
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                className={`w-full px-4 py-2 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-300"} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? "text-white" : "text-gray-800"}`}
                              />
                              <button 
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="ml-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              >
                                {saving ? (
                                  <ArrowPathIcon className="h-4 w-4" />
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button 
                                onClick={() => setEditingField(null)}
                                className="ml-2 p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={`flex-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{profile.name}</span>
                              <button 
                                onClick={() => handleEditField('name')}
                                className={`p-1 ${darkMode ? "text-gray-400 hover:text-purple-400" : "text-gray-600 hover:text-purple-600"} transition`}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Email Field */}
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>{t("email_address")}</label>
               <div className="flex items-center">
                          {editingField === 'email' ? (
                            <div className="flex-1 flex items-center">
                              <input 
                                type="email" 
                                name="email"
                                value={profile.email}
                                onChange={handleProfileChange}
                                className={`w-full px-4 py-2 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-300"} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? "text-white" : "text-gray-800"}`}
                              />
                              <button 
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="ml-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              >
                                {saving ? (
                                  <div className="h-4 w-4 bg-white/50 rounded-full"></div>
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button 
                                onClick={() => setEditingField(null)}
                                className="ml-2 p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={`flex-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{profile.email}</span>
                              <button 
                                onClick={() => handleEditField('email')}
                                className={`p-1 ${darkMode ? "text-gray-400 hover:text-purple-400" : "text-gray-600 hover:text-purple-600"} transition`}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
               </div>
               
                      {/* Phone Field */}
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>{t("phone_number")}</label>
               <div className="flex items-center">
                          {editingField === 'phone' ? (
                            <div className="flex-1 flex items-center">
                              <input 
                                type="tel" 
                                name="phone"
                                value={profile.phone}
                                onChange={handleProfileChange}
                                className={`w-full px-4 py-2 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-300"} border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode ? "text-white" : "text-gray-800"}`}
                              />
                              <button 
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="ml-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => setEditingField(null)}
                                className="ml-2 p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={`flex-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{profile.phone}</span>
                              <button 
                                onClick={() => handleEditField('phone')}
                                className={`p-1 ${darkMode ? "text-gray-400 hover:text-purple-400" : "text-gray-600 hover:text-purple-600"} transition`}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
               </div>
               
                      {/* Role Field - Read only */}
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>{t("role")}</label>
               <div className="flex items-center">
                          <span className={`flex-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{profile.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notifications Section */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>{t("notification_settings")}</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className={darkMode ? "text-white" : "text-gray-800"}>{t("email_notifications")}</span>
                          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("receive_email_notifications_for_important_updates")}</p>
                        </div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={notifications.email}
                            onChange={() => handleToggleSetting('notifications', 'email')}
                          />
                          <div className={`block w-14 h-8 rounded-full transition ${notifications.email ? 'bg-purple-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${notifications.email ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className={darkMode ? "text-white" : "text-gray-800"}>{t("browser_notifications")}</span>
                          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("show_desktop_notifications_for_important_alerts")}</p>
                        </div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={notifications.browser}
                            onChange={() => handleToggleSetting('notifications', 'browser')}
                          />
                          <div className={`block w-14 h-8 rounded-full transition ${notifications.browser ? 'bg-purple-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${notifications.browser ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className={darkMode ? "text-white" : "text-gray-800"}>{t("appointment_reminders")}</span>
                          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("get_notifications_about_upcoming_appointments")}</p>
                        </div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={notifications.appointments}
                            onChange={() => handleToggleSetting('notifications', 'appointments')}
                          />
                          <div className={`block w-14 h-8 rounded-full transition ${notifications.appointments ? 'bg-purple-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${notifications.appointments ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Privacy Section */}
              {activeTab === "privacy" && (
                <div>
                  <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>{t("privacy_settings")}</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className={darkMode ? "text-white" : "text-gray-800"}>{t("share_usage_data")}</span>
                          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("share_anonymous_usage_data_to_improve_our_service")}</p>
                        </div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={privacy.shareData}
                            onChange={() => handleToggleSetting('privacy', 'shareData')}
                          />
                          <div className={`block w-14 h-8 rounded-full transition ${privacy.shareData ? 'bg-purple-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${privacy.shareData ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className={darkMode ? "text-white" : "text-gray-800"}>{t("allow_analytics")}</span>
                          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("allow_us_to_collect_analytics_on_app_usage")}</p>
                        </div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={privacy.analytics}
                            onChange={() => handleToggleSetting('privacy', 'analytics')}
                          />
                          <div className={`block w-14 h-8 rounded-full transition ${privacy.analytics ? 'bg-purple-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${privacy.analytics ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    </div>
                    
                    <div className={`pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                      <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"} mb-4`}>{t("data_management")}</h3>
                      <button
                        onClick={handleClearData}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                        disabled={saving}
                      >
                        {saving ? 'Processing...' : t("export_your_data")}
                      </button>
                      <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-sm mt-2`}>{t("download_a_copy_of_your_personal_data_stored_in_this_application")}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Working Hours Section */}
              {activeTab === "hours" && (
                <div>
                  <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>{t("business_hours")}</h2>
                  
                  <div className="space-y-6">
                    {/* Days of Week Selection */}
                    <div>
                      <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {t("days_open")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                          <button
                            key={day}
                            onClick={() => toggleDaySelection(index)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                              workingHours.daysOpen[index]
                                ? "bg-purple-600 text-white"
                                : darkMode
                                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Working Hours Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {t("opening_time")}
                        </label>
                        <input
                          type="time"
                          value={workingHours.start}
                          onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                          className={`w-full px-4 py-2 ${
                            darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                          } border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {t("closing_time")}
                        </label>
                        <input
                          type="time"
                          value={workingHours.end}
                          onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                          className={`w-full px-4 py-2 ${
                            darkMode
                              ? "bg-gray-800/50 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                          } border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        />
                      </div>
                    </div>
                    
                    {/* Service Availability */}
                    <div className="mt-10">
                      <h3 className={`text-lg font-medium mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {t("service_availability")}
                      </h3>
                      
                      {/* List of services */}
                      <div className="space-y-4 mb-6">
                        {services.length === 0 ? (
                          <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                            <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {t("no_services_found_add_services_in_the_services_section_first")}
                            </p>
                          </div>
                        ) : (
                          services.map((service) => {
                            const availability = serviceAvailabilities[service._id] || { 
                              allDay: true, 
                              start: workingHours.start, 
                              end: workingHours.end 
                            };
                            
                            return (
                              <div 
                                key={service._id} 
                                className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                                    {service.name}
                                  </h4>
                                  <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    {service.duration} min • EGP {service.price}
                                  </div>
                                </div>
                                
                                <div className="flex items-center mb-3">
                                  <input
                                    type="checkbox"
                                    id={`allDay-${service._id}`}
                                    checked={availability.allDay}
                                    onChange={(e) => handleServiceAvailabilityChange(service._id, 'allDay', e.target.checked)}
                                    className="mr-2"
                                  />
                                  <label 
                                    htmlFor={`allDay-${service._id}`}
                                    className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                                  >
                                    {t("available_all_day")}
                                  </label>
                                </div>
                                
                                {!availability.allDay && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className={`block text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {t("from")}
                                      </label>
                                      <input
                                        type="time"
                                        value={availability.start}
                                        onChange={(e) => handleServiceAvailabilityChange(service._id, 'start', e.target.value)}
                                        className={`w-full px-2 py-1 text-sm ${
                                          darkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-gray-800"
                                        } border rounded-md`}
                                      />
                                    </div>
                                    <div>
                                      <label className={`block text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {t("to")}
                                      </label>
                                      <input
                                        type="time"
                                        value={availability.end}
                                        onChange={(e) => handleServiceAvailabilityChange(service._id, 'end', e.target.value)}
                                        className={`w-full px-2 py-1 text-sm ${
                                          darkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-gray-800"
                                        } border rounded-md`}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Language Settings Section */}
              {activeTab === "language" && (
                <div className="opacity-100">
                  <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>{t("language_settings")}</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-3`}>
                        {t("select_application_language")}
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={language === 'ar' ? toggleLanguage : undefined}
                          className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                            language === 'en' 
                              ? `${darkMode ? "border-purple-500 bg-purple-900/20" : "border-purple-500 bg-purple-50"}`
                              : `${darkMode ? "border-gray-700 hover:border-purple-500/50" : "border-gray-300 hover:border-purple-500/50"}`
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">🇺🇸</span>
                            <span className={darkMode ? "text-white" : "text-gray-800"}>{t("english")}</span>
                          </div>
                          
                          {language === 'en' && (
                            <div className={`h-3 w-3 rounded-full ${darkMode ? "bg-purple-500" : "bg-purple-600"}`}></div>
                          )}
                        </button>
                        
                        <button
                          onClick={language === 'en' ? toggleLanguage : undefined}
                          className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                            language === 'ar' 
                              ? `${darkMode ? "border-purple-500 bg-purple-900/20" : "border-purple-500 bg-purple-50"}`
                              : `${darkMode ? "border-gray-700 hover:border-purple-500/50" : "border-gray-300 hover:border-purple-500/50"}`
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-xl mr-3">🇪🇬</span>
                            <span className={darkMode ? "text-white" : "text-gray-800"}>{t("arabic")}</span>
                          </div>
                          
                          {language === 'ar' && (
                            <div className={`h-3 w-3 rounded-full ${darkMode ? "bg-purple-500" : "bg-purple-600"}`}></div>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-purple-900/20 border border-purple-500/20" : "bg-purple-50 border border-purple-100"}`}>
                      <p className={`text-sm ${darkMode ? "text-purple-300" : "text-purple-700"}`}>
                        {t("rtl_ltr_info")}
                      </p>
                    </div>
                    
                    {language === 'ar' && (
                      <div className={`p-4 rounded-lg ${darkMode ? "bg-blue-900/20 border border-blue-500/20" : "bg-blue-50 border border-blue-100"}`}>
                        <p className={`text-sm ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                          {t("arabic_selected_message")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Service Link Tab */}
              {activeTab === "service_link" && (
                <div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-4`}>
                    <h2 className="text-xl font-semibold mb-4">{t("setup_your_booking_page")}</h2>
                    
                    {hasServiceLink ? (
                      <div>
                        <div className="mb-6">
                          <p className="mb-4">{t("your_current_booking_link_setup")}:</p>
                          <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{serviceName}</p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{serviceLink}</p>
                              </div>
                              <button 
                                onClick={() => setHasServiceLink(false)}
                                className={`p-2 rounded-md ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-4">{t("would_you_like_to_set_up_a_direct_link_to_your_most_popular_service")} {t("this_makes_it_easy_to_share_with_your_customers")}</p>
                        
                        <div className="mb-6">
                          <label className="block mb-2 font-medium">{t("service_name")}</label>
                          <input
                            type="text"
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border `}
                          />
                        </div>
                        
                        <div className="mb-6">
                          <label className="block mb-2 font-medium">{t("service_link")}</label>
                          <input
                            type="text"
                            value={serviceLink}
                            onChange={(e) => setServiceLink(e.target.value)}
                            className={`w-full p-2 rounded-md ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border `}
                            placeholder="https://your-booking-link.com/"
                          />
                        </div>
                        
                        <div className="flex gap-4">
                          <button
                            onClick={handleDeclineServiceLink}
                            className={`py-2 px-4 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                          >
                            {t("not_now")}
                          </button>
                          <button
                            onClick={handleSaveServiceLink}
                            className={`py-2 px-4 rounded-md ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                            disabled={saving}
                          >
                            {saving ? (
                              <ArrowPathIcon className="h-5 w-5 inline animate-spin" />
                            ) : (
                              t("save_service_link")
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="font-medium mb-2">{t("about_booking_links")}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t("setting_up_a_booking_link_allows_your_customers_to_quickly_access_your_booking_page_for_a_specific_service")}
                      {t("share_this_link_on_social_media_your_website_or_in_emails_to_make_it_easier_for_customers_to_book_with_you")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
         </div>

      {/* Image Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-11/12 max-w-md p-6 rounded-2xl shadow-2xl ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              {t("crop_profile_picture")}
            </h3>
            <p className={`mb-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {t("drag_or_resize_the_image_to_see_how_it_will_appear_in_your_profile")}
            </p>
            <div className="relative h-64 mb-4">
              {selectedImage && (
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
                {t("zoom")}
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelCrop}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  darkMode 
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                } transition-colors`}
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleCropImage}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
   );
}
