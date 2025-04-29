'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SignOutButton from './SignOutButton'

export default function AuthButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  // Simple mock auth - in a real app this would use proper auth
  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('token') !== null
  
  return (
    <div className="relative">
      <button
        type="button"
        className="glass h-10 w-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-indigo-600 font-medium">
          {isLoggedIn ? 'U' : '?'}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-xl glass-dark border border-white/10 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {isLoggedIn ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  role="menuitem"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/settings" 
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  role="menuitem"
                >
                  Profile Settings
                </Link>
                <div className="border-t border-white/10 my-1"></div>
                <div className="block w-full text-left px-4 py-2 text-sm text-red-400">
                  <SignOutButton className="w-full text-left text-sm text-red-400 hover:bg-white/5 bg-transparent px-0 py-0" />
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/coming-soon" 
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  role="menuitem"
                >
                  Login
                </Link>
                <Link 
                  href="/coming-soon" 
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                  role="menuitem"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 