'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { clearAllAppointments } from '@/services/appointmentService';

interface ClearAppointmentsDataProps {
  className?: string;
}

export default function ClearAppointmentsData({ className = '' }: ClearAppointmentsDataProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllAppointments = async () => {
    if (window.confirm('Are you sure you want to clear ALL appointment data? This action cannot be undone.')) {
      try {
        setIsClearing(true);
        
        // Clear all appointments using the service function
        await clearAllAppointments();
        
        // Trigger refresh by setting flag
        localStorage.setItem('appointmentListShouldRefresh', 'true');
        
        // Dispatch storage event to trigger UI updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'appointmentListShouldRefresh'
        }));
        
        toast.success('All appointment data has been cleared successfully');
      } catch (error) {
        console.error('Error clearing appointment data:', error);
        toast.error('Failed to clear appointment data');
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <button 
      onClick={handleClearAllAppointments}
      disabled={isClearing}
      className={`inline-flex items-center bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium ${className}`}
    >
      <TrashIcon className="h-4 w-4 mr-2" />
      {isClearing ? 'Clearing...' : 'Clear All Appointments'}
    </button>
  );
} 