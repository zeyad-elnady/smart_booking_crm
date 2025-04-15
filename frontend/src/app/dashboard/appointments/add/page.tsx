'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { customerAPI, serviceAPI, Customer, Service } from '@/services/api'
import CustomDropdown from '@/components/CustomDropdown'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { fetchCustomers } from '@/services/customerService'
import { fetchServices } from '@/services/serviceService'
import { createAppointment } from '@/services/appointmentService'

// Custom style to fix dropdown behavior
const customStyles = `
  /* Override dropdown direction and appearance */
  select, input, textarea {
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    background-color: rgba(17, 24, 39, 0.9) !important; 
    color: white !important;
  }
  
  /* Force dropdown to appear at the bottom */
  select option {
    position: relative;
    display: block;
    min-height: 1.2em;
    padding: 0.5em;
    color: white;
    background-color: #1f2937;
  }
  
  /* Custom dropdown arrow */
  .select-wrapper {
    position: relative;
  }
  
  .select-wrapper::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 15px;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid white;
    pointer-events: none;
  }
  
  /* Focus styles */
  input:focus, textarea:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5) !important;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25) !important;
  }
  
  /* Form container */
  .form-container {
    background: rgba(15, 20, 30, 0.5);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  /* Custom input styles */
  .dark-input {
    background-color: rgba(17, 24, 39, 0.9) !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white !important;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }
  
  .dark-input:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .dark-input:focus {
    border-color: rgba(99, 102, 241, 0.5) !important;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25) !important;
  }
  
  /* Custom input icons */
  .input-with-icon {
    position: relative;
  }
  
  .input-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }
`;

export default function AddAppointment() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    date: '',
    time: '',
    duration: '60',
    status: 'scheduled',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<any>({})

  const selectRef = useRef<HTMLSelectElement>(null);

  // Fetch customers and services on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedCustomers = await fetchCustomers()
        const fetchedServices = await fetchServices()
        setCustomers(fetchedCustomers)
        setServices(fetchedServices)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load required data')
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!selectRef.current) return;
    
    const handleSelectClick = () => {
      // Force reposition of dropdown after a tiny delay
      setTimeout(() => {
        if (selectRef.current) {
          // This forces a reflow which can help reset dropdown position
          selectRef.current.blur();
          selectRef.current.focus();
        }
      }, 10);
    };

    const select = selectRef.current;
    select.addEventListener('mousedown', handleSelectClick);
    
    return () => {
      select.removeEventListener('mousedown', handleSelectClick);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      // Format data for the API
      const appointmentData = {
        customer: formData.customerId,
        service: formData.serviceId,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        status: formData.status,
        notes: formData.notes
      };
      
      await createAppointment(appointmentData)
      toast.success('Appointment created successfully')
      router.push('/dashboard/appointments')
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Failed to create appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleDropdownChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev: any) => ({ ...prev, [name]: undefined }));
    }
  }

  const validateForm = () => {
    const errors: any = {}
    if (!formData.customerId) errors.customerId = 'Customer is required'
    if (!formData.serviceId) errors.serviceId = 'Service is required'
    if (!formData.date) errors.date = 'Date is required'
    if (!formData.time) errors.time = 'Time is required'
    if (!formData.duration) errors.duration = 'Duration is required'
    if (!formData.status) errors.status = 'Status is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Prepare dropdown options
  const customerOptions = customers.map((customer) => ({
    id: customer._id,
    label: `${customer.firstName} ${customer.lastName} (${customer.email || 'No email'})`,
  }))

  const serviceOptions = services.map((service) => ({
    id: service._id,
    label: service.name,
  }))

  const statusOptions = [
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'completed', label: 'Completed' },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 p-0 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Navigation */}
      <div className="p-6">
        <button 
          onClick={() => router.push('/dashboard/appointments')}
          className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          <span>Back to appointments</span>
        </button>
      
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8 max-w-7xl mx-auto">
          {/* Left side - Info panel */}
          <div className="hidden lg:block">
            <div className="sticky top-6 bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">Schedule a New Appointment</h2>
              <p className="text-gray-300 mb-6">Create a new appointment by filling out the form. All fields marked with an asterisk (*) are required.</p>
              
              <div className="space-y-6">
                <div className="border-l-2 border-indigo-500 pl-4">
                  <h3 className="text-white font-medium">Customer Selection</h3>
                  <p className="text-gray-400 text-sm">Choose the customer for this appointment.</p>
                </div>
                
                <div className="border-l-2 border-purple-500 pl-4">
                  <h3 className="text-white font-medium">Service Details</h3>
                  <p className="text-gray-400 text-sm">Select the service and specify duration.</p>
                </div>
                
                <div className="border-l-2 border-pink-500 pl-4">
                  <h3 className="text-white font-medium">Date & Time</h3>
                  <p className="text-gray-400 text-sm">When will this appointment take place?</p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-gray-300">Need to add a new customer or service first?</p>
                <div className="mt-3 flex space-x-3">
                  <Link href="/dashboard/customers/add" className="text-xs px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-gray-200 transition-colors">
                    Add Customer
                  </Link>
                  <Link href="/dashboard/services/add" className="text-xs px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-gray-200 transition-colors">
                    Add Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="form-container bg-gray-900/60 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Schedule New Appointment
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customer" className="block mb-2 text-sm font-medium text-gray-300">
                    Customer <span className="text-pink-500">*</span>
                  </label>
                  <CustomDropdown
                    id="customer"
                    name="customerId"
                    value={formData.customerId}
                    onChange={(value) => handleDropdownChange('customerId', value)}
                    required
                    placeholder="Select a customer"
                    options={customerOptions}
                  />
                  {formErrors.customerId && (
                    <p className="mt-1 text-sm text-pink-500">{formErrors.customerId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="service" className="block mb-2 text-sm font-medium text-gray-300">
                    Service <span className="text-pink-500">*</span>
                  </label>
                  <CustomDropdown
                    id="service"
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={(value) => handleDropdownChange('serviceId', value)}
                    required
                    placeholder="Select a service"
                    options={serviceOptions}
                  />
                  {formErrors.serviceId && (
                    <p className="mt-1 text-sm text-pink-500">{formErrors.serviceId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-300">
                    Date <span className="text-pink-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-pink-500">{formErrors.date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="time" className="block mb-2 text-sm font-medium text-gray-300">
                    Time <span className="text-pink-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  {formErrors.time && (
                    <p className="mt-1 text-sm text-pink-500">{formErrors.time}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="duration" className="block mb-2 text-sm font-medium text-gray-300">
                    Duration (minutes) <span className="text-pink-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      min="15"
                      max="180"
                      step="15"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  {formErrors.duration && (
                    <p className="mt-1 text-sm text-pink-500">{formErrors.duration}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-300">
                    Status <span className="text-pink-500">*</span>
                  </label>
                  <CustomDropdown
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(value) => handleDropdownChange('status', value)}
                    required
                    placeholder="Select status"
                    options={statusOptions}
                  />
                  {formErrors.status && (
                    <p className="mt-1 text-sm text-pink-500">{formErrors.status}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-300">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-gray-900 px-4 py-2.5 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Add any notes about this appointment"
                ></textarea>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 bg-purple-800/80 backdrop-blur-sm hover:bg-purple-900/90 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border border-purple-600/20 text-white"
                >
                  {loading ? 'Creating...' : 'Schedule Appointment'}
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
        
        .dark-input {
          color: white;
          background-color: rgba(17, 24, 39, 0.9);
        }
        
        .dark-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.1);
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

        /* Fix color scheme for date/time inputs */
        input[type="date"],
        input[type="time"],
        input[type="number"] {
          color-scheme: dark;
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