"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { createEmployee } from "@/services/employeeService";
import { EmployeeData, employeeRoles, doctorSpecializations } from "@/types/employee";
import { toast } from "react-hot-toast";

export default function AddEmployee() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<EmployeeData>({
    firstName: "",
    lastName: "",
    role: "Doctor",
    specialization: "General Practice",
    email: "",
    phone: "",
    address: "",
    qualifications: "",
    yearsOfExperience: 0,
    rate: 0,
    currency: "EGP",
    hiringDate: new Date().toISOString().split('T')[0],
    notes: "",
    isActive: true,
  });
  
  // Set mounted state to handle hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked 
            : type === "number" ? parseFloat(value)
            : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createEmployee(formData);
      toast.success("Employee added successfully");
      router.push("/dashboard/employees");
    } catch (err) {
      console.error("Error adding employee:", err);
      setError("Failed to add employee. Please try again.");
      toast.error("Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
      {/* Decorative element */}
      <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
      
      <div className="relative p-6 max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/dashboard/employees"
          className={`inline-flex items-center mb-6 ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back_to_employees')}
        </Link>
        
        <div className={`${darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"} backdrop-blur-md rounded-2xl p-6 md:p-8 border shadow-xl`}>
          <h1 className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
            {t('add_employee')}
          </h1>
          
          {/* Display any errors */}
          {error && (
            <div className={`p-4 mb-6 rounded-md ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-800"}`}>
              {error}
            </div>
          )}
          
          {/* Employee form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('first_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={t('enter_first_name')}
                />
              </div>
              
              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('last_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={t('enter_last_name')}
                />
              </div>
              
              {/* Role */}
              <div>
                <label htmlFor="role" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('role')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                >
                  {employeeRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Specialization (only for doctors) */}
              {formData.role === "Doctor" && (
                <div>
                  <label htmlFor="specialization" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {t('specialization')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="specialization"
                    name="specialization"
                    required={formData.role === "Doctor"}
                    value={formData.specialization}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg ${
                      darkMode
                        ? "bg-gray-800/50 border border-gray-700 text-white"
                        : "bg-white border border-gray-300 text-gray-900"
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  >
                    {doctorSpecializations.map((specialization) => (
                      <option key={specialization} value={specialization}>
                        {specialization}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Email */}
              <div>
                <label htmlFor="email" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={t('enter_email')}
                />
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={t('enter_phone')}
                />
              </div>
              
              {/* Qualifications */}
              <div>
                <label htmlFor="qualifications" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('qualifications')}
                </label>
                <input
                  type="text"
                  id="qualifications"
                  name="qualifications"
                  value={formData.qualifications || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={t('enter_qualifications')}
                />
              </div>
              
              {/* Years of Experience */}
              <div>
                <label htmlFor="yearsOfExperience" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('years_of_experience')}
                </label>
                <input
                  type="number"
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  min="0"
                  value={formData.yearsOfExperience || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="0"
                />
              </div>
              
              {/* Base Salary */}
              <div>
                <label htmlFor="baseSalary" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('base_salary')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-gray-400">
                    {formData.currency || "EGP"}
                  </span>
                  <input
                    type="number"
                    id="baseSalary"
                    name="baseSalary"
                    min="0"
                    step="0.01"
                    value={formData.baseSalary || ""}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-12 rounded-lg ${
                      darkMode
                        ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                        : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    placeholder="0.00"
                  />
                </div>
                <p className={`mt-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Monthly base salary amount
                </p>
              </div>
              
              {/* Hiring Date */}
              <div>
                <label htmlFor="hiringDate" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('hiring_date')}
                </label>
                <input
                  type="date"
                  id="hiringDate"
                  name="hiringDate"
                  value={formData.hiringDate || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>
              
              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('address')}
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={t('enter_address')}
                />
              </div>
              
              {/* Notes */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {t('notes')}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode
                      ? "bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={t('enter_notes')}
                />
              </div>
              
              {/* Active Status */}
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive ?? true}
                    onChange={handleChange}
                    className={`h-5 w-5 rounded ${
                      darkMode 
                        ? "bg-gray-800 border-gray-700 text-purple-600" 
                        : "bg-white border-gray-300 text-purple-600"
                    } focus:ring-purple-500`}
                  />
                  <label htmlFor="isActive" className={`ml-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {t('active_employee')}
                  </label>
                </div>
              </div>
            </div>
            
            {/* Form buttons */}
            <div className="mt-8 flex justify-end space-x-4">
              <Link
                href="/dashboard/employees"
                className={`px-4 py-2 rounded-lg transition ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-lg transition ${
                  darkMode
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loading ? t('adding') : t('add_employee')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 