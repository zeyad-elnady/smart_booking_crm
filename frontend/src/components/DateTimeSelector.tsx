import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import type { Service } from '@/types/service';
import type { Appointment } from '@/types/appointment';

interface DateTimeSelectorProps {
  onSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  darkMode?: boolean;
  selectedService?: Service | null;
  existingAppointments?: Appointment[];
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  onSelect,
  selectedDate,
  selectedTime,
  darkMode = false,
  selectedService,
  existingAppointments = []
}) => {
  const [date, setDate] = useState<Date | null>(selectedDate ? parseISO(selectedDate) : null);
  const [time, setTime] = useState<string>(selectedTime || '');

  // Generate next 7 days
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Generate time slots (9 AM to 5 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = Math.floor((i + 9) / 2);
    const minute = (i + 9) % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Check if a time slot is available
  const isTimeSlotAvailable = (date: Date, time: string) => {
    if (!selectedService) return true;

    const formattedDate = format(date, 'yyyy-MM-dd');
    const conflictingAppointment = existingAppointments.find(appointment => {
      return appointment.date === formattedDate && appointment.time === time;
    });

    return !conflictingAppointment;
  };

  const handleDateClick = (selectedDate: Date) => {
    setDate(selectedDate);
    if (time) {
      onSelect(format(selectedDate, 'yyyy-MM-dd'), time);
    }
  };

  const handleTimeClick = (selectedTime: string) => {
    if (!date || !isTimeSlotAvailable(date, selectedTime)) return;
    
    setTime(selectedTime);
    if (date) {
      onSelect(format(date, 'yyyy-MM-dd'), selectedTime);
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Select Date
        </h3>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {nextDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                date && isSameDay(day, date)
                  ? darkMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {format(day, 'EEE d')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Select Time
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((timeSlot) => {
            const isAvailable = date ? isTimeSlotAvailable(date, timeSlot) : true;
            return (
              <button
                key={timeSlot}
                onClick={() => handleTimeClick(timeSlot)}
                disabled={!isAvailable}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  time === timeSlot
                    ? darkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                    : !isAvailable
                    ? darkMode
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {timeSlot}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateTimeSelector;