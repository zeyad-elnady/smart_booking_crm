import { IndexedDBService } from './indexedDB';

// Constants
const LOCAL_STORAGE_SETTINGS_KEY = 'appSettings';
const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';

// IndexedDB instance
const dbService = new IndexedDBService();

// Interface for settings
export interface AppSettings {
  darkMode?: boolean;
  language?: string;
  currency?: string;
  [key: string]: any; // Allow for dynamic settings
}

/**
 * Get all settings from both localStorage and IndexedDB
 * Merges settings from both sources with IndexedDB taking precedence
 */
export async function getSettings(): Promise<AppSettings> {
  // Start with defaults
  let settings: AppSettings = {
    darkMode: false,
    language: 'en',
    currency: 'EGP'
  };

  try {
    // Get settings from localStorage
    const localSettings = getLocalSettings();
    if (localSettings) {
      settings = { ...settings, ...localSettings };
    }

    // Get settings from IndexedDB (takes precedence)
    const dbSettings = await getDBSettings();
    if (dbSettings) {
      settings = { ...settings, ...dbSettings };
    }

    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return settings; // Return defaults if error
  }
}

/**
 * Save settings to both localStorage and IndexedDB
 */
export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    // Save to localStorage
    saveLocalSettings(settings);
    
    // Save to IndexedDB
    await saveDBSettings(settings);
    
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Get a specific setting value
 */
export async function getSetting(key: string): Promise<any> {
  const settings = await getSettings();
  return settings[key];
}

/**
 * Save a specific setting value
 */
export async function saveSetting(key: string, value: any): Promise<boolean> {
  try {
    const settings = await getSettings();
    settings[key] = value;
    return await saveSettings(settings);
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    return false;
  }
}

// Private functions for internal use

/**
 * Get settings from localStorage
 */
function getLocalSettings(): AppSettings | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (!storedSettings) return null;
    
    return JSON.parse(storedSettings);
  } catch (error) {
    console.error('Error parsing local settings:', error);
    return null;
  }
}

/**
 * Save settings to localStorage
 */
function saveLocalSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving local settings:', error);
  }
}

/**
 * Get settings from IndexedDB
 */
async function getDBSettings(): Promise<AppSettings | null> {
  try {
    // Initialize IndexedDB
    await dbService.initDB();
    
    // Get settings JSON string from IndexedDB
    const settingsJson = await dbService.getSetting('appSettings');
    if (!settingsJson) return null;
    
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Error getting DB settings:', error);
    return null;
  }
}

/**
 * Save settings to IndexedDB
 */
async function saveDBSettings(settings: AppSettings): Promise<void> {
  try {
    // Initialize IndexedDB
    await dbService.initDB();
    
    // Convert settings to JSON string and save
    const settingsJson = JSON.stringify(settings);
    await dbService.saveSetting('appSettings', settingsJson);
  } catch (error) {
    console.error('Error saving DB settings:', error);
    throw error;
  }
}

/**
 * Get notification settings from localStorage
 * This is a compatibility function for existing code
 */
export function getNotificationSettings(): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!storedSettings) return null;
    
    return JSON.parse(storedSettings);
  } catch (error) {
    console.error('Error parsing notification settings:', error);
    return null;
  }
}

/**
 * Save notification settings to localStorage
 * This is a compatibility function for existing code
 */
export function saveNotificationSettings(settings: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
} 