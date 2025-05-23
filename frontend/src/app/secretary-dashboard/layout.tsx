'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'

interface LayoutProps {
  children: ReactNode
}

export default function SecretaryDashboardLayout({ children }: LayoutProps) {
  const { darkMode, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {children}
    </div>
  );
} 