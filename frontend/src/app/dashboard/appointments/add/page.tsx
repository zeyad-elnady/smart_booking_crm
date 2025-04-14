'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function AddAppointment() {
  const [formData, setFormData] = useState({
    customer: '',
    service: '',
    date: '',
    time: '',
    duration: '',
    notes: '',
    status: 'Pending'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally save the appointment data
    console.log('Form submitted:', formData)
    // Then redirect to the appointments list
    window.location.href = '/dashboard/appointments'
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold gradient-text">Add New Appointment</h1>
          <p className="mt-2 text-sm text-white/80">
            Schedule a new appointment for a customer.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/appointments"
            className="glass px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-white/10 transition-all duration-300 rounded-lg border border-white/20 flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 inline-block mr-1" />
            Back to Appointments
          </Link>
        </div>
      </div>

      <div className="glass border border-white/10 rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-300 mb-2">
                Customer
              </label>
              <select
                id="customer"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                required
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select a customer</option>
                <option value="John Doe">John Doe</option>
                <option value="Jane Smith">Jane Smith</option>
                <option value="Mike Johnson">Mike Johnson</option>
              </select>
            </div>

            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-2">
                Service
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select a service</option>
                <option value="Haircut">Haircut</option>
                <option value="Manicure">Manicure</option>
                <option value="Massage">Massage</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                id="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                name="time"
                id="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select duration</option>
                <option value="15 min">15 min</option>
                <option value="30 min">30 min</option>
                <option value="45 min">45 min</option>
                <option value="60 min">60 min</option>
                <option value="90 min">90 min</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
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
              className="glass w-full rounded-lg border border-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Any additional information about the appointment..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all hover:scale-105"
            >
              Save Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 