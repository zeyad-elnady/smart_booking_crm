'use client';

import { useEffect } from 'react';

export default function ClearMockData() {
  useEffect(() => {
    // Remove mock data from localStorage to force fresh API connection
    const clearMockData = () => {
      try {
        // Only clear mock data if we're not offline
        if (navigator.onLine) {
          console.log('Clearing mock data from localStorage');
          localStorage.removeItem('mockCustomers');
          localStorage.removeItem('mockDashboardStats');
          localStorage.removeItem('mockServices');
          localStorage.removeItem('mockAppointments');
        }
      } catch (error) {
        console.error('Error clearing mock data:', error);
      }
    };
    
    clearMockData();
  }, []);

  // This component doesn't render anything
  return null;
} 