import { useState, useEffect } from 'react';
import { businessSettings, dayNumberToName } from '@/config/settings';
import { useTheme } from '@/components/ThemeProvider';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { format24To12, format12To24 } from '@/utils/timeUtils';

type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const dayMap: Record<DayName, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0
};

export default function BusinessHoursSettings() {
  const { darkMode } = useTheme();
  
  // Load settings from localStorage if available, otherwise use default settings
  const [settings, setSettings] = useLocalStorage('businessHoursSettings', businessSettings);
  
  // State for days open
  const [daysOpen, setDaysOpen] = useState<Record<DayName, boolean>>({
    monday: settings.daysOpen.monday.open,
    tuesday: settings.daysOpen.tuesday.open,
    wednesday: settings.daysOpen.wednesday.open,
    thursday: settings.daysOpen.thursday.open,
    friday: settings.daysOpen.friday.open,
    saturday: settings.daysOpen.saturday.open,
    sunday: settings.daysOpen.sunday.open
  });
  
  // State for opening and closing times in 12-hour format
  const [openingTime12h, setOpeningTime12h] = useState(format24To12(settings.workingHours.start));
  const [closingTime12h, setClosingTime12h] = useState(format24To12(settings.workingHours.end));
  
  // Update settings whenever form values change
  useEffect(() => {
    const updatedSettings = {...settings};
    
    // Update days open
    (Object.keys(daysOpen) as DayName[]).forEach(day => {
      updatedSettings.daysOpen[day].open = daysOpen[day];
      updatedSettings.daysOpen[day].start = format12To24(openingTime12h);
      updatedSettings.daysOpen[day].end = format12To24(closingTime12h);
    });
    
    // Update days off array based on daysOpen
    updatedSettings.workingHours.daysOff = Object.entries(daysOpen)
      .filter(([_, isOpen]) => !isOpen)
      .map(([day]) => dayMap[day as DayName]);
    
    // Save settings
    setSettings(updatedSettings);
    
    // Make settings globally accessible
    (window as any).businessHoursSettings = updatedSettings;
    
    // Dispatch custom event to notify other components
    const event = new CustomEvent('businessHoursChanged', { detail: updatedSettings });
    window.dispatchEvent(event);
  }, [daysOpen, openingTime12h, closingTime12h, setSettings]);
  
  const handleDayToggle = (day: DayName) => {
    setDaysOpen(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  
  const handleTimeChange = (value: string, setter: (value: string) => void) => {
    setter(value);
  };
  
  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-lg`}>
      <h2 className="text-2xl font-bold mb-6">Business Hours</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Days Open</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(daysOpen) as DayName[]).map(day => (
            <button
              key={day}
              onClick={() => handleDayToggle(day)}
              className={`
                py-2 px-4 rounded-lg text-center transition-colors
                ${daysOpen[day] 
                  ? 'bg-purple-500 text-white' 
                  : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Opening Time</h3>
          <div className="relative">
            <select
              value={openingTime12h}
              onChange={(e) => handleTimeChange(e.target.value, setOpeningTime12h)}
              className={`w-full py-2 px-4 rounded-lg border appearance-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const hour = i % 12 || 12;
                const period = i < 12 ? 'AM' : 'PM';
                const time = `${hour}:00 ${period}`;
                const time30 = `${hour}:30 ${period}`;
                return [
                  <option key={time} value={time}>{time}</option>,
                  <option key={time30} value={time30}>{time30}</option>
                ];
              })}
            </select>
            <span className="absolute right-4 top-2.5 text-gray-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Closing Time</h3>
          <div className="relative">
            <select
              value={closingTime12h}
              onChange={(e) => handleTimeChange(e.target.value, setClosingTime12h)}
              className={`w-full py-2 px-4 rounded-lg border appearance-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const hour = i % 12 || 12;
                const period = i < 12 ? 'AM' : 'PM';
                const time = `${hour}:00 ${period}`;
                const time30 = `${hour}:30 ${period}`;
                return [
                  <option key={time} value={time}>{time}</option>,
                  <option key={time30} value={time30}>{time30}</option>
                ];
              })}
            </select>
            <span className="absolute right-4 top-2.5 text-gray-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Service Availability</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Configure service-specific availability in the Services section.
        </p>
      </div>
    </div>
  );
} 