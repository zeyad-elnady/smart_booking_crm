import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay, parseISO, isBefore, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, getDay, Day } from 'date-fns';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Service } from '@/types/service';
import type { Appointment } from '@/types/appointment';
import { dayNumberToName, businessSettings as defaultBusinessSettings } from '@/config/settings';
import { getBusinessSettings, BusinessSettings } from '@/services/businessSettingsService';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/context/LanguageContext';
import { format24To12 } from '@/utils/timeUtils';

interface DateTimeSelectorProps {
  onSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  selectedService?: Service | null;
  existingAppointments?: Appointment[];
}

interface DateAvailability {
  date: string;
  isFullyBooked: boolean;
  isDayOff: boolean;
  isPast: boolean;
  availableSlots: number;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  onSelect,
  selectedDate,
  selectedTime,
  selectedService,
  existingAppointments = []
}) => {
  const { darkMode } = useTheme();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(selectedDate ? parseISO(selectedDate) : null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(selectedTime || '');
  const [showTimeSlots, setShowTimeSlots] = useState<boolean>(!!selectedDateObj);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [dateAvailability, setDateAvailability] = useState<Record<string, DateAvailability>>({});
  const [calculatingAvailability, setCalculatingAvailability] = useState<boolean>(false);
  
  // Default service duration - use default if no service is selected
  const serviceDuration = useMemo(() => {
    if (selectedService && selectedService.duration) {
      const duration = Number(selectedService.duration);
      return isNaN(duration) ? 60 : duration;
    }
    return 60; // Default duration
  }, [selectedService]);

  // Initialize the component with the selected date and time if provided
  useEffect(() => {
    if (selectedDate) {
      try {
        const date = parseISO(selectedDate);
        setSelectedDateObj(date);
        setShowTimeSlots(true);
        
        // If the selected date isn't in the current view, update the current date
        if (date) {
          setCurrentDate(date);
        }
      } catch (error) {
        console.error("Error parsing selected date:", error);
      }
    }
    
    if (selectedTime) {
      setSelectedTimeSlot(selectedTime);
    }
  }, [selectedDate, selectedTime]);

  // Load business settings on mount
  useEffect(() => {
    const loadBusinessSettings = async () => {
      setLoadingSettings(true);
      try {
        // First try to load from localStorage for most recent settings
        try {
          const localSettings = localStorage.getItem('businessHoursSettings');
          if (localSettings) {
            const parsedSettings = JSON.parse(localSettings);
            if (parsedSettings && Object.keys(parsedSettings).length > 0) {
              console.log('Loaded business hours from localStorage:', parsedSettings);
              
              // Ensure service availabilities are properly loaded if they exist
              if (!parsedSettings.serviceAvailabilities && selectedService) {
                console.log('No service availabilities in settings, initializing empty object');
                parsedSettings.serviceAvailabilities = {};
              }
              
              // Log service availability if a service is selected
              if (selectedService && parsedSettings.serviceAvailabilities) {
                const serviceAvailability = parsedSettings.serviceAvailabilities[selectedService._id];
                if (serviceAvailability) {
                  console.log(`Found availability for service ${selectedService.name}:`, serviceAvailability);
                } else {
                  console.log(`No specific availability found for service ${selectedService.name}`);
                }
              }
              
              setBusinessSettings(parsedSettings);
              setLoadingSettings(false);
              return;
            }
          }
        } catch (parseError) {
          console.error("Error parsing business hours from localStorage:", parseError);
        }
        
        // If localStorage doesn't have valid settings, try the service
        const settings = await getBusinessSettings();
        console.log('Loaded business hours from service:', settings);
        
        // Ensure service availabilities property exists
        if (!settings.serviceAvailabilities) {
          settings.serviceAvailabilities = {};
        }
        
        setBusinessSettings(settings);
        setSettingsError(null);
      } catch (error) {
        console.error("Error loading business settings:", error);
        // Create default settings with service availabilities
        const defaultSettingsWithService = {
          ...defaultBusinessSettings,
          serviceAvailabilities: {}
        };
        setBusinessSettings(defaultSettingsWithService);
        setSettingsError("Failed to load business settings. Using defaults.");
      } finally {
        setLoadingSettings(false);
      }
    };
    
    loadBusinessSettings();
  }, [selectedService]);

  // Listen for changes to business hours
  useEffect(() => {
    // Function to handle business hours changes
    const handleBusinessHoursChange = (event: Event) => {
      try {
        // Force recalculation of availability
        const customEvent = event as CustomEvent;
        if (customEvent.detail) {
          console.log('Business hours changed event received:', customEvent.detail);
          
          // Update business settings
          setBusinessSettings(customEvent.detail);
          
          // Clear the time slots cache by forcing a recalculation
          setDateAvailability({});
          
          // Force immediate recalculation of time slots if a date is selected
          if (selectedDateObj) {
            const newSlots = generateTimeSlotsForDate(selectedDateObj);
            console.log('Recalculated time slots after settings change:', newSlots);
            
            // If the currently selected time is no longer available, clear it
            if (selectedTimeSlot && !newSlots.includes(selectedTimeSlot)) {
              console.log('Selected time no longer available, clearing selection');
              setSelectedTimeSlot('');
            }
          }
        }
      } catch (error) {
        console.error('Error handling business hours change event:', error);
      }
    };
    
    // Check localStorage for refresh flag
    const checkForRefresh = () => {
      const shouldRefresh = localStorage.getItem("appointmentListShouldRefresh");
      if (shouldRefresh === "true") {
        localStorage.removeItem("appointmentListShouldRefresh");
        console.log('Business hours refresh flag detected, recalculating availability');
        
        // Load updated business hours settings
        try {
          const updatedSettingsStr = localStorage.getItem('businessHoursSettings');
          console.log('Raw business hours from localStorage:', updatedSettingsStr);
          
          if (updatedSettingsStr) {
            const updatedSettings = JSON.parse(updatedSettingsStr);
            if (updatedSettings && Object.keys(updatedSettings).length > 0) {
              console.log('Applying updated business settings:', updatedSettings);
              setBusinessSettings(updatedSettings);
              
              // Force recalculation of availability
              setDateAvailability({});
              
              // Force immediate recalculation of time slots if a date is selected
              if (selectedDateObj) {
                setTimeout(() => {
                  // This small delay ensures state updates have completed
                  const newSlots = generateTimeSlotsForDate(selectedDateObj);
                  console.log('Recalculated time slots after refresh:', newSlots);
                  
                  // If the currently selected time is no longer available, clear it
                  if (selectedTimeSlot && !newSlots.includes(selectedTimeSlot)) {
                    console.log('Selected time no longer available, clearing selection');
                    setSelectedTimeSlot('');
                  }
                }, 100);
              }
            }
          } else {
            console.log('No business hours settings found in localStorage');
          }
        } catch (error) {
          console.error('Error parsing business hours settings:', error);
        }
      }
    };

    // Add event listener for business hours changes
    window.addEventListener('businessHoursChanged', handleBusinessHoursChange);
    
    // Set interval to check for refresh flag
    const refreshInterval = setInterval(checkForRefresh, 1000); // Check more frequently
    
    // Initial check in case the component mounted after a change
    checkForRefresh();
    
    // Cleanup function
    return () => {
      window.removeEventListener('businessHoursChanged', handleBusinessHoursChange);
      clearInterval(refreshInterval);
    };
  }, [selectedDateObj, selectedTimeSlot]); // Add dependencies to re-register when these change
  
  // Re-generate time slots when selected service changes
  useEffect(() => {
    console.log('Selected service changed:', selectedService);
    
    // Force recalculation of availability for all dates in the view
    if (businessSettings) {
      // Clear date availability cache to force recalculation
      setDateAvailability({});
      
      // If a date is already selected, recalculate time slots for it
      if (selectedDateObj) {
        setTimeout(() => {
          // This small delay ensures state updates have completed
          const newSlots = generateTimeSlotsForDate(selectedDateObj);
          console.log('Recalculated time slots after service change:', newSlots);
          
          // If the currently selected time is no longer available, clear it
          if (selectedTimeSlot && !newSlots.includes(selectedTimeSlot)) {
            console.log('Selected time no longer available after service change, clearing selection');
            setSelectedTimeSlot('');
            // Notify parent that selection changed
            if (selectedDateObj) {
              const formattedDate = format(selectedDateObj, 'yyyy-MM-dd');
              onSelect(formattedDate, '');
            }
          }
        }, 100);
      }
    }
  }, [selectedService, businessSettings]);

  // Generate dates for the current view (week or month)
  const viewDates = useMemo(() => {
    if (viewMode === 'week') {
      // Use 0 for Sunday if in Arabic, 1 for Monday otherwise
      const weekStartsOn = isRTL ? 0 : 1;
      const startDate = startOfWeek(currentDate, { weekStartsOn: weekStartsOn as Day });
      return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      // Use 0 for Sunday if in Arabic, 1 for Monday otherwise
      const weekStartsOn = isRTL ? 0 : 1;
      const startDate = startOfWeek(monthStart, { weekStartsOn: weekStartsOn as Day });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: weekStartsOn as Day });
      
      const days = [];
      let day = startDate;
      while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    }
  }, [currentDate, viewMode, isRTL]);

  // Calculate availability for all visible dates when they change
  useEffect(() => {
    if (!selectedService || !businessSettings || loadingSettings) return;
    
    const calculateAllDatesAvailability = async () => {
      setCalculatingAvailability(true);
      
      const availability: Record<string, DateAvailability> = {};
      
      for (const date of viewDates) {
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        // Check if this day is a day off
        const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.
        const dayName = dayNumberToName[dayOfWeek as keyof typeof dayNumberToName];
        const dayConfig = businessSettings.daysOpen[dayName as keyof typeof businessSettings.daysOpen];
        
        if (!dayConfig?.open) {
          // This is a day off
          availability[formattedDate] = {
            isDayOff: true,
            isFullyBooked: false,
            availableSlots: 0
          };
          continue;
        }
        
        // Generate time slots for this date
        const slots = generateTimeSlotsForDate(date);
        
        // Count available slots
        let availableCount = 0;
        
        for (const slot of slots) {
          // Check if slot is available (not booked)
          const isBooked = existingAppointments.some(appointment => 
            appointment.date === formattedDate && appointment.time === slot
          );
          
          if (!isBooked) {
            availableCount++;
          }
        }
        
        // Determine if fully booked
        const isFullyBooked = availableCount === 0 && slots.length > 0;
        
        availability[formattedDate] = {
          isDayOff: false,
          isFullyBooked,
          availableSlots: availableCount
        };
      }
      
      setDateAvailability(availability);
      setCalculatingAvailability(false);
    };
    
    calculateAllDatesAvailability();
  }, [viewDates, selectedService, businessSettings, existingAppointments, loadingSettings]);
  
  // Generate time slots based on real business hours and service duration for a specific date
  const generateTimeSlotsForDate = (date: Date): string[] => {
    if (!businessSettings) {
      console.log("No business settings available, cannot generate time slots");
      return [];
    }
    
    try {
      // Get day of week (0-6, where 0 is Sunday)
      const dayOfWeek = getDay(date);
      
      // Get day name (monday, tuesday, etc.)
      const dayName = dayNumberToName[dayOfWeek as keyof typeof dayNumberToName];
      console.log(`Generating time slots for ${dayName} (day ${dayOfWeek})`);
      
      // Check if this day is open
      const dayConfig = businessSettings.daysOpen?.[dayName as keyof typeof businessSettings.daysOpen];
      if (!dayConfig?.open) {
        console.log(`${dayName} is marked as closed in settings`);
        return [];
      }
      
      // Get business hours for the day - use defaults if not specified
      let startTime = dayConfig.start;
      let endTime = dayConfig.end;
      
      // If day config doesn't have specific times, fall back to general business hours
      if (!startTime) {
        startTime = businessSettings.workingHours?.start || "09:00";
        console.log(`Using default start time: ${startTime}`);
      }
      
      if (!endTime) {
        endTime = businessSettings.workingHours?.end || "17:00";
        console.log(`Using default end time: ${endTime}`);
      }
      
      // Check for service-specific availability
      if (selectedService && businessSettings.serviceAvailabilities) {
        const serviceAvailability = businessSettings.serviceAvailabilities[selectedService._id];
        
        if (serviceAvailability) {
          console.log(`Found service-specific availability for ${selectedService.name}:`, serviceAvailability);
          
          // If service has specific times and not "all day", use those times
          if (!serviceAvailability.allDay) {
            startTime = serviceAvailability.start || startTime;
            endTime = serviceAvailability.end || endTime;
            
            console.log(`Using service-specific hours: ${startTime} - ${endTime}`);
          } else {
            console.log(`Service is available all day, using business hours: ${startTime} - ${endTime}`);
          }
        } else {
          console.log(`No specific availability found for service ${selectedService._id}, using business hours`);
        }
      } else {
        console.log(`No service selected or no service availabilities defined, using business hours`);
      }
      
      console.log(`Final business hours for ${dayName}: ${startTime} - ${endTime}`);
      
      // Parse start and end hours
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
        console.error("Invalid time format in business hours settings", { startTime, endTime });
        return [];
      }
      
      // Calculate start and end in minutes
      const startInMinutes = startHour * 60 + startMinute;
      const endInMinutes = endHour * 60 + endMinute;
      
      // Sanity check - make sure end time is after start time
      if (endInMinutes <= startInMinutes) {
        console.error("End time must be after start time", { startTime, endTime });
        return [];
      }
      
      // Get appointment buffer time
      const bufferTime = businessSettings.appointmentBuffer || 0;
      
      // Generate slots based on service duration
      const slots = [];
      const duration = serviceDuration || 30; // Default duration if service duration is not specified
      console.log(`Generating slots with duration: ${duration}min and buffer: ${bufferTime}min`);
      
      for (let min = startInMinutes; min <= endInMinutes - duration; min += duration) {
        const hour = Math.floor(min / 60);
        const minute = min % 60;
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
      
      console.log(`Generated ${slots.length} time slots for ${dayName}:`, slots);
      return slots;
    } catch (error) {
      console.error("Error generating time slots:", error);
      return [];
    }
  };
  
  // Generate time slots for the selected date
  const timeSlots = useMemo(() => {
    if (!selectedDateObj || !businessSettings) return [];
    return generateTimeSlotsForDate(selectedDateObj);
  }, [selectedDateObj, businessSettings, serviceDuration]);
  
  // Navigation functions
  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };
  
  // Check if a date is a day off based on calculated availability
  const isDayOff = (date: Date): boolean => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return dateAvailability[formattedDate]?.isDayOff || false;
  };
  
  // Check if a date is fully booked based on calculated availability
  const isDateFullyBooked = (date: Date): boolean => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return dateAvailability[formattedDate]?.isFullyBooked || false;
  };
  
  // Check if a date is in the past
  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  // Check if a time slot is available
  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedDateObj) return false;

    const formattedDate = format(selectedDateObj, 'yyyy-MM-dd');
    const conflictingAppointment = existingAppointments.find(appointment => {
      return appointment.date === formattedDate && appointment.time === time;
    });
    
    // Check if the time is in the past
    if (isTimeInPast(time)) return false;

    return !conflictingAppointment;
  };

  // Check if a time is in the past
  const isTimeInPast = (time: string): boolean => {
    if (!selectedDateObj) return false;
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(selectedDateObj, today)) return true;
    
    // If it's today, check the time
    if (isSameDay(selectedDateObj, now)) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
      return isBefore(timeDate, now);
    }
    
    return false;
  };
  
  // Handle date selection
  const handleDateClick = (date: Date) => {
    console.log("Date clicked:", format(date, 'yyyy-MM-dd'));
    setSelectedDateObj(date);
    setShowTimeSlots(true);
    
    // If we already have a selected time from props, keep it if valid for this date
    // otherwise clear it
    const formattedDate = format(date, 'yyyy-MM-dd');
    const timeSlotsForDate = generateTimeSlotsForDate(date);
    
    if (selectedTimeSlot) {
      const isValidTime = timeSlotsForDate.includes(selectedTimeSlot) && 
        !existingAppointments.some(appt => 
          appt.date === formattedDate && appt.time === selectedTimeSlot);
      
      if (!isValidTime) {
        setSelectedTimeSlot('');
      } else {
        // If the time is still valid for the new date, call onSelect with the new date and existing time
        onSelect(formattedDate, selectedTimeSlot);
      }
    }
    
    // Important: Don't call onSelect here if we don't have a time selected
    // This prevents automatic form submission when only selecting a date
  };
  
  // Handle time selection
  const handleTimeClick = (time: string) => {
    if (!selectedDateObj || !isTimeSlotAvailable(time)) return;
    
    console.log("Time clicked:", time);
    setSelectedTimeSlot(time);
    
    // Only now that we have both date and time, call onSelect
    if (selectedDateObj) {
      const formattedDate = format(selectedDateObj, 'yyyy-MM-dd');
      onSelect(formattedDate, time);
    }
  };
  
  // Get class names for date button based on its state
  const getDateButtonClass = (date: Date) => {
    const isSelected = selectedDateObj && isSameDay(date, selectedDateObj);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const availability = dateAvailability[formattedDate];
    const isPast = isDateInPast(date);
    const isDayOffFlag = isDayOff(date);
    const isFullyBooked = isDateFullyBooked(date);
    const isCurrentMonth = viewMode === 'month' && date.getMonth() === currentDate.getMonth();
    
    let className = 'relative flex flex-col items-center justify-center w-full h-full py-0.5 px-0.5 rounded-sm transition-all';
    
    // Base styling
    if (viewMode === 'month' && !isCurrentMonth) {
      className += ' opacity-40';
    }
    
    // Selection state
    if (isSelected) {
      className += ` ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`;
    } 
    // Unavailable states 
    else if (isPast) {
      className += ` ${darkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} opacity-60`;
    }
    else if (isDayOffFlag) {
      className += ` ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-500'}`;
    }
    else if (isFullyBooked) {
      className += ` ${darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-500'}`;
    }
    // Available state
    else {
      className += ` ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`;
    }
    
    return className;
  };
  
  // Get class names for time button based on its state
  const getTimeButtonClass = (time: string) => {
    const isSelected = time === selectedTimeSlot;
    const isAvailable = isTimeSlotAvailable(time);
    const isPast = isTimeInPast(time);
    
    let className = 'px-1 py-0.5 rounded-md text-[10px] font-medium transition-colors';
    
    if (isSelected) {
      className += ` ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`;
    } else if (!isAvailable || isPast) {
      className += ` ${darkMode ? 'bg-red-900/30 text-red-300 cursor-not-allowed' : 'bg-red-100 text-red-500 cursor-not-allowed'}`;
      if (isPast) {
        className += ' opacity-60';
      }
    } else {
      className += ` ${darkMode ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' : 'bg-green-100 text-green-600 hover:bg-green-200'}`;
    }
    
    return className;
  };
  
  // Render functions for different views
  const renderWeekView = () => {
    // Use the appropriate names based on language
    const dayLabels = isRTL 
      ? ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
      <div className="grid grid-cols-7 gap-0.5">
        {viewDates.map((date, index) => (
            <button
            type="button"
            key={date.toISOString()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDateClick(date);
            }}
            disabled={isDateInPast(date) || isDayOff(date)}
            className={getDateButtonClass(date)}
          >
            <div className="text-[10px]">{isRTL ? dayLabels[getDay(date)] : format(date, 'EEE')}</div>
            <div className="text-xs font-medium">{format(date, 'd')}</div>
            </button>
        ))}
      </div>
    );
  };
  
  const renderMonthView = () => {
    // Use the appropriate day names based on language
    const dayNames = isRTL 
      ? ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    // Reorder for RTL if needed
    const orderedDayNames = isRTL ? [...dayNames].reverse() : dayNames;
    
    return (
      <div className={isRTL ? "direction-rtl" : ""}>
        <div className="grid grid-cols-7 gap-0 mb-0.5">
          {orderedDayNames.map(day => (
            <div key={day} className={`text-center text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0.5">
          {viewDates.map((date) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            
            return (
              <button
                type="button"
                key={date.toISOString()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateClick(date);
                }}
                disabled={isDateInPast(date) || isDayOff(date) || !isCurrentMonth}
                className={`${getDateButtonClass(date)} h-6`}
              >
                <div className="text-xs">{format(date, 'd')}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderTimeSlots = () => {
    if (!selectedDateObj) return null;
    
    if (isDayOff(selectedDateObj)) {
      return (
        <div className={`p-2 text-center ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
          <p className="text-xs font-medium">{t('day_not_available')}</p>
          <p className="text-[10px] mt-0.5">{t('please_select_another_day')}</p>
        </div>
      );
    }
    
    return (
      <div>
        <h3 className="text-xs font-semibold mb-1 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {t('select_time_for')} {format(selectedDateObj, 'EEEE, d MMM')}
        </h3>
        
        {timeSlots.length > 0 ? (
        <div className="grid grid-cols-6 gap-1">
            {timeSlots.map((timeSlot) => (
              <button
                type="button"
                key={timeSlot}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTimeClick(timeSlot);
                }}
                disabled={!isTimeSlotAvailable(timeSlot)}
                className={getTimeButtonClass(timeSlot)}
              >
                {format24To12(timeSlot)}
              </button>
            ))}
          </div>
        ) : (
          <div className={`p-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-xs">{t('no_available_time_slots')}</p>
          </div>
        )}
      </div>
    );
  };

  // Legend for date and time status colors
  const renderLegend = () => (
    <div className="flex flex-wrap gap-1 text-[10px] mt-1">
      <div className="flex items-center">
        <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} mr-0.5`}></div>
        <span className={darkMode ? 'text-green-300' : 'text-green-600'}>{t('available')}</span>
      </div>
      <div className="flex items-center">
        <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'} mr-0.5`}></div>
        <span className={darkMode ? 'text-red-300' : 'text-red-500'}>{t('unavailable')}</span>
      </div>
      <div className="flex items-center">
        <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} opacity-60 mr-0.5`}></div>
        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{t('past')}</span>
      </div>
      <div className="flex items-center">
        <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-orange-900/30' : 'bg-orange-100'} mr-0.5`}></div>
        <span className={darkMode ? 'text-orange-300' : 'text-orange-500'}>{t('fully_booked')}</span>
      </div>
    </div>
  );
  
  // Loading state
  if (loadingSettings) {
    return (
      <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-900/60 border border-white/10' : 'bg-white border border-gray-200'} shadow-lg flex items-center justify-center min-h-[300px]`}>
        <div className="flex flex-col items-center">
          <Loader2 className={`w-10 h-10 mb-4 animate-spin ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{t('loading_business_settings')}</p>
        </div>
      </div>
    );
  }
  
  // Show a loading indicator while calculating availability
  if (calculatingAvailability && Object.keys(dateAvailability).length === 0) {
    return (
      <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-900/60 border border-white/10' : 'bg-white border border-gray-200'} shadow-lg flex items-center justify-center min-h-[300px]`}>
        <div className="flex flex-col items-center">
          <Loader2 className={`w-10 h-10 mb-4 animate-spin ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{t('calculating_availability') || "Calculating available dates..."}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (settingsError && !businessSettings) {
    return (
      <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-900/60 border border-white/10' : 'bg-white border border-gray-200'} shadow-lg flex items-center justify-center min-h-[300px]`}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-500'}`}>
            <span className="text-xl">!</span>
          </div>
          <p className={`${darkMode ? 'text-red-300' : 'text-red-500'} mb-2 font-medium`}>{settingsError}</p>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            {t('using_default_settings') || 'Using default settings'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-2 rounded-xl ${darkMode ? 'bg-gray-900/60 border border-white/10' : 'bg-white border border-gray-200'} shadow-lg`}>
      {/* View toggle and navigation */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewMode('week');
            }}
            className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
              viewMode === 'week'
                    ? darkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('week')}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewMode('month');
            }}
            className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
              viewMode === 'month'
                    ? darkMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500 text-white'
                    : darkMode
                ? 'bg-gray-800 text-gray-300'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('month')}
          </button>
        </div>
        
        <div className="flex space-x-0 items-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrevious();
            }}
            className={`p-1 rounded-full ${
              darkMode
                ? 'hover:bg-gray-800 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
            {viewMode === 'week'
              ? `${format(viewDates[0], 'MMM d')} - ${format(viewDates[6], 'MMM d')}`
              : format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className={`p-1 rounded-full ${
              darkMode
                ? 'hover:bg-gray-800 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ChevronRight className="w-3 h-3" />
              </button>
        </div>
      </div>

      {/* Calendar view */}
      <div className="mb-2">
        <h3 className="text-xs font-semibold mb-1 flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {t('select_date')}
        </h3>
        
        {viewMode === 'week' ? renderWeekView() : renderMonthView()}
        
        {renderLegend()}
      </div>

      {/* Time slots section - shown only after date selection */}
      {showTimeSlots && (
        <div className="mt-2 border-t pt-2 border-gray-700">
          {renderTimeSlots()}
        </div>
      )}
    </div>
  );
};

export default DateTimeSelector;