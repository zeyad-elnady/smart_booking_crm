'use client'

import Link from 'next/link'
import { useEffect, useState, memo } from 'react'
import { authAPI } from '@/services/api'

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

// Memoized feature card to prevent re-renders
const FeatureCard = memo(({ title, description, color, index }) => (
  <div className={`glass border border-white/10 rounded-xl shadow-xl p-6 animate-fadeIn`} style={{ animationDelay: `${index * 0.1}s` }}>
    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 shadow-lg`}>
      {index + 1}
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
))

FeatureCard.displayName = 'FeatureCard'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    // Re-enable normal cursor
    document.body.style.cursor = 'auto'
    const links = document.querySelectorAll('a, button')
    links.forEach(link => {
      (link as HTMLElement).style.cursor = 'pointer'
    })
  }, [])

  // Instead of conditionally redirecting based on login status, 
  // always direct to the get-started page which will handle the logic
  const startButtonHref = '/get-started'

  if (!mounted) return null
  
  // Feature data
  const features = [
    {
      title: 'Service Management',
      description: 'Organize and manage your service offerings including prices, duration, and availability.',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Customer Database',
      description: 'Keep track of customer information, preferences, and booking history in one place.',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Appointment Scheduling',
      description: 'Easily schedule, reschedule, and manage appointments with an intuitive calendar interface.',
      color: 'from-green-500 to-emerald-600',
    },
  ]
  
  const currentYear = new Date().getFullYear()
  
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
              href="/login" 
              className="relative text-lg transition-all hover:scale-110 text-white opacity-80 hover:opacity-100 btn-premium px-4 py-2 rounded-full"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="text-lg font-medium btn-premium glass px-6 py-2 rounded-full transition-all hover:scale-110"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <main className="pt-32 pb-20">
        {/* Hero section */}
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
          <div className="glass text-center p-12 mb-12 w-full max-w-4xl mx-auto border border-opacity-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text text-shadow">
              Streamline Your Bookings
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-200 leading-relaxed max-w-3xl mx-auto">
              The all-in-one appointment scheduling solution for modern businesses. Save time, reduce no-shows, and delight your customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={startButtonHref}
                className="glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center btn-premium"
              >
                Get Started
              </Link>
              <Link 
                href="/about"
                className="glass hover:bg-white/10 border border-white border-opacity-20 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center"
              >
                Learn More
              </Link>
            </div>
          </div>
          
          {/* Features section */}
          <div className="w-full my-20">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 gradient-text text-shadow">
              Why Choose Smart Booking?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <FeatureCard 
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="glass-dark bg-opacity-30 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-white opacity-80">&copy; {currentYear} Smart Booking CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
