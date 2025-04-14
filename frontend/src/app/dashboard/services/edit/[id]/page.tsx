'use client'

import { useState, useCallback, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { serviceAPI, ServiceData } from '@/services/api'
import { FormInput, FormTextarea, FormActions } from '@/components/form'

export default function EditService({ params }: { params: { id: string } }) {
  const router = useRouter()
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: '',
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
        const data = await serviceAPI.getServiceById(id)
        setFormData({
          name: data.name,
          description: data.description,
          duration: data.duration,
          price: data.price,
          category: data.category,
          isActive: data.isActive
        })
        setFetchLoading(false)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch service')
        setFetchLoading(false)
      }
    }
    
    fetchService()
  }, [id])

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
      await serviceAPI.updateService(id, formData)
      router.push('/dashboard/services')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update service')
      setLoading(false)
    }
  }, [formData, id, router])

  // Show loading spinner while fetching service data
  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/services"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-white">Edit Service</h1>
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
            submitLabel="Update Service"
            submittingLabel="Updating..."
          />
        </form>
      </div>
    </div>
  )
} 