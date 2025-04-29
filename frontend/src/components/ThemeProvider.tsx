'use client'

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'

type ThemeContextType = {
  darkMode: boolean
  toggleTheme: () => void
}

// Create context with default values to avoid the "must be used within a ThemeProvider" error
const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Apply theme to document
  const applyTheme = (isDark: boolean) => {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark-theme')
        document.documentElement.classList.remove('light-theme')
        document.documentElement.style.setProperty('--bg-primary', '#121826')
        document.documentElement.style.setProperty('--bg-secondary', '#1a2234')
        document.documentElement.style.setProperty('--text-primary', '#ffffff')
        document.documentElement.style.setProperty('--text-secondary', '#94a3b8')
        document.documentElement.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)')
        document.documentElement.style.setProperty('--gradient-text-from', '#6a11cb')
        document.documentElement.style.setProperty('--gradient-text-to', '#2575fc')
        document.documentElement.style.setProperty('--card-bg-blue', 'rgba(59, 130, 246, 0.2)')
        document.documentElement.style.setProperty('--card-bg-purple', 'rgba(168, 85, 247, 0.2)')
        document.documentElement.style.setProperty('--card-bg-green', 'rgba(34, 197, 94, 0.2)')
        document.documentElement.style.setProperty('--card-bg-amber', 'rgba(245, 158, 11, 0.2)')
        document.documentElement.style.setProperty('--stat-text', '#ffffff')
        document.documentElement.style.setProperty('--stat-text-secondary', 'rgba(255, 255, 255, 0.7)')
      } else {
        document.documentElement.classList.add('light-theme')
        document.documentElement.classList.remove('dark-theme')
        document.documentElement.style.setProperty('--bg-primary', '#f8fafc')
        document.documentElement.style.setProperty('--bg-secondary', '#ffffff')
        document.documentElement.style.setProperty('--text-primary', '#1e293b')
        document.documentElement.style.setProperty('--text-secondary', '#64748b')
        document.documentElement.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)')
        document.documentElement.style.setProperty('--gradient-text-from', '#3a026e')
        document.documentElement.style.setProperty('--gradient-text-to', '#083b8c')
        document.documentElement.style.setProperty('--card-bg-blue', 'rgba(59, 130, 246, 0.1)')
        document.documentElement.style.setProperty('--card-bg-purple', 'rgba(168, 85, 247, 0.1)')
        document.documentElement.style.setProperty('--card-bg-green', 'rgba(34, 197, 94, 0.1)')
        document.documentElement.style.setProperty('--card-bg-amber', 'rgba(245, 158, 11, 0.1)')
        document.documentElement.style.setProperty('--stat-text', '#1e293b')
        document.documentElement.style.setProperty('--stat-text-secondary', 'rgba(30, 41, 59, 0.7)')
      }
    }
  }

  // Toggle theme function
  const toggleTheme = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', String(newValue))
    applyTheme(newValue)
  }

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true)
    // Get saved theme from localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    const isDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true'
    setDarkMode(isDarkMode)
    applyTheme(isDarkMode)
  }, [])

  // Add global CSS variables and styles for theme
  useEffect(() => {
    if (!mounted) return
    
    const styleElement = document.createElement('style')
    styleElement.id = 'theme-styles'
    styleElement.innerHTML = `
      body {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      
      .glass-dark {
        background-color: rgba(30, 41, 59, 0.6);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .glass-light {
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      }
      
      .dark-content {
        --text-heading: #ffffff;
        --text-body: #94a3b8;
        --text-muted: #64748b;
      }
      
      .light-content {
        --text-heading: #1e293b;
        --text-body: #334155;
        --text-muted: #64748b;
      }
      
      .gradient-text {
        background-image: linear-gradient(45deg, var(--gradient-text-from), var(--gradient-text-to)) !important;
      }
      
      .glass {
        background: ${darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)'};
        border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)'};
        color: ${darkMode ? '#ffffff' : '#1e293b'};
      }
      
      /* Dashboard cards */
      .card-blue-bg {
        background-color: var(--card-bg-blue);
      }
      
      .card-purple-bg {
        background-color: var(--card-bg-purple);
      }
      
      .card-green-bg {
        background-color: var(--card-bg-green);
      }
      
      .card-amber-bg {
        background-color: var(--card-bg-amber);
      }
      
      /* Ensure text in stats is visible */
      .stat-value {
        color: var(--stat-text);
        font-weight: 700;
      }
      
      .stat-label {
        color: var(--stat-text-secondary);
      }
      
      input[type="date"]::-webkit-calendar-picker-indicator,
      input[type="time"]::-webkit-calendar-picker-indicator {
        filter: ${darkMode ? 'invert(0.8)' : 'none'};
      }
    `
    
    // Remove existing style element if it exists
    const existingStyle = document.getElementById('theme-styles')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    document.head.appendChild(styleElement)
    
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [darkMode, mounted])

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
} 
 
 
 
 
 