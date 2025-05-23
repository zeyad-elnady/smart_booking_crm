"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  FunnelIcon,
  ArrowPathIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { 
  getAllEmployees, 
  deleteEmployee, 
  searchEmployees,
  filterEmployeesByRole
} from "@/services/employeeService";
import { Employee, employeeRoles } from "@/types/employee";
import { toast } from "react-hot-toast";
import DeleteConfirmationDialog from "@/components/DeleteAppointmentDialog";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Employees() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Load employees on initial render and when filters change
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load employees
        let employeesList = await getAllEmployees();
        

        setEmployees(employeesList);
        handleFilterChange(roleFilter); // Apply current filter
      } catch (err) {
        console.error("Error loading employees:", err);
        setError("there is no employees");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
    
    // Set up refresh listener
    const checkForRefresh = () => {
      const shouldRefresh = localStorage.getItem("employeeListShouldRefresh");
      if (shouldRefresh === "true") {
        localStorage.removeItem("employeeListShouldRefresh");
        loadEmployees();
      }
    };

    const refreshInterval = setInterval(checkForRefresh, 2000);
    return () => clearInterval(refreshInterval);
  }, [roleFilter]);

  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim() && !roleFilter) {
      // If search is cleared and no filter is active, show all employees
      setFilteredEmployees(employees);
      return;
    }
    
    // Apply search
    try {
      let results = await searchEmployees(term);
      
      // Apply role filter if active
      if (roleFilter) {
        results = results.filter(
          employee => employee.role === roleFilter
        );
      }
      
      setFilteredEmployees(results);
    } catch (err) {
      console.error("Error searching employees:", err);
      toast.error("Error searching employees");
    }
  };

  // Handle filter change
  const handleFilterChange = async (role: string | null) => {
    setRoleFilter(role);
    setActiveFilter(role);
    
    try {
      let filtered;
      
      if (role) {
        filtered = employees.filter(
          employee => employee.role === role
        );
      } else {
        filtered = [...employees];
      }
      
      // Apply search term if exists
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        filtered = filtered.filter(employee => {
          const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
          return fullName.includes(searchTermLower) ||
            (employee.email && employee.email.toLowerCase().includes(searchTermLower));
        });
      }
      
      setFilteredEmployees(filtered);
    } catch (err) {
      console.error("Error filtering employees:", err);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteEmployee(employeeToDelete);
      
      // Update both lists
      const updatedEmployees = employees.filter(e => e._id !== employeeToDelete);
      setEmployees(updatedEmployees);
      setFilteredEmployees(filteredEmployees.filter(e => e._id !== employeeToDelete));
      
      toast.success("Employee deleted successfully");
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast.error("Failed to delete employee");
    } finally {
      setIsDeleting(false);
      setEmployeeToDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setEmployeeToDelete(null);
  };

  // Refresh employees
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const refreshedEmployees = await getAllEmployees();
      setEmployees(refreshedEmployees);
      handleFilterChange(roleFilter);
      toast.success("Employees refreshed successfully");
    } catch (err) {
      console.error("Error refreshing employees:", err);
      toast.error("Failed to refresh employees");
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter(null);
    setActiveFilter(null);
    setFilteredEmployees(employees);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" : "bg-gradient-to-br from-white via-purple-100/30 to-white"} p-0 relative`}>
      {/* Decorative element */}
      <div className={`absolute top-0 right-0 w-1/3 h-1/3 ${darkMode ? "bg-indigo-500/10" : "bg-indigo-500/5"} rounded-full blur-3xl`}></div>
      
      <div className="relative p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              {t('employees')}
            </h1>
            <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {t('manage_clinic_staff')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/dashboard/employees/add"
              className={`px-4 py-2 rounded-lg transition flex items-center justify-center sm:justify-start ${
                darkMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('add_employee')}
            </Link>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className={`flex-1 relative rounded-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('search_employees')}
              className={`block w-full pl-10 pr-3 py-2 border-none ${
                darkMode ? "bg-gray-800 text-white placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500"
              } focus:ring-0 sm:text-sm`}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg transition flex items-center ${
                showFilters || activeFilter
                  ? darkMode
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-600 text-white" 
                  : darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              {t('filters')} {activeFilter && <span className="ml-1 text-xs">(1)</span>}
            </button>
            
            <button
              onClick={handleRefresh}
              className={`px-3 py-2 rounded-lg transition flex items-center ${
                darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            
            {(showFilters || activeFilter) && (
              <button
                onClick={resetFilters}
                className={`px-3 py-2 rounded-lg transition flex items-center ${
                  darkMode
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                {t('clear_filters')}
              </button>
            )}
          </div>
        </div>
        
        {/* Filter options */}
        {showFilters && (
          <div className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-gray-800/80 backdrop-blur-sm" : "bg-white shadow-md"}`}>
            <h3 className={`text-sm font-medium mb-2 ${darkMode ? "text-white" : "text-gray-700"}`}>
              {t('filter_by_role')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {employeeRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleFilterChange(role === roleFilter ? null : role)}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    role === roleFilter
                      ? darkMode
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-600 text-white"
                      : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Content */}
        {error ? (
          <div className={`p-4 rounded-lg ${darkMode ? "bg-red-900/20 text-red-200" : "bg-red-100 text-red-600"}`}>
            {error}
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : employees.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <h3 className="text-lg font-medium mb-2">{t('no_employees')}</h3>
            <p className="mb-6">{t('add_your_first_employee')}</p>
            <Link
              href="/dashboard/employees/add"
              className={`px-4 py-2 rounded-lg transition inline-flex items-center ${
                darkMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('add_employee')}
            </Link>
          </div>
        ) : (filteredEmployees.length === 0 && (searchTerm || roleFilter)) ? (
          <div className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <div className="h-16 w-16 mx-auto mb-4 opacity-50">🔍</div>
            <h3 className="text-lg font-medium mb-2">{t('no_matching_employees')}</h3>
            <p className="mb-6">{t('try_different_search_or_filter')}</p>
            <button
              onClick={resetFilters}
              className={`px-4 py-2 rounded-lg transition inline-flex items-center ${
                darkMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              <XCircleIcon className="h-5 w-5 mr-2" />
              {t('clear_filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredEmployees.length > 0 ? filteredEmployees : employees).map((employee) => (
              <div
                key={employee._id}
                className={`${
                  darkMode ? "bg-gray-900/60 border-white/10" : "bg-white/80 border-gray-200"
                } backdrop-blur-md rounded-2xl p-6 border shadow-xl transition-all hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-semibold ${
                        darkMode
                          ? "bg-indigo-600/20 text-indigo-400"
                          : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {employee.firstName ? employee.firstName[0].toUpperCase() : ''}
                      {employee.lastName ? employee.lastName[0].toUpperCase() : ''}
                    </div>
                    <div>
                      <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {`${employee.firstName} ${employee.lastName}`}
                      </h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {employee.role}
                        {employee.specialization && ` - ${employee.specialization}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={`space-y-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <div className="flex items-start">
                    <div className="w-20 flex-shrink-0 font-medium">{t('email')}:</div>
                    <div className="flex-1">{employee.email}</div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-20 flex-shrink-0 font-medium">{t('phone')}:</div>
                    <div className="flex-1">{employee.phone}</div>
                  </div>
                  {employee.hiringDate && (
                    <div className="flex items-start">
                      <div className="w-20 flex-shrink-0 font-medium">{t('hired')}:</div>
                      <div className="flex-1">
                        {new Date(employee.hiringDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {employee.rate && (
                    <div className="flex items-start">
                      <div className="w-20 flex-shrink-0 font-medium">{t('rate')}:</div>
                      <div className="flex-1">
                        {employee.rate} {employee.currency || "EGP"}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`flex justify-end space-x-2 mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <Link
                    href={`/dashboard/employees/edit/${employee._id}`}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      darkMode
                        ? "text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20"
                        : "text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100"
                    }`}
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    {t('edit')}
                  </Link>
                  <button
                    onClick={() => handleDeleteEmployee(employee._id)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      darkMode
                        ? "text-red-400 hover:text-red-300 bg-red-600/10 hover:bg-red-600/20"
                        : "text-red-600 hover:text-red-500 bg-red-50 hover:bg-red-100"
                    }`}
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      {employeeToDelete && (
        <DeleteConfirmationDialog
          isOpen={employeeToDelete !== null}
          isDeleting={isDeleting}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title={t("confirm_delete")}
          message={t("delete_employee_confirmation")}
          confirmButtonText={t("delete")}
          cancelButtonText={t("cancel")}
        />
      )}
    </div>
  );
} 