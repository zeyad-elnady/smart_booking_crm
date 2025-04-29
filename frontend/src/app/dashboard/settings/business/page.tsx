"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, Users, Settings } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import BusinessHoursSettings from '@/components/BusinessHoursSettings';

export default function BusinessSettingsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('hours');

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center text-sm mb-6 hover:opacity-80 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Business Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className={`w-full md:w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('hours')}
                className={`w-full flex items-center p-3 rounded-md text-left ${
                  activeTab === 'hours'
                    ? 'bg-purple-600 text-white'
                    : darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Clock className="h-5 w-5 mr-3" />
                <span>Business Hours</span>
              </button>
              
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center p-3 rounded-md text-left ${
                  activeTab === 'general'
                    ? 'bg-purple-600 text-white'
                    : darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Settings className="h-5 w-5 mr-3" />
                <span>General</span>
              </button>
              
              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center p-3 rounded-md text-left ${
                  activeTab === 'services'
                    ? 'bg-purple-600 text-white'
                    : darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Calendar className="h-5 w-5 mr-3" />
                <span>Service Availability</span>
              </button>
              
              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center p-3 rounded-md text-left ${
                  activeTab === 'staff'
                    ? 'bg-purple-600 text-white'
                    : darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Users className="h-5 w-5 mr-3" />
                <span>Staff & Scheduling</span>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'hours' && <BusinessHoursSettings />}
            
            {activeTab === 'general' && (
              <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-lg`}>
                <h2 className="text-2xl font-bold mb-6">General Settings</h2>
                <p className="text-gray-500">General business settings will be available here.</p>
              </div>
            )}
            
            {activeTab === 'services' && (
              <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-lg`}>
                <h2 className="text-2xl font-bold mb-6">Service Availability</h2>
                <p className="text-gray-500">Configure service-specific availability settings here.</p>
              </div>
            )}
            
            {activeTab === 'staff' && (
              <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg p-6 shadow-lg`}>
                <h2 className="text-2xl font-bold mb-6">Staff & Scheduling</h2>
                <p className="text-gray-500">Configure staff availability and scheduling preferences here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 