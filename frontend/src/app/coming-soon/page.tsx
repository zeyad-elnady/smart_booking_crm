'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ComingSoon() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass border border-white/10 rounded-xl shadow-xl p-8 max-w-md w-full space-y-8 animate-fadeIn">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 gradient-text">Coming Soon!</h2>
          
          <div className="my-8 p-4 border border-purple-500/30 rounded-md bg-purple-500/10">
            <p className="text-xl mb-4">
              User accounts are coming soon!
            </p>
            <p className="text-gray-300 mb-6">
              We're currently working on implementing user registration and login functionality. 
              Please check back later for updates.
            </p>
            <div className="w-20 h-20 mx-auto mb-6 border-t-4 border-purple-500 border-solid rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400">
              In the meantime, you can explore the app without logging in.
            </p>
          </div>
          
          <Link 
            href="/"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
} 