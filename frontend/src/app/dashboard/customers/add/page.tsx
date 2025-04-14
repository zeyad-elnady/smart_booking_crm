'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { customerAPI } from '@/services/api'
import { useRouter } from 'next/navigation'

export default function AddCustomer() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('') // Clear previous errors
    
    try {
      console.log('Submitting customer data:', formData)
      // Save the customer data using the API
      const result = await customerAPI.createCustomer(formData)
      console.log('Customer created successfully:', result)
      
      // Force refresh dashboard stats before redirecting
      try {
        // Get current customer count
        const storedMockCustomers = localStorage.getItem('mockCustomers');
        if (storedMockCustomers) {
          const customers = JSON.parse(storedMockCustomers);
          
          // Update dashboard stats
          const storedMockStats = localStorage.getItem('mockDashboardStats');
          if (storedMockStats) {
            const stats = JSON.parse(storedMockStats);
            stats.totalCustomers = customers.length;
            localStorage.setItem('mockDashboardStats', JSON.stringify(stats));
            console.log('Updated dashboard stats before redirect:', stats);
          }
        }
      } catch (e) {
        console.error('Error updating dashboard stats:', e);
      }
      
      // Set a flag to force refresh on dashboard
      localStorage.setItem('forceRefreshDashboard', 'true');
      
      // Redirect to the customers list
      router.push('/dashboard/customers')
    } catch (err: any) {
      console.error('Error creating customer:', err)
      
      // Display more specific error messages based on the error type
      if (err.response?.data?.message) {
        // API returned an error message
        setError(`Server error: ${err.response.data.message}`)
      } else if (err.message) {
        // Network or other error with message
        setError(err.message)
      } else {
        // Fallback error message
        setError('Failed to create customer. Please try again later.')
      }
      
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold gradient-text">Add New Customer</h1>
          <p className="mt-2 text-sm text-white/80">
            Enter the details of your new customer below.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/customers"
            className="glass px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-white/10 transition-all duration-300 rounded-lg border border-white/20 flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 inline-block mr-1" />
            Back to Customers
          </Link>
        </div>
      </div>

      {error && (
        <div className="glass border border-red-500/30 bg-red-500/10 rounded-lg p-4 text-red-200">
          <p>{error}</p>
        </div>
      )}

      <div className="glass border border-white/10 rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="First name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Last name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              disabled={loading}
              className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Any additional information about the customer..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all hover:scale-105"
            >
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 