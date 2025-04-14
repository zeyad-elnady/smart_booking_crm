'use client'

import { useEffect, useState } from 'react'
import { 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { authAPI, User, dashboardAPI, DashboardStats } from '@/services/api'
import { appointmentAPI } from '@/services/api'

// Stats cards definitions with icons and colors
const statDefinitions = [
  { 
    id: 'appointmentsToday', 
    name: "Today's Appointments", 
    icon: CalendarIcon, 
    color: 'from-blue-400 to-blue-600',
    format: (value: number) => value.toString()
  },
  { 
    id: 'totalCustomers', 
    name: 'Total Customers', 
    icon: UserGroupIcon, 
    color: 'from-purple-400 to-purple-600',
    format: (value: number) => value.toString()
  },
  { 
    id: 'revenueToday', 
    name: 'Revenue Today', 
    icon: CurrencyDollarIcon, 
    color: 'from-green-400 to-green-600',
    format: (value: number) => `$${value}`
  },
  { 
    id: 'averageWaitTime', 
    name: 'Average Wait Time', 
    icon: ClockIcon, 
    color: 'from-amber-400 to-amber-600',
    format: (value: number) => `${value} min`
  },
]

// Define the type for appointments
interface RecentAppointment {
  _id: string;
  customer: string;
  service: string;
  time: string;
  status: string;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showServicePrompt, setShowServicePrompt] = useState(true)
  const [serviceLink, setServiceLink] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [hasServiceLink, setHasServiceLink] = useState(false)
  
  // Stats state
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Appointments state
  const [appointments, setAppointments] = useState<RecentAppointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  
  const fetchStats = async (refresh = false) => {
    try {
      setRefreshing(refresh)
      
      // Always get current customer count first
      if (typeof window !== 'undefined') {
        // Force update of customer count before fetching stats
        const storedMockCustomers = localStorage.getItem('mockCustomers');
        if (storedMockCustomers) {
          const customers = JSON.parse(storedMockCustomers);
          console.log(`Dashboard detected ${customers.length} customers in localStorage`);
          
          // Update dashboard stats with current count
          const storedMockStats = localStorage.getItem('mockDashboardStats');
          if (storedMockStats) {
            const stats = JSON.parse(storedMockStats);
            stats.totalCustomers = customers.length;
            localStorage.setItem('mockDashboardStats', JSON.stringify(stats));
          }
        }
      }
      
      const data = refresh 
        ? await dashboardAPI.refreshStats()
        : await dashboardAPI.getStats()
      
      setStats(data)
      setLastUpdated(new Date())
      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  const fetchRecentAppointments = async () => {
    try {
      setLoadingAppointments(true)
      const data = await appointmentAPI.getRecentAppointments()
      setAppointments(data)
      setLoadingAppointments(false)
    } catch (error) {
      console.error('Error fetching recent appointments:', error)
      setLoadingAppointments(false)
    }
  }
  
  const handleRefreshStats = () => {
    fetchStats(true)
    fetchRecentAppointments()
  }

  useEffect(() => {
    setMounted(true)
    
    // Get the current user from localStorage
    const currentUser = authAPI.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    
    // Check for force refresh flag
    if (typeof window !== 'undefined') {
      const forceRefresh = localStorage.getItem('forceRefreshDashboard');
      if (forceRefresh === 'true') {
        console.log('Force refreshing dashboard stats');
        // Clear the flag
        localStorage.removeItem('forceRefreshDashboard');
        // Force refresh immediately
        setTimeout(() => {
          handleRefreshStats();
        }, 100);
      }
    }
    
    // Check if user has already set a service link preference
    const savedServiceLink = localStorage.getItem('serviceLink')
    const savedServiceName = localStorage.getItem('serviceName')
    const serviceChoice = localStorage.getItem('serviceChoice')
    
    if (serviceChoice === 'no') {
      setShowServicePrompt(false)
    } else if (savedServiceLink && savedServiceName) {
      setServiceLink(savedServiceLink)
      setServiceName(savedServiceName)
      setHasServiceLink(true)
      setShowServicePrompt(false)
    }
    
    // Initialize mockDashboardStats if it doesn't exist
    if (typeof window !== 'undefined') {
      const storedMockStats = localStorage.getItem('mockDashboardStats');
      if (!storedMockStats) {
        // Get customer count
        let totalCustomers = 0;
        const storedMockCustomers = localStorage.getItem('mockCustomers');
        if (storedMockCustomers) {
          try {
            const customers = JSON.parse(storedMockCustomers);
            totalCustomers = customers.length;
          } catch (e) {
            console.error('Error parsing mock customers:', e);
          }
        }
        
        // Initialize stats with accurate customer count
        const initialStats = {
          appointmentsToday: Math.floor(Math.random() * 5),
          totalCustomers: totalCustomers,
          revenueToday: Math.floor(Math.random() * 300) + 50,
          averageWaitTime: Math.floor(Math.random() * 15) + 5
        };
        
        localStorage.setItem('mockDashboardStats', JSON.stringify(initialStats));
        console.log('Initialized dashboard stats with customer count:', totalCustomers);
      }
    }
    
    // Fetch dashboard stats and recent appointments on component mount
    fetchStats()
    fetchRecentAppointments()
    
    // Set up interval to refresh stats every 60 seconds
    const intervalId = setInterval(() => {
      fetchStats(true)
      fetchRecentAppointments()
    }, 60000)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const handleServiceLinkSave = () => {
    if (serviceLink && serviceName) {
      localStorage.setItem('serviceLink', serviceLink)
      localStorage.setItem('serviceName', serviceName)
      localStorage.setItem('serviceChoice', 'yes')
      setHasServiceLink(true)
      setShowServicePrompt(false)
    }
  }

  const handleDeclineServiceLink = () => {
    localStorage.setItem('serviceChoice', 'no')
    setShowServicePrompt(false)
  }

  if (!mounted) return null

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 gradient-text">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-white/80">
            Here's an overview of {user?.businessName || 'your business'} today
          </p>
        </div>
        <div className="glass p-4 mt-4 md:mt-0 rounded-lg">
          <p className="text-white text-sm">Today's Date</p>
          <p className="text-xl font-bold text-white">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {showServicePrompt && (
        <div className="glass-dark p-6 rounded-lg animate-fadeIn">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold text-white mb-3">Add a Direct Link to Your Service</h3>
            <button 
              onClick={() => setShowServicePrompt(false)} 
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-300 mb-4">Would you like to add a quick access link to your service website?</p>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="serviceName" className="text-sm text-gray-300">Service Name</label>
              <input
                type="text"
                id="serviceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="My Salon Website"
                className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label htmlFor="serviceLink" className="text-sm text-gray-300">Service URL</label>
              <input
                type="url"
                id="serviceLink"
                value={serviceLink}
                onChange={(e) => setServiceLink(e.target.value)}
                placeholder="https://your-website.com"
                className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-md text-white"
              />
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleServiceLinkSave}
                disabled={!serviceLink || !serviceName}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md disabled:opacity-50"
              >
                Save Link
              </button>
              
              <button
                onClick={handleDeclineServiceLink}
                className="px-4 py-2 bg-gray-700 text-white rounded-md"
              >
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {hasServiceLink && (
        <div className="flex justify-center">
          <a 
            href={serviceLink}
            target="_blank"
            rel="noopener noreferrer" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-md hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg"
          >
            Go to {serviceName}
          </a>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Business Statistics</h2>
        <div className="flex items-center">
          {lastUpdated && (
            <span className="text-sm text-gray-400 mr-3">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={handleRefreshStats}
            disabled={refreshing}
            className="flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statDefinitions.map((stat, index) => (
          <div 
            key={stat.id} 
            className="glass-card hover:scale-105 transition-transform duration-300"
            style={{ 
              animationDelay: `${index * 150}ms`,
              opacity: loading ? 0 : 1,
              animation: 'fadeIn 0.6s forwards'
            }}
          >
            <div className={`rounded-lg p-5 relative overflow-hidden`}>
              <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${stat.color}`}></div>
              <div className="relative z-10">
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${stat.color} p-3 text-white mb-4`}>
                  <stat.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-300">
                    {stat.name}
                  </p>
                  
                  {loading ? (
                    <div className="h-9 mt-1 bg-gray-800/40 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-semibold text-white">
                      {stats ? stat.format(stats[stat.id as keyof DashboardStats]) : '0'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-6 text-white">Recent Appointments</h2>
        <div className="glass rounded-xl overflow-hidden">
          {loadingAppointments ? (
            <div className="p-8 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 bg-gray-700/50 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700/50 rounded w-1/3"></div>
              </div>
            </div>
          ) : appointments.length > 0 ? (
            <div className="divide-y divide-white/10">
              {appointments.map((appointment) => (
                <div 
                  key={appointment._id} 
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {appointment.customer && typeof appointment.customer === 'string' && appointment.customer.charAt(0) || 'C'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{appointment.customer || 'Unknown Customer'}</div>
                      <div className="text-sm text-gray-300">{appointment.service || 'Unknown Service'}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm text-gray-300 mr-4">{appointment.time}</div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'Confirmed'
                          ? 'bg-green-400/20 text-green-300'
                          : appointment.status === 'Completed'
                          ? 'bg-blue-400/20 text-blue-300'
                          : 'bg-yellow-400/20 text-yellow-300'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              No appointments scheduled for today
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
} 