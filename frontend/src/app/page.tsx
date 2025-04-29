'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'

// Custom styles for the light mode
const lightModeStyles = {
  mainBackground: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
  glassCard: 'bg-white/90 border-indigo-200 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.25)]',
  getStartedBtn: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-indigo-200/50 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300',
  learnMoreBtn: 'bg-white border-indigo-300 text-indigo-700 font-medium shadow-sm hover:bg-indigo-50 hover:shadow hover:translate-y-[-2px] transition-all duration-300',
  featureCard: 'bg-white/80 border-indigo-100 shadow-lg hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300',
}

export default function Home() {
  const { darkMode, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Only show after the component has mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  
  return (
    <main className={`min-h-screen p-4 md:p-12 flex flex-col items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900' : lightModeStyles.mainBackground}`}>
      {/* Decorative elements */}
      <div className={`fixed top-[15%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-3xl opacity-30 transition-all duration-700 ${darkMode ? 'bg-purple-600/20' : 'bg-purple-600/20'}`}></div>
      <div className={`fixed bottom-[10%] left-[5%] w-[30vw] h-[30vw] rounded-full blur-3xl opacity-20 transition-all duration-700 ${darkMode ? 'bg-blue-600/20' : 'bg-indigo-500/20'}`}></div>
      
      {/* Logo & Nav */}
      <nav className="w-full max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">SmartBooking</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className={`relative p-1.5 w-16 h-9 rounded-full transition-all duration-700 ease-in-out transform hover:scale-105 ${
              darkMode 
                ? 'bg-gray-800 border-purple-500/50 hover:border-purple-400' 
                : 'bg-sky-100 border-indigo-300/50 hover:border-indigo-400'
            } border-2 overflow-hidden cursor-pointer`}
          >
            {/* Background animation */}
            <div 
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                darkMode 
                  ? 'bg-gradient-to-r from-indigo-900/20 to-purple-900/40 opacity-100' 
                  : 'bg-gradient-to-r from-sky-200/30 to-indigo-100/50 opacity-100'
              }`}
            />

            {/* Sun/Moon positioning container */}
            <div className="absolute inset-0 flex items-center justify-between px-1">
              {/* Moon icon - LEFT side */}
              <div 
                className={`w-5 h-5 rounded-full z-10 flex items-center justify-center transition-all duration-700 ${
                  darkMode ? 'opacity-100 scale-100' : 'opacity-50 scale-75'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 text-indigo-100 transition-all duration-700 ${
                    darkMode ? 'opacity-100 rotate-0' : 'opacity-40 -rotate-90'
                  }`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
          </div>
              
              {/* Sun icon - RIGHT side */}
              <div 
                className={`w-5 h-5 rounded-full z-10 flex items-center justify-center transition-all duration-700 ${
                  darkMode ? 'opacity-50 scale-75' : 'opacity-100 scale-100'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-yellow-400 transition-all duration-700 ${
                    darkMode ? 'opacity-40 rotate-90' : 'opacity-100 rotate-0'
                  }`}
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Toggle handle/knob - moves from LEFT to RIGHT */}
            <div 
              className={`absolute top-1 z-20 w-6 h-6 rounded-full transform transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                darkMode 
                  ? 'translate-x-8 bg-gradient-to-br from-purple-500 to-indigo-500 shadow-[0_0_8px_2px_rgba(168,85,247,0.5)]' 
                  : 'translate-x-0 bg-gradient-to-br from-amber-300 to-yellow-400 shadow-[0_0_8px_2px_rgba(252,211,77,0.5)]'
              }`}
            />
            
            {/* Stars - only visible in dark mode */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${darkMode ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-1.5 left-9 w-0.5 h-0.5 rounded-full bg-white animate-[pulse_2s_ease-in-out_infinite]"></div>
              <div className="absolute top-4 left-11 w-1 h-1 rounded-full bg-white animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }}></div>
              <div className="absolute bottom-1.5 left-10 w-0.5 h-0.5 rounded-full bg-white animate-[pulse_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.7s' }}></div>
            </div>
            
            {/* Ray effects around sun - only visible in light mode */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${darkMode ? 'opacity-0' : 'opacity-100'}`}>
              <div className="absolute top-1 right-2 w-5 h-5 bg-yellow-300/30 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}></div>
          </div>
          </button>

          <Link href="/login" className={`px-4 py-2 rounded-lg ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>Login</Link>
          <Link href="/register" className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200/70 hover:bg-gray-300/70 text-gray-900'} transition-colors duration-200`}>Sign Up</Link>
        </div>
      </nav>
      
      {/* Main content */}
      <div className={`glass text-center p-12 mb-12 w-full max-w-4xl mx-auto border transition-all duration-500 ${darkMode 
        ? 'bg-gray-900/60 border-white/10 border-opacity-20' 
        : `${lightModeStyles.glassCard} border-opacity-40 rounded-3xl backdrop-blur-xl`}`}
      >
        <h1 className={`text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r transition-all duration-700 ${
          darkMode
            ? 'from-purple-400 via-indigo-500 to-purple-600'
            : 'from-indigo-700 via-purple-700 to-indigo-600'
        } bg-clip-text text-transparent`}>
              Streamline Your Bookings
            </h1>
        <p className={`text-xl mb-8 transition-colors duration-500 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          The complete customer relationship management solution 
          designed specifically for service-based businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className={`px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
            darkMode
              ? 'glass-dark bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 shadow-lg hover:shadow-xl'
              : lightModeStyles.getStartedBtn
          }`}>
                Get Started
              </Link>
          <Link href="#features" className={`px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 ${
            darkMode
              ? 'glass hover:bg-white/10 border border-white border-opacity-20 text-white hover:bg-white/5 shadow-lg hover:shadow-xl'
              : `${lightModeStyles.learnMoreBtn} border`
          }`}>
                Learn More
              </Link>
            </div>
          </div>
          
          {/* Features section */}
      <section id="features" className={`w-full max-w-7xl mx-auto py-12 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <h2 className={`text-3xl font-bold text-center mb-12 bg-gradient-to-r transition-all duration-700 ${
          darkMode
            ? 'from-purple-400 to-indigo-500'
            : 'from-indigo-700 to-purple-700'
        } bg-clip-text text-transparent`}>
          Features
            </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Smart Scheduling', description: 'Optimize your calendar with AI-powered appointment management.'},
            { title: 'Customer Insights', description: 'Track customer history, preferences, and analytics.'},
            { title: 'Seamless Integrations', description: 'Connect with your favorite tools and payment processors.'},
          ].map((feature, index) => (
            <div key={index} className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-500 ${
              darkMode
                ? 'bg-gray-900/60 border-white/10'
                : lightModeStyles.featureCard
            }`}>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className={`transition-colors duration-500 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className={`w-full max-w-7xl mx-auto mt-auto pt-12 transition-colors duration-500 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
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
