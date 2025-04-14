'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Appointments', href: '/dashboard/appointments' },
  { name: 'Customers', href: '/dashboard/customers' },
  { name: 'Services', href: '/dashboard/services' },
  { name: 'Settings', href: '/dashboard/settings' },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-glass py-3 no-white-borders">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
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
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold gradient-text">
                Smart Booking CRM
              </Link>
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    className="text-white hover:text-indigo-300 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105"
                    prefetch={true}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center">
            <div className="glass h-10 w-10 rounded-full flex items-center justify-center cursor-pointer">
              <span className="text-indigo-600 font-medium">U</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden navbar-glass mt-2 mx-2 rounded-lg no-white-borders`} 
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="text-white hover:text-indigo-300 block px-3 py-2 rounded-md text-base font-medium"
              prefetch={true}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
} 