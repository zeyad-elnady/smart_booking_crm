'use client'

import { useState, useEffect } from 'react'
import { authAPI } from '@/services/api'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Service link states
  const [serviceLink, setServiceLink] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [hasServiceLink, setHasServiceLink] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  useEffect(() => {
    // Get current user from localStorage
    const currentUser = authAPI.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    
    // Load saved service link if exists
    const savedServiceLink = localStorage.getItem('serviceLink')
    const savedServiceName = localStorage.getItem('serviceName')
    if (savedServiceLink && savedServiceName) {
      setServiceLink(savedServiceLink)
      setServiceName(savedServiceName)
      setHasServiceLink(true)
    }
    
    setLoading(false)
  }, [])
  
  const handleServiceLinkSave = () => {
    if (serviceLink && serviceName) {
      localStorage.setItem('serviceLink', serviceLink)
      localStorage.setItem('serviceName', serviceName)
      localStorage.setItem('serviceChoice', 'yes')
      setHasServiceLink(true)
      setSaveSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }
  
  const handleServiceLinkRemove = () => {
    localStorage.removeItem('serviceLink')
    localStorage.removeItem('serviceName')
    localStorage.setItem('serviceChoice', 'no')
    setServiceLink('')
    setServiceName('')
    setHasServiceLink(false)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white">Loading settings...</div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-300">
          Manage your account and application preferences.
        </p>
      </div>
      
      <div className="glass-dark p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
        <div className="mb-6">
          <p className="text-sm text-gray-400">Email</p>
          <p className="text-white">{user?.email || 'Not available'}</p>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-400">Name</p>
          <p className="text-white">{user?.name || 'Not available'}</p>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-400">Business Name</p>
          <p className="text-white">{user?.businessName || 'Not available'}</p>
        </div>
      </div>
      
      <div className="glass-dark p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Service Link</h2>
        <p className="text-gray-300 mb-4">
          {hasServiceLink 
            ? "Manage your service link that appears on the dashboard" 
            : "Add a direct link to your service website on your dashboard"}
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="serviceName" className="text-sm text-gray-300">Service Name</label>
            <input
              type="text"
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="My Salon Website"
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <label htmlFor="serviceLink" className="text-sm text-gray-300">Service URL</label>
            <input
              type="url"
              id="serviceLink"
              value={serviceLink}
              onChange={(e) => setServiceLink(e.target.value)}
              placeholder="https://your-website.com"
              className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleServiceLinkSave}
              disabled={!serviceLink || !serviceName}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md disabled:opacity-50"
            >
              {hasServiceLink ? 'Update Link' : 'Save Link'}
            </button>
            
            {hasServiceLink && (
              <button
                onClick={handleServiceLinkRemove}
                className="px-4 py-2 bg-gray-700 text-white rounded-md"
              >
                Remove Link
              </button>
            )}
          </div>
          
          {saveSuccess && (
            <div className="px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-md text-green-300">
              Service link saved successfully!
            </div>
          )}
        </div>
      </div>
      
      <div className="glass-dark p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Danger Zone</h2>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Sign Out
        </button>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
} 