'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Clock, DollarSign, CalendarDays, Palette, ArrowLeftIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { servicesAPI } from '@/services/api'
import { useTheme } from '@/components/ThemeProvider'

export default function AddService() {
  const router = useRouter()
  const { darkMode } = useTheme()
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [color, setColor] = useState('#6d28d9') // Default purple
  const [availableDays, setAvailableDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  })
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleDurationChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^\d]/g, '')
    setDuration(value)
  }

  const handlePriceChange = (e) => {
    // Allow numbers and a single decimal point
    const value = e.target.value.replace(/[^\d.]/g, '')
    // Prevent multiple decimal points
    const decimalCount = (value.match(/\./g) || []).length
    if (decimalCount <= 1) {
      setPrice(value)
    }
  }

  const handleAvailableDaysChange = (day) => {
    setAvailableDays({
      ...availableDays,
      [day]: !availableDays[day]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Format available days for API
      const availableDaysArray = Object.entries(availableDays)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([day]) => day)

      await servicesAPI.createService({
        name,
        description,
        duration: parseInt(duration, 10),
        price: parseFloat(price),
        color,
        availableDays: availableDaysArray
      })

      toast.success('Service added successfully')
      router.push('/dashboard/services')
    } catch (error) {
      console.error('Error adding service:', error)
      toast.error('Failed to add service')
    } finally {
      setIsLoading(false)
    }
  }

  const days = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ]

  return (
    <div className="p-6 w-full">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 rounded-full p-2 transition hover:bg-white/10"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">Add Service</h1>
      </div>

      <div className="flex flex-col lg:flex-row lg:space-x-6">
        <div className="lg:w-2/3 mb-6 lg:mb-0 rounded-xl backdrop-blur-md border border-white/10 p-6 bg-gray-800/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name */}
            <div className="mb-6">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-4 py-2 rounded-lg ${darkMode ? 
                  'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 
                  'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600'
                } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                placeholder="e.g. Haircut & Styling"
              />
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className={`w-full px-4 py-2 rounded-lg ${darkMode ? 
                  'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 
                  'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600'
                } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                placeholder="Describe what this service includes..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Duration */}
              <div>
                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={duration}
                    onChange={handleDurationChange}
                    required
                    className={`w-full px-4 py-2 pl-10 rounded-lg ${darkMode ? 
                      'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600'
                    } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                    placeholder="30"
                  />
                  <Clock className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
              
              {/* Price */}
              <div>
                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={price}
                    onChange={handlePriceChange}
                    required
                    className={`w-full px-4 py-2 pl-10 rounded-lg ${darkMode ? 
                      'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 
                      'bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-600'
                    } border focus:ring-2 focus:ring-purple-500/20 outline-none transition-colors`}
                    placeholder="49.99"
                  />
                  <DollarSign className={`absolute left-3 top-2.5 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
            </div>
            
            {/* Color */}
            <div className="mb-6">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Color <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Choose a color for this service in the calendar
                </span>
              </div>
            </div>
            
            {/* Available Days */}
            <div className="mb-8">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Available Days <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {days.map((day) => (
                  <div 
                    key={day.id}
                    onClick={() => handleAvailableDaysChange(day.id)}
                    className={`cursor-pointer px-4 py-3 rounded-lg border transition-colors ${
                      availableDays[day.id] 
                        ? (darkMode 
                            ? 'bg-purple-600/30 border-purple-500 text-white' 
                            : 'bg-purple-100 border-purple-500 text-purple-900') 
                        : (darkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-400' 
                            : 'bg-gray-100 border-gray-300 text-gray-500')
                    }`}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${darkMode ? 
                'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600' : 
                'bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-800 hover:to-blue-700'
              } text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex justify-center items-center`}
            >
              {isLoading ? 'Adding...' : 'Add Service'}
            </button>
          </form>
        </div>

        <div className="lg:w-1/3 space-y-6">
          <div className="rounded-xl backdrop-blur-md border border-white/10 p-6 bg-blue-900/30">
            <h2 className="text-xl font-bold mb-4">Service Management</h2>
            <p>Add new services to your business offerings. Complete all required fields for optimal service presentation.</p>
          </div>

          <div className="rounded-xl backdrop-blur-md border border-white/10 p-6 bg-purple-900/30">
            <h2 className="text-xl font-bold mb-4">Pricing & Duration</h2>
            <p>Set competitive prices and realistic service durations to manage customer expectations and scheduling.</p>
          </div>
          
          <div className="rounded-xl backdrop-blur-md border border-white/10 p-6 bg-emerald-900/30">
            <h2 className="text-xl font-bold mb-4">Service Description</h2>
            <p>Provide clear descriptions of your services to help customers understand what they're booking.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 