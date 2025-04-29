// ... existing code ...
const handleTimeClick = (time: string) => {
  // Check if the time slot is available
  const timeSlot = generateAllTimeSlots().find(slot => slot.time === time);
  
  // Only proceed if the slot is available
  if (timeSlot && timeSlot.available) {
    setSelectedTime(time);
    
    // Call onSelect directly when a time is selected
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      onSelect(formattedDate, time);
    }
  }
};
// ... existing code ...