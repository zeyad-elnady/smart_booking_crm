'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { dashboardAPI } from '@/services/api'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

// Mock data for analytics charts
const mockRevenueData = [
  { month: 'Jan', value: 3200 },
  { month: 'Feb', value: 3800 },
  { month: 'Mar', value: 4100 },
  { month: 'Apr', value: 5200 },
  { month: 'May', value: 4900 },
  { month: 'Jun', value: 6100 },
  { month: 'Jul', value: 6500 },
  { month: 'Aug', value: 7200 },
  { month: 'Sep', value: 6800 },
  { month: 'Oct', value: 7500 },
  { month: 'Nov', value: 8200 },
  { month: 'Dec', value: 8800 },
]

const mockCustomerData = [
  { month: 'Jan', value: 12 },
  { month: 'Feb', value: 19 },
  { month: 'Mar', value: 28 },
  { month: 'Apr', value: 32 },
  { month: 'May', value: 45 },
  { month: 'Jun', value: 51 },
  { month: 'Jul', value: 65 },
  { month: 'Aug', value: 72 },
  { month: 'Sep', value: 78 },
  { month: 'Oct', value: 86 },
  { month: 'Nov', value: 92 },
  { month: 'Dec', value: 105 },
]

const mockAppointmentsData = [
  { month: 'Jan', value: 45 },
  { month: 'Feb', value: 58 },
  { month: 'Mar', value: 67 },
  { month: 'Apr', value: 82 },
  { month: 'May', value: 76 },
  { month: 'Jun', value: 94 },
  { month: 'Jul', value: 101 },
  { month: 'Aug', value: 115 },
  { month: 'Sep', value: 108 },
  { month: 'Oct', value: 122 },
  { month: 'Nov', value: 135 },
  { month: 'Dec', value: 148 },
]

export default function AnalyticsPage() {
  const { darkMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch dashboard stats on component mount
  useEffect(() => {
    setMounted(true)
    
    const fetchData = async () => {
      try {
        const data = await dashboardAPI.getStats()
        setStats(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  if (!mounted) return null
  
  // Helper function to find the max value in a dataset
  const getMaxValue = (data) => {
    return Math.max(...data.map(item => item.value))
  }
  
  // Calculate percentage change for KPI cards
  const calculateChange = (value, baseline = 100) => {
    const change = ((value - baseline) / baseline) * 100
    return {
      value: change.toFixed(1),
      positive: change >= 0
    }
  }
  
  const revenueChange = calculateChange(8800, 8200) // Dec vs Nov
  const customersChange = calculateChange(105, 92)
  const appointmentsChange = calculateChange(148, 135)

  return (
    <div className={`p-6 w-full ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Business Analytics
      </h1>
      
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Key Performance Indicators
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue KPI */}
          <div className={`rounded-xl border p-6 ${darkMode 
            ? 'border-white/10 bg-gray-800/30' 
            : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Monthly Revenue
                </p>
                <h3 className="text-2xl font-bold mt-1">${mockRevenueData[11].value}</h3>
                <div className="flex items-center mt-2">
                  {revenueChange.positive ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={revenueChange.positive ? 'text-green-500' : 'text-red-500'}>
                    {revenueChange.value}%
                  </span>
                  <span className={`ml-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    vs last month
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br from-green-400 to-green-600`}>
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          {/* Customers KPI */}
          <div className={`rounded-xl border p-6 ${darkMode 
            ? 'border-white/10 bg-gray-800/30' 
            : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Customers
                </p>
                <h3 className="text-2xl font-bold mt-1">{mockCustomerData[11].value}</h3>
                <div className="flex items-center mt-2">
                  {customersChange.positive ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={customersChange.positive ? 'text-green-500' : 'text-red-500'}>
                    {customersChange.value}%
                  </span>
                  <span className={`ml-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    vs last month
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600`}>
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          {/* Appointments KPI */}
          <div className={`rounded-xl border p-6 ${darkMode 
            ? 'border-white/10 bg-gray-800/30' 
            : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Monthly Appointments
                </p>
                <h3 className="text-2xl font-bold mt-1">{mockAppointmentsData[11].value}</h3>
                <div className="flex items-center mt-2">
                  {appointmentsChange.positive ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={appointmentsChange.positive ? 'text-green-500' : 'text-red-500'}>
                    {appointmentsChange.value}%
                  </span>
                  <span className={`ml-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    vs last month
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600`}>
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Revenue Chart */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Revenue Trends (2023)
        </h2>
        
        <div className={`rounded-xl border p-6 ${darkMode 
          ? 'border-white/10 bg-gray-800/30' 
          : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="h-60 relative">
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
              {mockRevenueData.map((item, index) => (
                <div key={index} className="text-xs text-center">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.month}</span>
                </div>
              ))}
            </div>
            
            {/* Chart bars */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-between items-end px-4 h-48">
              {mockRevenueData.map((item, index) => {
                const maxValue = getMaxValue(mockRevenueData)
                const height = (item.value / maxValue) * 100
                
                return (
                  <div 
                    key={index}
                    className={`w-4 md:w-6 rounded-t-md bg-gradient-to-t ${darkMode 
                      ? 'from-green-500 to-green-300' 
                      : 'from-green-600 to-green-400'
                    } relative group`}
                    style={{ height: `${height}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className={`px-2 py-1 rounded text-xs ${darkMode 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-white text-gray-800 shadow-md'
                      }`}>
                        ${item.value}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Other charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Customer Growth Chart */}
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Customer Growth
          </h2>
          
          <div className={`rounded-xl border p-6 ${darkMode 
            ? 'border-white/10 bg-gray-800/30' 
            : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="h-60 relative">
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                {mockCustomerData.map((item, index) => (
                  index % 2 === 0 && (
                    <div key={index} className="text-xs text-center">
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.month}</span>
                    </div>
                  )
                ))}
              </div>
              
              {/* Chart line */}
              <div className="absolute bottom-6 left-0 right-0 px-4 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d={mockCustomerData.map((item, index) => {
                      const maxValue = getMaxValue(mockCustomerData)
                      const x = (index / (mockCustomerData.length - 1)) * 100
                      const y = 100 - (item.value / maxValue) * 100
                      return (index === 0 ? 'M' : 'L') + `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke={darkMode ? '#a855f7' : '#9333ea'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Fill area under the line */}
                  <path
                    d={`
                      ${mockCustomerData.map((item, index) => {
                        const maxValue = getMaxValue(mockCustomerData)
                        const x = (index / (mockCustomerData.length - 1)) * 100
                        const y = 100 - (item.value / maxValue) * 100
                        return (index === 0 ? 'M' : 'L') + `${x},${y}`
                      }).join(' ')}
                      L100,100 L0,100 Z
                    `}
                    fill="url(#purple-gradient)"
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={darkMode ? '#a855f7' : '#9333ea'} />
                      <stop offset="100%" stopColor={darkMode ? '#a855f7' : '#9333ea'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Data points */}
                {mockCustomerData.map((item, index) => {
                  const maxValue = getMaxValue(mockCustomerData)
                  const left = `${(index / (mockCustomerData.length - 1)) * 100}%`
                  const bottom = `${(item.value / maxValue) * 100}%`
                  
                  return (
                    <div 
                      key={index}
                      className={`absolute w-2 h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'} transform -translate-x-1 group`}
                      style={{ left, bottom }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <div className={`px-2 py-1 rounded text-xs ${darkMode 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-white text-gray-800 shadow-md'
                        }`}>
                          {item.value} customers
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Appointments Chart */}
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Appointment Volume
          </h2>
          
          <div className={`rounded-xl border p-6 ${darkMode 
            ? 'border-white/10 bg-gray-800/30' 
            : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="h-60 relative">
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                {mockAppointmentsData.map((item, index) => (
                  index % 2 === 0 && (
                    <div key={index} className="text-xs text-center">
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.month}</span>
                    </div>
                  )
                ))}
              </div>
              
              {/* Chart bars */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-between items-end px-4 h-48">
                {mockAppointmentsData.map((item, index) => {
                  const maxValue = getMaxValue(mockAppointmentsData)
                  const height = (item.value / maxValue) * 100
                  
                  return (
                    <div 
                      key={index}
                      className={`w-2 md:w-3 rounded-t-md ${darkMode 
                        ? 'bg-blue-500' 
                        : 'bg-blue-600'
                      } relative group`}
                      style={{ height: `${height}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className={`px-2 py-1 rounded text-xs ${darkMode 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-white text-gray-800 shadow-md'
                        }`}>
                          {item.value} appts
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Note: This is a demo page using mock data. In a production environment, this would display real analytics from your business.
        </p>
      </div>
    </div>
  )
} 
 
 
 
 
 