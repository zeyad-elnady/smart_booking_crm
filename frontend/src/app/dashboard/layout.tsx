'use client'

import Navigation from '@/components/Navigation'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/services/api'
import { useTheme } from '@/components/ThemeProvider'
import { LanguageProvider } from '@/context/LanguageContext'

// Background shapes component
const BackgroundShapes = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" suppressHydrationWarning={true}>
      <div className="absolute -top-20 -left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" suppressHydrationWarning={true}></div>
      <div className="absolute top-10 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" suppressHydrationWarning={true}></div>
      <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" suppressHydrationWarning={true}></div>
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-3000" suppressHydrationWarning={true}></div>
    </div>
  )
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const { darkMode } = useTheme()
  
  useEffect(() => {
    setMounted(true)
    
    // Skip authentication check - immediately set as authorized
    setAuthorized(true)
    setLoading(false)
    
    /*
    // Check if user is authenticated
    const checkAuth = () => {
      try {
        const user = authAPI.getCurrentUser()
        if (!user) {
          console.log('No authenticated user found, redirecting to login')
          router.push('/login')
        } else {
          console.log('User authenticated:', user.name)
          setAuthorized(true)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    if (mounted) {
      checkAuth()
    }
    */
  }, [router, mounted])

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-b from-[#111827] to-[#0f172a] text-white' : 'bg-gradient-to-b from-[#f1f5f9] to-[#e2e8f0] text-gray-800'} flex items-center justify-center`} suppressHydrationWarning={true}>
        <div className="text-center" suppressHydrationWarning={true}>
          <div className={`w-16 h-16 border-4 border-dashed rounded-full animate-spin ${darkMode ? 'border-white' : 'border-indigo-600'} mx-auto mb-4`} suppressHydrationWarning={true}></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated
  if (!authorized) return null

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-b from-[#111827] to-[#0f172a] text-white' : 'bg-gradient-to-b from-[#f1f5f9] to-[#e2e8f0] text-gray-800'}`} suppressHydrationWarning={true}>
      <LanguageProvider>
        {mounted && <BackgroundShapes />}
        {mounted && <Navigation />}
        <main className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" suppressHydrationWarning={true}>
          <div className={`w-full p-6 sm:p-8 rounded-2xl shadow-xl ${darkMode ? 'glass-dark border border-white/5' : 'glass-light border border-black/5'}`} suppressHydrationWarning={true}>
            {children}
          </div>
        </main>
      </LanguageProvider>
    </div>
  )
} 