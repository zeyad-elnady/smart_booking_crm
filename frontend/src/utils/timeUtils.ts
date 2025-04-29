/**
 * Converts 24-hour time format (HH:MM) to 12-hour format (hh:mm AM/PM)
 */
export function format24To12(time: string): string {
  if (!time || !time.includes(':')) return time;
  
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  
  if (isNaN(hour)) return time;
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hour12}:${minute} ${period}`;
}

/**
 * Converts 12-hour time format (hh:mm AM/PM) to 24-hour format (HH:MM)
 */
export function format12To24(time: string): string {
  if (!time) return time;
  
  const match = time.match(/(\d+):(\d+)\s*([AP]M)?/i);
  if (!match) return time;
  
  let [_, hourStr, minute, period] = match;
  let hour = parseInt(hourStr, 10);
  
  if (isNaN(hour)) return time;
  
  // Convert hour based on AM/PM
  if (period) {
    period = period.toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

/**
 * Parses an input time string to ensure it's in 12-hour format
 */
export function parseTimeInput(input: string): string {
  // First try to match a time with AM/PM
  const amPmMatch = input.match(/(\d+):(\d+)\s*([AP]M)?/i);
  if (amPmMatch) {
    const [_, hour, minute, period] = amPmMatch;
    const hour12 = parseInt(hour, 10) % 12 || 12;
    return `${hour12}:${minute} ${period ? period.toUpperCase() : 'AM'}`;
  }
  
  // Otherwise, try to match just hours and minutes
  const timeMatch = input.match(/(\d+):(\d+)/);
  if (timeMatch) {
    const [_, hour, minute] = timeMatch;
    const hourNum = parseInt(hour, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minute} ${period}`;
  }
  
  return input;
}

/**
 * Formats time slots for display (09:00 -> 9:00 AM)
 */
export function formatTimeSlot(time: string): string {
  return format24To12(time);
} 