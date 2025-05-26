"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { filterEmployeesByRole } from "@/services/employeeService";
import { Employee } from "@/types/employee";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DoctorSelection() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const doctorsList = await filterEmployeesByRole("Doctor");
      setDoctors(doctorsList);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Failed to load doctors. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    // Navigate to doctor dashboard with the selected doctor ID
    router.push(`/doctor-dashboard?id=${doctorId}`);
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            SmartBooking CRM
          </Link>
          <Link href="/get-started" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            darkMode 
              ? "bg-gray-700 hover:bg-gray-600 text-white" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}>
            Back
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Select a Doctor</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose a doctor to access their dashboard and view appointments.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900 bg-opacity-20 text-red-200' : 'bg-red-50 text-red-800'}`}>
            <p>{error}</p>
            <button 
              onClick={fetchDoctors}
              className={`mt-4 px-4 py-2 rounded-md text-sm font-medium ${
                darkMode ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'
              }`}
            >
              Retry
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className={`p-6 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <p className="text-xl mb-4">No doctors found in the system.</p>
            <Link 
              href="/dashboard/employees/add"
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Add a Doctor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div 
                key={doctor._id}
                onClick={() => handleDoctorSelect(doctor._id)} 
                className={`p-6 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`}>
                    {doctor.firstName[0]}{doctor.lastName[0]}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold">Dr. {doctor.firstName} {doctor.lastName}</h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{doctor.specialization}</p>
                  </div>
                </div>
                
                <div className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {doctor.email && (
                    <p className="mb-1">
                      <span className="font-medium">Email:</span> {doctor.email}
                    </p>
                  )}
                  <p className="mb-1">
                    <span className="font-medium">Phone:</span> {doctor.phone}
                  </p>
                  {doctor.yearsOfExperience && (
                    <p>
                      <span className="font-medium">Experience:</span> {doctor.yearsOfExperience} years
                    </p>
                  )}
                </div>
                
                <button 
                  className={`mt-6 w-full py-2 rounded-md text-center font-medium ${
                    darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Select Doctor
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 