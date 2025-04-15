'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'

export default function Home() {
  const { darkMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Only show after the component has mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  
  return (
    <main className={`min-h-screen p-4 md:p-12 flex flex-col items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900' : 'bg-gradient-to-br from-white via-purple-100/30 to-white'}`}>
      {/* Decorative elements */}
      <div className={`fixed top-[15%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-3xl opacity-30 ${darkMode ? 'bg-purple-600/20' : 'bg-purple-600/10'}`}></div>
      <div className={`fixed bottom-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full blur-3xl opacity-20 ${darkMode ? 'bg-blue-600/20' : 'bg-blue-600/10'}`}></div>
      
      {/* Logo & Nav */}
      <nav className="w-full max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">SmartBooking</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className={`px-4 py-2 rounded-lg ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>Login</Link>
          <Link href="/signup" className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200/70 hover:bg-gray-300/70 text-gray-900'} transition-colors duration-200`}>Sign Up</Link>
        </div>
      </nav>
      
      {/* Main content */}
      <div className={`glass text-center p-12 mb-12 w-full max-w-4xl mx-auto border border-opacity-20 ${darkMode ? 'bg-gray-900/60 border-white/10' : 'bg-white/90 border-black/10'} backdrop-blur-xl rounded-2xl shadow-2xl`}>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Streamline Your Bookings
        </h1>
        <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          The complete customer relationship management solution 
          designed specifically for service-based businesses.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className={`glass-dark bg-gradient-to-r ${darkMode ? 'from-purple-600 to-blue-500' : 'from-purple-700 to-blue-600'} px-8 py-4 rounded-xl text-white text-lg font-medium hover:from-purple-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300`}>
            Get Started
          </Link>
          <Link href="#features" className={`glass hover:bg-white/10 border border-opacity-20 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl ${darkMode ? 'border-white text-white hover:bg-white/5' : 'border-gray-300 text-gray-800 hover:bg-gray-100/50'}`}>
            Learn More
          </Link>
        </div>
      </div>
      
      {/* Features section */}
      <section id="features" className={`w-full max-w-7xl mx-auto py-12 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Smart Scheduling', description: 'Optimize your calendar with AI-powered appointment management.'},
            { title: 'Customer Insights', description: 'Track customer history, preferences, and analytics.'},
            { title: 'Seamless Integrations', description: 'Connect with your favorite tools and payment processors.'},
          ].map((feature, index) => (
            <div key={index} className={`${darkMode ? 'bg-gray-900/60 border-white/10' : 'bg-white/80 border-black/5'} p-6 rounded-xl border backdrop-blur-sm shadow-lg`}>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className={`w-full max-w-7xl mx-auto mt-auto pt-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-opacity-20 py-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}">
          <div>© {new Date().getFullYear()} SmartBooking. All rights reserved.</div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-purple-400 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-purple-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
