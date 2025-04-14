'use client'

import Navigation from '@/components/Navigation'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/services/api'

// Background shapes component
const BackgroundShapes = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-10 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
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
  
  useEffect(() => {
    setMounted(true)
    
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
  }, [router, mounted])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#111827] to-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated
  if (!authorized) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111827] to-[#0f172a] text-white">
      <BackgroundShapes />
      <Navigation />
      <main className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-dark w-full p-6 sm:p-8 rounded-2xl shadow-xl border border-white/5">
          {children}
        </div>
      </main>
    </div>
  )
} 