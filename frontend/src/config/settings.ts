// Default business settings
export const businessSettings = {
  workingHours: {
    start: '10:00',
    end: '20:00',
    daysOff: [5], // Friday is day off (5)
  },
  // Days open settings (0 = Sunday, 6 = Saturday)
  daysOpen: {
    monday: { open: true, start: '10:00', end: '20:00' },
    tuesday: { open: true, start: '10:00', end: '20:00' },
    wednesday: { open: true, start: '10:00', end: '20:00' },
    thursday: { open: true, start: '10:00', end: '20:00' },
    friday: { open: false, start: '10:00', end: '20:00' }, // Friday closed
    saturday: { open: true, start: '10:00', end: '20:00' },
    sunday: { open: true, start: '10:00', end: '20:00' },
  },
  // Default time buffer between appointments (in minutes)
  appointmentBuffer: 15,
};

// Service availability settings
export const serviceAvailability = {
  // Default: available during all business hours
  default: {
    useBusinessHours: true,
    customHours: null,
    daysAvailable: [1, 2, 3, 4, 6, 0] // Monday through Thursday, Saturday and Sunday
  },
  // Example for a special service with custom hours
  premium: {
    useBusinessHours: false,
    customHours: {
      start: '10:00',
      end: '16:00'
    },
    daysAvailable: [1, 2, 3, 4, 6, 0]
  }
};

// Map day number to day name for easier access
export const dayNumberToName = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

// Default notification settings
export const notificationSettings = {
  reminderTime: 24, // Hours before appointment to send reminder
  enableSMS: false,
  enableEmail: true,
};

// App settings
export const appSettings = {
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'hh:mm a',
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
};

// Calendar view settings
export const calendarSettings = {
  defaultView: 'week', // 'day', 'week', or 'month'
  startHour: 8, // First hour to show in day view
  endHour: 20, // Last hour to show in day view
  slotDuration: 30, // Minutes per slot in day view
}; 