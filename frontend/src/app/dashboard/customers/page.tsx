'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { customerAPI, Customer } from '@/services/api'
import { format } from 'date-fns'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isMockData, setIsMockData] = useState(false)
  
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true)
        const data = await customerAPI.getCustomers()
        setCustomers(data)
        
        // Check if we're using mock data by looking for mock_ in ID
        const hasMockData = data.some(customer => customer._id.toString().includes('mock_'));
        setIsMockData(hasMockData);
      } catch (error) {
        console.error('Failed to fetch customers:', error)
        setIsMockData(true);
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])
  
  const filteredCustomers = customers.filter(customer => 
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold gradient-text">Customers</h1>
          <p className="mt-2 text-sm text-white/80">
            A list of all customers in your database including their contact information and appointment history.
          </p>
          {isMockData && (
            <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
              <p className="text-xs text-yellow-300">
                ⚠️ Using mock data - Some features may be limited. The backend server is currently unavailable.
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/customers/add"
            className="block rounded-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 flex items-center"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-1" />
            Add Customer
          </Link>
        </div>
      </div>

      <div className="glass p-4 rounded-lg">
        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-white/50" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 bg-white/10 py-1.5 pl-10 pr-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
            placeholder="Search customers..."
          />
        </div>
      </div>

      <div className="glass rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-sm text-white/70">Loading customers...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <ul role="list" className="divide-y divide-white/10">
            {filteredCustomers.map((customer) => (
              <li key={customer._id} className="px-4 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {customer.firstName && customer.firstName.charAt(0) || 'C'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{customer.firstName || 'Unknown'} {customer.lastName || ''}</div>
                      <div className="text-sm text-gray-300">{customer.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-300">
                      <div>{customer.phone}</div>
                      <div>{customer.createdAt ? `Added: ${new Date(customer.createdAt).toLocaleDateString()}` : ''}</div>
                    </div>
                    <Link
                      href={`/dashboard/customers/edit/${customer._id}`}
                      className="text-indigo-300 hover:text-indigo-100 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-400">
            {searchTerm ? 'No customers match your search' : 'No customers found. Add your first customer!'}
          </div>
        )}
      </div>
    </div>
  )
} 