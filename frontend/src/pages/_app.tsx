'use client';

import { useEffect } from 'react';
import { AppProps } from 'next/app';
import '@/app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Clear mock data on app startup
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

  return <Component {...pageProps} />;
} 