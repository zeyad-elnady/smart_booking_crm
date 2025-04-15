'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Navigation links with icons for reusability
const navigationLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
  { name: 'Services', href: '/dashboard/services', icon: Squares2X2Icon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { darkMode } = useTheme()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isActive = (path) => {
    if (path === '/dashboard') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }
  
  if (!mounted) {
    return <nav className="fixed w-full top-0 z-20 glass-dark border-b border-white/10 backdrop-blur-md h-16"></nav>
  }
  
  return (
    <nav className={`fixed w-full top-0 z-20 ${darkMode ? 'glass-dark border-b border-white/10' : 'glass-light border-b border-gray-200'} backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                Smart Booking
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navigationLinks.map((item) => {
                const isCurrentPage = isActive(item.href)
                const Icon = item.icon
                
                return (
                  <Link 
                    key={item.name}
                    href={item.href}
                    className={`
                      inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all
                      ${isCurrentPage 
                        ? darkMode
                          ? 'text-white bg-white/10 border border-white/20'
                          : 'text-indigo-700 bg-indigo-50 border border-indigo-100'
                        : darkMode
                          ? 'text-gray-300 hover:text-white hover:bg-white/5'
                          : 'text-gray-600 hover:text-indigo-700 hover:bg-gray-100'
                      }
                    `}
                    aria-current={isCurrentPage ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                darkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div
        className={`sm:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? 'max-h-64' : 'max-h-0'
        }`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigationLinks.map((item) => {
            const isCurrentPage = isActive(item.href)
            const Icon = item.icon
            
            return (
              <Link 
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-base font-medium rounded-md
                  ${isCurrentPage 
                    ? darkMode
                      ? 'text-white bg-white/10 border border-white/20'
                      : 'text-indigo-700 bg-indigo-50 border border-indigo-100'
                    : darkMode
                      ? 'text-gray-300 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 hover:text-indigo-700 hover:bg-gray-100'
                  }
                `}
                aria-current={isCurrentPage ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5 mr-2" aria-hidden="true" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 