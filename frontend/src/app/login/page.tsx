'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authAPI } from '@/services/api'
import SignOutButton from '@/components/SignOutButton'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check if the user is already logged in on component mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Check authentication status after mounting
  useEffect(() => {
    if (mounted) {
      const user = authAPI.getCurrentUser()
      if (user) {
        setIsLoggedIn(true)
        setDebugInfo('User already logged in')
      }
    }
  }, [mounted])

  // Check if the server is available on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000', { 
          mode: 'cors',
          credentials: 'omit',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        });
        
        if (response.ok) {
          setServerStatus('online');
          setDebugInfo('Backend server is available and responding.');
        } else {
          setServerStatus('offline');
          setDebugInfo(`Backend server responded with error: ${response.status}`);
        }
      } catch (error) {
        console.error('Server check failed:', error);
        setServerStatus('offline');
        setDebugInfo(`Cannot connect to backend server: ${error.message}`);
      }
    };
    
    checkServerStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDebugInfo('Starting login process...')
    setLoading(true)

    // Don't attempt login if server is offline
    if (serverStatus === 'offline') {
      setError('Cannot connect to server. Please ensure the backend is running.');
      setLoading(false);
      return;
    }

    try {
      // Clear the console for cleaner logs
      console.clear();
      
      // Log credentials being used (exclude password for security)
      console.log('Attempting login with:', { email: formData.email });
      
      setDebugInfo('Sending login request to API...');
      await authAPI.login({
        email: formData.email,
        password: formData.password
      })
      
      setDebugInfo('Login successful! Redirecting to dashboard...');
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        const statusCode = err.response.status;
        const responseData = err.response.data || {};
        
        if (statusCode === 401) {
          setError('Invalid email or password. Please try again.');
          setDebugInfo(`Authentication failed (401): ${responseData.message || 'Invalid credentials'}`);
        } else if (statusCode >= 400 && statusCode < 500) {
          setError(responseData.message || `Client error (${statusCode})`);
          setDebugInfo(`Client error: ${JSON.stringify(responseData)}`);
        } else {
          setError('Server error. Please try again later.');
          setDebugInfo(`Server error (${statusCode}): ${JSON.stringify(responseData)}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check that the backend is running.');
        setDebugInfo('Network Error: The server is not responding. Make sure the backend server is running on port 5000.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`${err.message || 'Unknown error occurred'}`);
        setDebugInfo(`Request Error: ${err.message}`);
      }
      
      setLoading(false)
    }
  }

  const handleLogout = () => {
    try {
      // Clear all auth data in a direct way
      if (typeof window !== 'undefined') {
        // Clear localStorage
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        
        // Clear cookies with multiple approaches for compatibility
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
        document.cookie = 'token=; max-age=0; path=/;';
        
        console.log('Logout: Cleared auth data');
        
        // Force redirect
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Last resort - try a direct reload
      window.location.reload();
    }
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  // If user is already logged in, show a different view
  if (mounted && isLoggedIn) {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass border border-white/10 rounded-xl shadow-xl p-8 max-w-md w-full space-y-8 animate-fadeIn">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 gradient-text">You're already logged in!</h2>
            <p className="mb-8 text-gray-300">
              You are currently logged in to Smart Booking CRM. Would you like to continue to your dashboard or sign out?
            </p>
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleGoToDashboard}
                className="glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 w-full"
              >
                Go to Dashboard
              </button>
              
              <SignOutButton className="w-full" />
              
              {/* Fallback link in case button doesn't work */}
              <a 
                href="/login" 
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="text-xs text-gray-400 hover:text-gray-300 mt-2"
              >
                Having trouble signing out? Click here
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal login form view for non-authenticated users
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass border border-white/10 rounded-xl shadow-xl p-8 max-w-md w-full space-y-8 animate-fadeIn">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold gradient-text">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{' '}
            <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
              create a new account
            </Link>
          </p>
          
          {serverStatus === 'offline' && (
            <div className="mt-4 p-3 border border-yellow-500/30 rounded-md bg-yellow-500/10 text-yellow-400 text-sm">
              ⚠️ Backend server appears to be offline. Please start the server to login.
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 bg-gray-800/50 text-gray-100 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 bg-gray-800/50 text-gray-100 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm p-3 border border-red-400/20 rounded-md bg-red-400/10">
              {error}
            </div>
          )}
          
          {debugInfo && (
            <div className="p-4 glass border border-gray-500/30 rounded-lg text-gray-300 text-xs">
              <div className="font-semibold mb-1">Debug:</div>
              <div>{debugInfo}</div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-800"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-indigo-400 hover:text-indigo-300">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || serverStatus === 'offline'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
              Test account: <span className="text-gray-300">test@example.com</span> / <span className="text-gray-300">password123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 