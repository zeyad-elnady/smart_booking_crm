"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

// Mock data for upcoming appointments
const mockAppointments = [
  {
    id: 1,
    patientName: "John Smith",
    doctor: "Dr. Richards",
    time: "09:00 AM",
    duration: "30 min",
    type: "Check-up",
    status: "checked-in"
  },
  {
    id: 2,
    patientName: "Emma Johnson",
    doctor: "Dr. Matthews",
    time: "10:15 AM",
    duration: "45 min",
    type: "Consultation",
    status: "scheduled"
  },
  {
    id: 3,
    patientName: "Michael Brown",
    doctor: "Dr. Richards",
    time: "11:30 AM",
    duration: "30 min",
    type: "Follow-up",
    status: "scheduled"
  },
  {
    id: 4,
    patientName: "Sarah Wilson",
    doctor: "Dr. Lewis",
    time: "01:00 PM",
    duration: "60 min",
    type: "Initial Assessment",
    status: "scheduled"
  },
  {
    id: 5,
    patientName: "David Lee",
    doctor: "Dr. Matthews",
    time: "02:30 PM",
    duration: "45 min",
    type: "Treatment",
    status: "scheduled"
  }
];

// Mock data for patient check-ins today
const mockPatientCheckins = [
  {
    id: 101,
    name: "John Smith",
    checkinTime: "08:45 AM",
    appointment: "09:00 AM",
    doctor: "Dr. Richards"
  },
];

// Mock data for wait times
const mockWaitTimes = {
  averageToday: "12 minutes",
  currentLongest: "24 minutes",
  totalWaiting: 3,
  nextAvailable: "11:45 AM"
};

export default function SecretaryDashboard() {
  const { darkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTab, setCurrentTab] = useState("appointments");
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-4 py-3 flex justify-between items-center`}>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            SmartBooking - Secretary
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <div className="relative">
            <button className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-green-600' : 'bg-green-500'} flex items-center justify-center text-white font-medium`}>
                SM
              </div>
              <span>Sarah Miller</span>
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className={`w-full md:w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
            <nav className="space-y-2">
              <button 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${darkMode ? 
                  (currentTab === "appointments" ? 'bg-green-900 bg-opacity-50 text-green-300' : 'hover:bg-gray-700') : 
                  (currentTab === "appointments" ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100')
                }`}
                onClick={() => setCurrentTab("appointments")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Appointments</span>
              </button>
              
              <button 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${darkMode ? 
                  (currentTab === "check-in" ? 'bg-green-900 bg-opacity-50 text-green-300' : 'hover:bg-gray-700') : 
                  (currentTab === "check-in" ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100')
                }`}
                onClick={() => setCurrentTab("check-in")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Patient Check-in</span>
              </button>
              
              <button 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${darkMode ? 
                  (currentTab === "patients" ? 'bg-green-900 bg-opacity-50 text-green-300' : 'hover:bg-gray-700') : 
                  (currentTab === "patients" ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100')
                }`}
                onClick={() => setCurrentTab("patients")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>Patient Directory</span>
              </button>
              
              <button 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${darkMode ? 
                  (currentTab === "messages" ? 'bg-green-900 bg-opacity-50 text-green-300' : 'hover:bg-gray-700') : 
                  (currentTab === "messages" ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100')
                }`}
                onClick={() => setCurrentTab("messages")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>Messages</span>
              </button>
            </nav>
          </div>
          
          {/* Main content area */}
          <div className="flex-1">
            {/* Content for Appointments Tab */}
            {currentTab === "appointments" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h1 className="text-2xl font-bold">Today's Schedule</h1>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowNewAppointment(true)}
                      className={`px-4 py-2 rounded-md font-medium flex items-center ${
                        darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      New Appointment
                    </button>
                  </div>
                </div>

                {/* Date navigation */}
                <div className={`flex justify-between items-center p-4 rounded-t-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <h2 className="font-medium">November 20, 2023</h2>
                  <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Today's appointments */}
                <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Doctor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {mockAppointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium">{appointment.time}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{appointment.duration}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{appointment.patientName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{appointment.doctor}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{appointment.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                appointment.status === 'checked-in' 
                                  ? darkMode ? 'bg-green-900 bg-opacity-50 text-green-300' : 'bg-green-100 text-green-800' 
                                  : darkMode ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {appointment.status === 'checked-in' ? 'Checked In' : 'Scheduled'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                              {appointment.status !== 'checked-in' ? (
                                <button className={`px-3 py-1 rounded-md text-xs ${
                                  darkMode ? 'bg-green-900 bg-opacity-50 text-green-300' : 'bg-green-100 text-green-700'
                                }`}>
                                  Check In
                                </button>
                              ) : (
                                <button className={`px-3 py-1 rounded-md text-xs ${
                                  darkMode ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  Notify Doctor
                                </button>
                              )}
                              <button className={`px-3 py-1 rounded-md text-xs ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                              }`}>
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Content for Patient Check-in Tab */}
            {currentTab === "check-in" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold mb-6">Patient Check-in</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Check-in form */}
                  <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className="text-xl font-medium mb-4">Check in a Patient</h2>
                    
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="patientSearch">Patient Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            id="patientSearch"
                            className={`w-full p-2 rounded-md ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 focus:border-green-500 focus:ring-green-500' 
                                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                            } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                            placeholder="Start typing to search..."
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="appointmentTime">Appointment Time</label>
                        <select 
                          id="appointmentTime"
                          className={`w-full p-2 rounded-md ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 focus:border-green-500 focus:ring-green-500' 
                              : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                          } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        >
                          <option>09:00 AM - Dr. Richards</option>
                          <option>10:15 AM - Dr. Matthews</option>
                          <option>11:30 AM - Dr. Richards</option>
                          <option>01:00 PM - Dr. Lewis</option>
                          <option>02:30 PM - Dr. Matthews</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="notes">Notes (optional)</label>
                        <textarea 
                          id="notes"
                          rows={3}
                          className={`w-full p-2 rounded-md ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 focus:border-green-500 focus:ring-green-500' 
                              : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
                          } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                          placeholder="Any special notes about this check-in..."
                        />
                      </div>
                      
                      <div className="pt-2">
                        <button 
                          type="submit"
                          className={`w-full px-4 py-2 rounded-md font-medium ${
                            darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          Check In Patient
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  {/* Quick stats */}
                  <div className="space-y-6">
                    {/* Wait times */}
                    <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h2 className="text-xl font-medium mb-4">Today's Wait Times</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Average Wait</div>
                          <div className="text-2xl font-bold">{mockWaitTimes.averageToday}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Current Longest</div>
                          <div className="text-2xl font-bold">{mockWaitTimes.currentLongest}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Patients Waiting</div>
                          <div className="text-2xl font-bold">{mockWaitTimes.totalWaiting}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Next Available</div>
                          <div className="text-2xl font-bold">{mockWaitTimes.nextAvailable}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent check-ins */}
                    <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h2 className="text-xl font-medium mb-4">Recent Check-ins</h2>
                      {mockPatientCheckins.length > 0 ? (
                        <div className="space-y-3">
                          {mockPatientCheckins.map(checkin => (
                            <div key={checkin.id} className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <div className="font-medium">{checkin.name}</div>
                              <div className="text-sm flex justify-between">
                                <span>Checked in: {checkin.checkinTime}</span>
                                <span>Appointment: {checkin.appointment}</span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{checkin.doctor}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                          No check-ins yet today
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder for Patient Directory Tab */}
            {currentTab === "patients" && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-xl font-medium mb-2">Patient Directory</h2>
                <p className={`text-center max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Search and manage patient profiles, contact information, and appointment history.
                </p>
                <button className={`mt-6 px-4 py-2 rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}>
                  Search Directory
                </button>
              </div>
            )}

            {/* Placeholder for Messages Tab */}
            {currentTab === "messages" && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h2 className="text-xl font-medium mb-2">Messages</h2>
                <p className={`text-center max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Communicate with doctors, patients and staff. Send notifications and appointment reminders.
                </p>
                <button className={`mt-6 px-4 py-2 rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}>
                  New Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">New Appointment</h3>
              <button 
                onClick={() => setShowNewAppointment(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appointmentPatient">Patient</label>
                <input 
                  type="text" 
                  id="appointmentPatient"
                  className={`w-full p-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-green-500`}
                  placeholder="Search for a patient..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appointmentDoctor">Doctor</label>
                <select 
                  id="appointmentDoctor"
                  className={`w-full p-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-green-500`}
                >
                  <option>Dr. Richards</option>
                  <option>Dr. Matthews</option>
                  <option>Dr. Lewis</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="appointmentDate">Date</label>
                  <input 
                    type="date" 
                    id="appointmentDate"
                    className={`w-full p-2 rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-green-500`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="appointmentTime">Time</label>
                  <input 
                    type="time" 
                    id="appointmentTime"
                    className={`w-full p-2 rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-green-500`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appointmentType">Appointment Type</label>
                <select 
                  id="appointmentType"
                  className={`w-full p-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-green-500`}
                >
                  <option>Check-up</option>
                  <option>Consultation</option>
                  <option>Follow-up</option>
                  <option>Initial Assessment</option>
                  <option>Treatment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appointmentNotes">Notes</label>
                <textarea 
                  id="appointmentNotes"
                  rows={3}
                  className={`w-full p-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-green-500`}
                  placeholder="Any special notes about this appointment..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className={`flex-1 px-4 py-2 rounded-md font-medium ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-md font-medium ${
                    darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 