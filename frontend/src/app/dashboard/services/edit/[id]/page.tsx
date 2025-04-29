'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Clock, ClipboardList } from 'lucide-react'
import { ServiceData } from '@/services/api'
import { getServiceById, updateService } from '@/services/serviceService'

export default function EditService({ params }: { params: { id: string } }) {
  const router = useRouter()
  const id = params.id
  
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    description: '',
    duration: '',
    price: '',
    staffCount: '1',
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch service data on mount
  useEffect(() => {
    const fetchService = async () => {
      try {
        setFetchLoading(true)
        console.log(`Fetching service data for ID: ${id}`)
        
        const service = await getServiceById(id)
        console.log("Service data received:", service)
        
        if (service) {
          setFormData({
            name: service.name || '',
            description: service.description || '',
            duration: service.duration || '',
            price: service.price ? service.price.toString() : '',
            staffCount: service.staffCount ? service.staffCount.toString() : '1',
            isActive: service.isActive !== undefined ? service.isActive : true
          })
        } else {
          setError('Service not found. Please try again or go back to services.')
        }
      } catch (err: any) {
        console.error("Error fetching service:", err)
        setError(err.message || 'Failed to fetch service')
      } finally {
        setFetchLoading(false)
      }
    }
    
    fetchService()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const priceValue = typeof formData.price === 'string' 
        ? parseFloat(formData.price) 
        : formData.price
      
      const staffCountValue = typeof formData.staffCount === 'string'
        ? parseInt(formData.staffCount)
        : formData.staffCount || 1
        
      const dataToUpdate = {
        ...formData,
        price: priceValue || 0,
        staffCount: staffCountValue < 1 ? 1 : staffCountValue
      }
      
      await updateService(id, dataToUpdate)
      
      // Set a flag to force refresh on dashboard
      localStorage.setItem("forceRefreshDashboard", "true")
      
      // Set flag to refresh service list
      localStorage.setItem("serviceListShouldRefresh", "true")
      
      router.push('/dashboard/services')
    } catch (err: any) {
      console.error("Error updating service:", err)
      setError(err.message || 'Failed to update service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 p-0 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Main content */}
      <div className="p-4 md:p-6 h-full">
        <button
          onClick={() => router.push("/dashboard/services")}
          className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          <span>Back to services</span>
        </button>

        {/* Form container taking full width */}
        <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl w-full">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Edit Service
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {fetchLoading ? (
            <div className="flex justify-center items-center h-64">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
              <p className="ml-3 text-sm text-white/70">
                Loading service data...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 w-full">
              {/* Service Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter service name"
                />
              </div>

              {/* Duration */}
              <div>
                <label
                  htmlFor="duration"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter duration in minutes"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="price"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-gray-400">EGP</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter price"
                  />
                </div>
              </div>

              {/* Staff Count */}
              <div>
                <label
                  htmlFor="staffCount"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Staff Count <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </span>
                  <input
                    type="number"
                    id="staffCount"
                    name="staffCount"
                    value={formData.staffCount}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Number of staff providing this service"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-700 bg-gray-800/50 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
                />
                <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-300">
                  Active Service
                </label>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Description
                </label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                    placeholder="Describe the service..."
                  />
                </div>
              </div>

              <div className="pt-8 flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/services")}
                  className="w-1/2 py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-red-800/80 backdrop-blur-sm hover:bg-red-900/90 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 shadow-lg border border-red-600/20 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-500/20 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {loading ? "Updating..." : "Update Service"}
                </button>
              </div>
            </form>
          )}
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