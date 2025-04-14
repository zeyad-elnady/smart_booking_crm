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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/services"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-white">Add New Service</h1>
      </div>

      {error && (
        <div className="p-4 glass border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="glass border border-white/10 rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput 
            id="name" 
            label="Service Name" 
            value={formData.name} 
            onChange={handleTextChange} 
          />

          <FormTextarea
            id="description"
            label="Description"
            value={formData.description}
            onChange={handleTextChange}
            rows={3}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormInput
              id="duration"
              label="Duration (minutes)"
              type="text"
              value={formData.duration}
              onChange={handleTextChange}
              placeholder="e.g. 30 min"
            />

            <FormInput
              id="price"
              label="Price"
              type="text"
              value={formData.price}
              onChange={handleTextChange}
              placeholder="e.g. $50"
            />
          </div>

          <FormInput
            id="category"
            label="Category"
            value={formData.category}
            onChange={handleTextChange}
            placeholder="e.g. Hair, Nails, Spa"
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
              Active Service
            </label>
          </div>

          <FormActions 
            cancelHref="/dashboard/services"
            isSubmitting={loading}
            submitLabel="Create Service"
            submittingLabel="Creating..."
          />
        </form>
      </div>
    </div>
  )
} 