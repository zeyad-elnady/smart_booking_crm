"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { getEmployeeById } from "@/services/employeeService";
import { appointmentAPI } from "@/services/api";
import { Employee } from "@/types/employee";
import { Appointment } from "@/types/appointment";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DoctorDashboard() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTab, setCurrentTab] = useState("schedule");
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [fetchingAppointments, setFetchingAppointments] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get doctor ID from URL
    const doctorId = searchParams.get('id');
    
    if (!doctorId) {
      // Redirect to doctor selection if no ID provided
      router.push('/doctor-selection');
      return;
    }
    
    // Fetch doctor information
    fetchDoctorData(doctorId);
  }, [searchParams, router]);
  
  useEffect(() => {
    // Fetch appointments and patients when doctor is loaded
    if (doctor?._id) {
      fetchAppointmentData(doctor._id);
    }
  }, [doctor]);
  
  const fetchDoctorData = async (doctorId: string) => {
    try {
      setLoading(true);
      const doctorData = await getEmployeeById(doctorId);
      
      if (!doctorData) {
        setError("Doctor not found. Please select a different doctor.");
        router.push('/doctor-selection');
        return;
      }
      
      setDoctor(doctorData);
    } catch (err) {
      console.error("Error fetching doctor data:", err);
      setError("Failed to load doctor information. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAppointmentData = async (doctorId: string) => {
    try {
      setFetchingAppointments(true);
      // Fetch all appointments
      const allAppointments = await appointmentAPI.getAppointments();
      
      // Filter appointments for this doctor
      const doctorAppointments = allAppointments.filter(
        appointment => appointment.doctor === doctorId || appointment.doctorId === doctorId
      );
      
      setAppointments(doctorAppointments);
      
      // Extract unique patients from appointments
      const uniquePatients = extractUniquePatients(doctorAppointments);
      setPatients(uniquePatients);
    } catch (err) {
      console.error("Error fetching appointment data:", err);
    } finally {
      setFetchingAppointments(false);
    }
  };
  
  const extractUniquePatients = (appointments: Appointment[]) => {
    // Create a map to store unique patients
    const patientMap = new Map();
    
    appointments.forEach(appointment => {
      if (appointment.customer && !patientMap.has(appointment.customer._id)) {
        // Add patient with additional information from appointment
        patientMap.set(appointment.customer._id, {
          id: appointment.customer._id,
          name: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
          lastVisit: new Date(appointment.date).toISOString().split('T')[0],
          // If we have service info, use it for condition
          condition: appointment.service?.name || "Consultation",
          // Find next appointment for this patient
          nextAppointment: findNextAppointment(appointment.customer._id, appointments)
        });
      }
    });
    
    return Array.from(patientMap.values());
  };
  
  const findNextAppointment = (patientId: string, appointments: Appointment[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find future appointments for this patient
    const futureAppointments = appointments
      .filter(appt => 
        (appt.customer?._id === patientId || appt.customerId === patientId) && 
        new Date(appt.date) >= today
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return futureAppointments.length > 0 
      ? new Date(futureAppointments[0].date).toISOString().split('T')[0]
      : "None scheduled";
  };
  
  // Filter appointments for today
  const getTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= today && appointmentDate < tomorrow;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Format appointment time from date string
  const formatAppointmentTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get appointment duration in minutes
  const getAppointmentDuration = (appointment: Appointment) => {
    return appointment.service?.duration || 30;
  };

  if (!mounted) return null;
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  if (error || !doctor) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`p-6 rounded-lg text-center max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <p className="text-xl mb-4">{error || "Doctor not found"}</p>
          <Link 
            href="/doctor-selection"
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Back to Doctor Selection
          </Link>
        </div>
      </div>
    );
  }
  
  const todayAppointments = getTodayAppointments();

  // Generate dates for the week view
  const generateWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start from Monday
    
    const monday = new Date(today.setDate(diff));
    const weekDates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };
  
  const weekDates = generateWeekDates();
  
  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-4 py-3 flex justify-between items-center`}>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            SmartBooking - Doctor
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
              <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center text-white font-medium`}>
                {doctor.firstName[0]}{doctor.lastName[0]}
              </div>
              <span>Dr. {doctor.firstName} {doctor.lastName}</span>
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
                  (currentTab === "schedule" ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'hover:bg-gray-700') : 
                  (currentTab === "schedule" ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100')
                }`}
                onClick={() => setCurrentTab("schedule")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Today's Schedule</span>
              </button>
              
              <button 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${darkMode ? 
                  (currentTab === "patients" ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'hover:bg-gray-700') : 
                  (currentTab === "patients" ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100')
                }`}
                onClick={() => setCurrentTab("patients")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>My Patients</span>
              </button>
              
              <button 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${darkMode ? 
                  (currentTab === "records" ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'hover:bg-gray-700') : 
                  (currentTab === "records" ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100')
                }`}
                onClick={() => setCurrentTab("records")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span>Medical Records</span>
              </button>
              
              <button 
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 ${darkMode ? 
                  (currentTab === "messages" ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'hover:bg-gray-700') : 
                  (currentTab === "messages" ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100')
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
            {/* Content for Today's Schedule Tab */}
            {currentTab === "schedule" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h1 className="text-2xl font-bold">Today's Appointments</h1>
                  <div className="flex space-x-2">
                    <button className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white border hover:bg-gray-100'}`}>
                      Day
                    </button>
                    <button className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                      Week
                    </button>
                    <button className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white border hover:bg-gray-100'}`}>
                      Month
                    </button>
                  </div>
                </div>
                
                {fetchingAppointments ? (
                  <div className="flex justify-center items-center py-20">
                    <LoadingSpinner size="large" />
                  </div>
                ) : (
                  <>
                {/* Week view navigation */}
                <div className={`flex justify-between items-center p-4 rounded-t-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                      <h2 className="font-medium">
                        {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </h2>
                  <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Week view calendar */}
                <div className={`border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} rounded-b-lg shadow-md overflow-hidden`}>
                  {/* Days header */}
                  <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div key={index} className="py-2 text-center font-medium">
                        <div>{day}</div>
                            <div className={`text-lg mt-1 ${new Date().toDateString() === weekDates[index].toDateString() ? 'text-blue-500' : ''}`}>
                              {weekDates[index].getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Appointments grid */}
                  <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                        {weekDates.map((date, dayIndex) => {
                          const dateAppointments = getAppointmentsForDate(date);
                          const isToday = new Date().toDateString() === date.toDateString();
                          
                          return (
                      <div 
                        key={dayIndex} 
                              className={`h-32 p-1 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'} ${
                                isToday ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''
                        }`}
                      >
                              {dateAppointments.map(appointment => {
                                // Get patient name
                                const patientName = appointment.customer 
                                  ? `${appointment.customer.firstName} ${appointment.customer.lastName}`
                                  : "Patient";
                                
                                return (
                          <div 
                                    key={appointment._id}
                            className={`text-xs p-1 mb-1 rounded ${
                              darkMode ? 'bg-blue-900 bg-opacity-50 text-blue-100' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                                    {formatAppointmentTime(appointment.date)} - {patientName}
                                  </div>
                                );
                              })}
                          </div>
                          );
                        })}
                  </div>
                </div>
                
                {/* Today's appointments list */}
                <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium">Today's Appointments ({todayAppointments.length})</h3>
                      </div>
                      
                      {todayAppointments.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No appointments scheduled for today.</p>
                  </div>
                      ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {todayAppointments.map(appointment => {
                            // Get patient name
                            const patientName = appointment.customer 
                              ? `${appointment.customer.firstName} ${appointment.customer.lastName}`
                              : "Patient";
                            
                            return (
                              <div key={appointment._id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 text-center">
                                    <div className="text-sm font-medium">{formatAppointmentTime(appointment.date)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{getAppointmentDuration(appointment)} min</div>
                          </div>
                          <div>
                                    <div className="font-medium">{patientName}</div>
                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {appointment.service?.name || appointment.type || "Consultation"}
                                    </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className={`px-3 py-1 rounded-md text-xs ${
                            darkMode ? 'bg-green-900 bg-opacity-50 text-green-300' : 'bg-green-100 text-green-700'
                          }`}>
                            Start Session
                          </button>
                          <button className={`px-3 py-1 rounded-md text-xs ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            View Details
                          </button>
                        </div>
                      </div>
                            );
                          })}
                  </div>
                      )}
                </div>
                  </>
                )}
              </div>
            )}

            {/* Content for My Patients Tab */}
            {currentTab === "patients" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">My Patients</h1>
                  <div className="flex space-x-2">
                    <div className={`relative rounded-md ${darkMode ? 'bg-gray-700' : 'bg-white border border-gray-300'}`}>
                      <input
                        type="text"
                        placeholder="Search patients..."
                        className={`pl-10 pr-4 py-2 rounded-md w-64 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'}`}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <button className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                      Add New
                    </button>
                  </div>
                </div>
                
                {fetchingAppointments ? (
                  <div className="flex justify-center items-center py-20">
                    <LoadingSpinner size="large" />
                  </div>
                ) : (
                  <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium">Recent Patients ({patients.length})</h3>
                    </div>
                    
                    {patients.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No patients found. Schedule appointments to see patients here.</p>
                      </div>
                    ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Visit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Condition</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Next Appointment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {patients.map((patient) => (
                        <tr key={patient.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{patient.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{patient.lastVisit}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{patient.condition}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{patient.nextAppointment}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className={`px-3 py-1 rounded-md text-xs mr-2 ${
                              darkMode ? 'bg-blue-900 bg-opacity-50 text-blue-300' : 'bg-blue-100 text-blue-700'
                            }`}>
                              View Records
                            </button>
                            <button className={`px-3 py-1 rounded-md text-xs ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              Schedule
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    )}
                </div>
                )}
              </div>
            )}

            {/* Placeholder for other tabs */}
            {currentTab === "records" && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-medium mb-2">Medical Records</h2>
                <p className={`text-center max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Search and access patient medical records, treatment history, and clinical notes.
                </p>
                <button className={`mt-6 px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                  Search Records
                </button>
              </div>
            )}

            {currentTab === "messages" && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h2 className="text-xl font-medium mb-2">Messages</h2>
                <p className={`text-center max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Communicate with patients, staff and colleagues. Securely exchange messages and files.
                </p>
                <button className={`mt-6 px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                  New Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 