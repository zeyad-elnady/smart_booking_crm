'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, memo } from 'react'

// Simplified and memoized background shapes to prevent re-renders
const BackgroundShapes = memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-10 filter blur-3xl floating animation-delay-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-green-400 to-teal-500 opacity-10 filter blur-3xl floating animation-delay-3000"></div>
    </div>
  )
})

BackgroundShapes.displayName = 'BackgroundShapes'

export default function About() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white">
      <BackgroundShapes />
      
      {/* Navigation */}
      <nav className="glass-dark bg-opacity-30 fixed w-full z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <Link 
              href="/" 
              className="text-2xl md:text-3xl font-bold gradient-text text-shadow-light hover:scale-105 transform transition-all"
            >
              Smart Booking CRM
            </Link>
          </div>
          <div className="flex gap-6">
            <Link 
              href="/dashboard" 
              className="relative text-lg transition-all hover:scale-110 text-white opacity-80 hover:opacity-100 btn-premium px-4 py-2 rounded-full"
            >
              Login
            </Link>
            <Link 
              href="/dashboard" 
              className="text-lg font-medium btn-premium glass px-6 py-2 rounded-full transition-all hover:scale-110"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <main className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="glass border border-white/10 rounded-xl shadow-xl p-8 mb-10 animate-fadeIn">
            <div className="mb-8">
              <Link
                href="/"
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-8 gradient-text text-shadow">About Smart Booking CRM</h1>
            
            <div className="space-y-8">
              <p className="text-xl text-gray-200 leading-relaxed">
                Smart Booking CRM is a comprehensive customer relationship management system designed specifically for appointment-heavy businesses such as salons, health centers, and restaurants.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="glass border border-white/10 rounded-xl p-6">
                  <h2 className="text-2xl font-semibold text-white mb-6 gradient-text">Key Features</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3 mt-1">✓</div>
                      <span className="text-gray-200">Automated appointment scheduling and management</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3 mt-1">✓</div>
                      <span className="text-gray-200">Real-time notifications (Email, SMS, Push)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3 mt-1">✓</div>
                      <span className="text-gray-200">Google Calendar integration</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3 mt-1">✓</div>
                      <span className="text-gray-200">Secure online payments (Stripe/PayPal)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3 mt-1">✓</div>
                      <span className="text-gray-200">Customer analytics and insights</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3 mt-1">✓</div>
                      <span className="text-gray-200">Role-based access control</span>
                    </li>
                  </ul>
                </div>
                
                <div className="glass border border-white/10 rounded-xl p-6">
                  <h2 className="text-2xl font-semibold text-white mb-6 gradient-text">Technology Stack</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 mt-1">•</div>
                      <span className="text-gray-200">Backend: Express.js (Node.js)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 mt-1">•</div>
                      <span className="text-gray-200">Frontend: Next.js (React)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 mt-1">•</div>
                      <span className="text-gray-200">Database: MongoDB</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 mt-1">•</div>
                      <span className="text-gray-200">Authentication: JWT</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 mt-1">•</div>
                      <span className="text-gray-200">UI: Tailwind CSS with Glass Design</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-12 glass border border-white/10 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-white mb-6 gradient-text">Our Mission</h2>
                <p className="text-gray-200 leading-relaxed">
                  Our mission is to provide businesses of all sizes with powerful yet simple-to-use tools for managing their appointments, customers, and services. We believe that technology should make your business operations smoother, not more complicated.
                </p>
              </div>
              
              <div className="flex justify-center mt-12">
                <Link 
                  href="/dashboard"
                  className="glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center btn-premium"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="glass-dark bg-opacity-30 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white opacity-80">&copy; {new Date().getFullYear()} Smart Booking CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 