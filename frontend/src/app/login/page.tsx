'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      // Redirect to coming-soon page
      router.push('/coming-soon')
    }
  }, [mounted, router])

  // Show nothing while redirecting
  return null
} 