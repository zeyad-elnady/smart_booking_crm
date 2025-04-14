'use client'

import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { serviceAPI, Service } from '@/services/api'

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setDebugInfo('Fetching services...');
        const data = await serviceAPI.getServices();
        setServices(data);
        setDebugInfo(`Fetched ${data.length} services successfully`);
        setLoading(false);
      } catch (err: any) {
        console.error('Services fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch services');
        setDebugInfo(`Error: ${JSON.stringify(err.message || err)}`);
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        {debugInfo && <div className="text-gray-400 text-sm">{debugInfo}</div>}
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 text-xl">{error}</div>
        {debugInfo && <div className="text-gray-400 text-sm mt-2">{debugInfo}</div>}
        <div className="mt-4 flex justify-center space-x-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
          <a 
            href="/dashboard/services" 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Direct Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {debugInfo && (
        <div className="p-4 glass border border-gray-500/30 rounded-lg text-gray-300 text-sm">
          Debug: {debugInfo}
        </div>
      )}
      
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-white">Services</h1>
          <p className="mt-2 text-sm text-gray-300">
            A list of all services offered by your business including pricing and duration.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/services/add"
            className="block rounded-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 flex items-center"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-1" />
            Add Service
          </Link>
        </div>
      </div>
      
      <div className="glass border border-white/10 rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Service
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-6 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {services.map((service) => (
              <tr key={service._id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {service.name && service.name.charAt(0) || 'S'}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{service.name || 'Unnamed Service'}</div>
                      <div className="text-sm text-gray-400">{service.description || 'No description available'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {service.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {service.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gradient-to-r ${service.isActive ? 'from-green-400 to-emerald-500' : 'from-gray-400 to-gray-500'} text-white`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/dashboard/services/edit/${service._id}`} className="text-indigo-400 hover:text-indigo-300 transition-colors mr-3">Edit</Link>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this service?')) {
                        try {
                          await serviceAPI.deleteService(service._id);
                          setServices(services.filter(s => s._id !== service._id));
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to delete service');
                        }
                      }
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 