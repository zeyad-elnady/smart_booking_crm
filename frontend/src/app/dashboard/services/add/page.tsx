'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { serviceAPI, ServiceData } from '@/services/api'
import { FormInput, FormTextarea, FormActions } from '@/components/form'

export default function AddService() {
  const router = useRouter()
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: '',
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize change handlers to prevent recreation on each render
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: checked }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await serviceAPI.createService(formData)
      router.push('/dashboard/services')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create service')
      setLoading(false)
    }
  }, [formData, router])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 p-0 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Main content */}
      <div className="p-6">
        <button 
          onClick={() => router.push('/dashboard/services')}
          className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          <span>Back to services</span>
        </button>
      
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8 max-w-7xl mx-auto">
          {/* Left side - Info panel */}
          <div className="hidden lg:block">
            <div className="sticky top-6 bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Create a New Service</h2>
              <p className="text-gray-300 mb-6">Add a new service to your business offerings by filling out the details on the right.</p>
              
              <div className="space-y-6">
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h3 className="text-white font-medium">Basic Information</h3>
                  <p className="text-gray-400 text-sm">Name and description of the service.</p>
                </div>
                
                <div className="border-l-2 border-purple-500 pl-4">
                  <h3 className="text-white font-medium">Duration & Pricing</h3>
                  <p className="text-gray-400 text-sm">How long the service takes and how much it costs.</p>
                </div>
                
                <div className="border-l-2 border-pink-500 pl-4">
                  <h3 className="text-white font-medium">Categorization</h3>
                  <p className="text-gray-400 text-sm">Organize your services by category for easier management.</p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-gray-300">Tip: Services can be made inactive if you need to temporarily hide them from your booking system.</p>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Add New Service
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-300">
                    Service Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleTextChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Haircut, Massage, Manicure"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-300">
                    Description <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={handleTextChange}
                    required
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Describe what this service includes..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="duration" className="block mb-2 text-sm font-medium text-gray-300">
                      Duration (minutes) <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="duration"
                      value={formData.duration}
                      onChange={handleTextChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 30, 60, 90"
                    />
                  </div>

                  <div>
                    <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-300">
                      Price <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="price"
                      value={formData.price}
                      onChange={handleTextChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="e.g. 50, 75, 100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-300">
                    Category <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="category"
                    value={formData.category}
                    onChange={handleTextChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Hair, Nails, Spa"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-white/10 bg-gray-900 text-indigo-600 focus:ring-indigo-500/20"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
                    Active (available for booking)
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-800/80 backdrop-blur-sm hover:bg-purple-900/90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-600/20 text-white"
                >
                  {loading ? 'Creating...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          overflow-x: hidden;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
        }
        
        .form-container {
          transition: all 0.3s ease;
        }
        
        .form-container:hover {
          box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.2);
        }

        /* Hide scrollbars but allow scrolling if needed */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(15, 20, 30, 0.5);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }

        /* Subtle animation for the form */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .form-container {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
} 