import axios from "./axiosConfig";
import { businessSettings as defaultSettings } from "@/config/settings";
import { indexedDBService } from "./indexedDB";

// Type definitions for business settings
export interface BusinessHours {
  start: string;
  end: string;
}

export interface DayConfig {
  open: boolean;
  start: string;
  end: string;
}

export interface DaysOpenConfig {
  monday: DayConfig;
  tuesday: DayConfig;
  wednesday: DayConfig;
  thursday: DayConfig;
  friday: DayConfig;
  saturday: DayConfig;
  sunday: DayConfig;
}

export interface BusinessSettings {
  workingHours: {
    start: string;
    end: string;
    daysOff: number[];
  };
  daysOpen: DaysOpenConfig;
  appointmentBuffer: number;
  businessName?: string;
  currency?: string;
  timezone?: string;
}

// Check if we're in a development environment
const isDevelopmentMode = () => {
  if (typeof window !== 'undefined') {
    // Check for localhost or other indicators of development
    return window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' || 
      window.location.hostname.includes('192.168.') ||
      window.location.hostname.includes('.local') ||
      process.env.NODE_ENV === 'development';
  }
  return process.env.NODE_ENV === 'development';
};

// Get business settings from IndexedDB or local config (skipping API in development mode)
export const getBusinessSettings = async (): Promise<BusinessSettings> => {
  try {
    // Initialize DB
    await indexedDBService.initDB();
    
    // Try to get settings from IndexedDB first
    try {
      const settings = await indexedDBService.getBusinessSettings();
      if (settings) {
        console.log("Business settings loaded from IndexedDB:", settings);
        return settings;
      }
    } catch (dbError) {
      console.warn("Could not load settings from IndexedDB:", dbError);
    }
    
    // If in development mode or not online, skip API and use default settings
    const isDevMode = isDevelopmentMode();
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    
    if (!isDevMode && !isOffline && navigator.onLine) {
      try {
        console.log("Fetching business settings from API");
        const response = await axios.get("/settings/business");
        const settings = response.data;
        
        // Store in IndexedDB for offline use
        await indexedDBService.saveBusinessSettings(settings);
        
        console.log("Business settings loaded from API:", settings);
        return settings;
      } catch (apiError) {
        console.error("Error fetching business settings from API:", apiError);
      }
    } else {
      console.log("Using local settings (development mode or offline)");
    }
    
    // If we reach here, use default settings and save them to IndexedDB
    console.warn("Using default business settings");
    
    // Save default settings to IndexedDB for future use
    await indexedDBService.saveBusinessSettings(defaultSettings);
    
    return defaultSettings;
  } catch (error) {
    console.error("Error in getBusinessSettings:", error);
    return defaultSettings;
  }
};

// Update business settings
export const updateBusinessSettings = async (settings: Partial<BusinessSettings>): Promise<BusinessSettings> => {
  try {
    // Get current settings first
    const currentSettings = await getBusinessSettings();
    
    // Merge new settings with current ones
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      // If daysOpen is passed, merge with existing days
      daysOpen: settings.daysOpen 
        ? { ...currentSettings.daysOpen, ...settings.daysOpen } 
        : currentSettings.daysOpen
    };
    
    // Save to IndexedDB first
    await indexedDBService.saveBusinessSettings(updatedSettings);
    
    // If online and not in development mode, update on server
    const isDevMode = isDevelopmentMode();
    if (!isDevMode && navigator.onLine) {
      await axios.put("/settings/business", updatedSettings);
    } else {
      // Mark for sync later
      await indexedDBService.markSettingsForSync();
    }
    
    return updatedSettings;
  } catch (error) {
    console.error("Error updating business settings:", error);
    throw error;
  }
};

// Check if a specific time is within working hours
export const isWithinWorkingHours = (
  date: Date, 
  timeString: string, 
  settings: BusinessSettings
): boolean => {
  // Get day of the week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = date.getDay();
  
  // Map day number to day name
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = dayNames[dayOfWeek];
  
  // Get day config
  const dayConfig = settings.daysOpen[dayName as keyof typeof settings.daysOpen];
  
  // If day is not open, return false
  if (!dayConfig.open) return false;
  
  // Parse time
  const [hours, minutes] = timeString.split(":").map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Parse business hours
  const [startHours, startMinutes] = dayConfig.start.split(":").map(Number);
  const [endHours, endMinutes] = dayConfig.end.split(":").map(Number);
  
  const startInMinutes = startHours * 60 + startMinutes;
  const endInMinutes = endHours * 60 + endMinutes;
  
  // Check if time is within business hours
  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes - settings.appointmentBuffer;
}; 