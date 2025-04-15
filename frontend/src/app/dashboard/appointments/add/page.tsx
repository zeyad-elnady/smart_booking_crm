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
import { useTheme } from '@/components/ThemeProvider'

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
  const { darkMode } = useTheme()

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
    <div className="p-6 w-full">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => router.back()}
          className={`mr-4 rounded-full p-2 transition ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeftIcon className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
        </button>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Schedule New Appointment</h1>
      </div>

      <div className="flex flex-col lg:flex-row lg:space-x-6">
        <div className={`lg:w-2/3 mb-6 lg:mb-0 rounded-xl backdrop-blur-md border p-6 ${
          darkMode 
            ? 'border-white/10 bg-gray-800/30' 
            : 'border-gray-200 bg-white shadow-sm'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customer" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Customer <span className="text-pink-500">*</span>
                </label>
                <CustomDropdown
                  value={formData.customerId}
                  onChange={(value) => handleDropdownChange('customerId', value)}
                  placeholder="Select a customer"
                  options={customerOptions}
                />
                {formErrors.customerId && (
                  <p className="mt-1 text-sm text-pink-500">{formErrors.customerId}</p>
                )}
              </div>

              <div>
                <label htmlFor="service" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Service <span className="text-pink-500">*</span>
                </label>
                <CustomDropdown
                  value={formData.serviceId}
                  onChange={(value) => handleDropdownChange('serviceId', value)}
                  placeholder="Select a service"
                  options={serviceOptions}
                />
                {formErrors.serviceId && (
                  <p className="mt-1 text-sm text-pink-500">{formErrors.serviceId}</p>
                )}
              </div>

              <div>
                <label htmlFor="date" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
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
                    className={`w-full rounded-lg border px-4 py-2.5 shadow-sm ${
                      darkMode 
                        ? 'border-white/10 bg-gray-900/60 text-gray-100 focus:border-indigo-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:border-indigo-500'
                    } focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>
                {formErrors.date && (
                  <p className="mt-1 text-sm text-pink-500">{formErrors.date}</p>
                )}
              </div>

              <div>
                <label htmlFor="time" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
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
                    className={`w-full rounded-lg border px-4 py-2.5 shadow-sm ${
                      darkMode 
                        ? 'border-white/10 bg-gray-900/60 text-gray-100 focus:border-indigo-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:border-indigo-500'
                    } focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>
                {formErrors.time && (
                  <p className="mt-1 text-sm text-pink-500">{formErrors.time}</p>
                )}
              </div>

              <div>
                <label htmlFor="duration" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
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
                    className={`w-full rounded-lg border px-4 py-2.5 shadow-sm ${
                      darkMode 
                        ? 'border-white/10 bg-gray-900/60 text-gray-100 focus:border-indigo-500' 
                        : 'border-gray-300 bg-white text-gray-900 focus:border-indigo-500'
                    } focus:ring-2 focus:ring-indigo-500/20`}
                  />
                </div>
                {formErrors.duration && (
                  <p className="mt-1 text-sm text-pink-500">{formErrors.duration}</p>
                )}
              </div>

              <div>
                <label htmlFor="status" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Status <span className="text-pink-500">*</span>
                </label>
                <CustomDropdown
                  value={formData.status}
                  onChange={(value) => handleDropdownChange('status', value)}
                  placeholder="Select status"
                  options={statusOptions}
                />
                {formErrors.status && (
                  <p className="mt-1 text-sm text-pink-500">{formErrors.status}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className={`w-full rounded-lg border px-4 py-2.5 shadow-sm ${
                  darkMode 
                    ? 'border-white/10 bg-gray-900/60 text-gray-100 focus:border-indigo-500' 
                    : 'border-gray-300 bg-white text-gray-900 focus:border-indigo-500'
                } focus:ring-2 focus:ring-indigo-500/20`}
                placeholder="Add any notes about this appointment"
              ></textarea>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  darkMode
                    ? 'bg-purple-800/80 backdrop-blur-sm hover:bg-purple-900/90 border-purple-600/20'
                    : 'bg-purple-600 hover:bg-purple-700 border-purple-500/20'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 shadow-lg border text-white`}
              >
                {loading ? 'Creating...' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:w-1/3 space-y-6">
          <div className={`rounded-xl backdrop-blur-md border p-6 ${
            darkMode 
              ? 'border-white/10 bg-blue-900/30 text-white' 
              : 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
          }`}>
            <h2 className="text-xl font-bold mb-4">Appointment Management</h2>
            <p className={darkMode ? 'text-blue-100' : 'text-blue-800'}>Schedule appointments for your customers by selecting a service, date, and time. All required fields are marked with an asterisk (*).</p>
          </div>

          <div className={`rounded-xl backdrop-blur-md border p-6 ${
            darkMode 
              ? 'border-white/10 bg-purple-900/30 text-white' 
              : 'border-purple-200 bg-purple-50 text-purple-900 shadow-sm'
          }`}>
            <h2 className="text-xl font-bold mb-4">Customer & Service</h2>
            <p className={darkMode ? 'text-purple-100' : 'text-purple-800'}>Choose a customer and service for this appointment. Need to create a new customer or service first?</p>
            <div className="mt-4 flex space-x-3">
              <Link href="/dashboard/customers/add" className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-800/50 hover:bg-gray-800 text-gray-200'
                  : 'bg-gray-200/70 hover:bg-gray-300 text-gray-700'
              }`}>
                Add Customer
              </Link>
              <Link href="/dashboard/services/add" className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-800/50 hover:bg-gray-800 text-gray-200'
                  : 'bg-gray-200/70 hover:bg-gray-300 text-gray-700'
              }`}>
                Add Service
              </Link>
            </div>
          </div>
          
          <div className={`rounded-xl backdrop-blur-md border p-6 ${
            darkMode 
              ? 'border-white/10 bg-emerald-900/30 text-white' 
              : 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm'
          }`}>
            <h2 className="text-xl font-bold mb-4">Date & Time</h2>
            <p className={darkMode ? 'text-emerald-100' : 'text-emerald-800'}>Select an appropriate date and time for the appointment. You can adjust the duration based on the service requirements.</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(${darkMode ? 0.8 : 0.3});
        }
        
        /* Fix color scheme for date/time inputs */
        input[type="date"],
        input[type="time"],
        input[type="number"] {
          color-scheme: ${darkMode ? 'dark' : 'light'};
        }
      `}</style>
    </div>
  )
} 