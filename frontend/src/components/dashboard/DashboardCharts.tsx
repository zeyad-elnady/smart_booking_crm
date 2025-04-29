import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider';
import { ChevronDownIcon, PencilIcon } from '@heroicons/react/24/outline';

// Define the type for revenue trend period
type RevenueTrendPeriod = 'week' | 'month' | 'year';

// Define the interface for the component props
interface DashboardChartsProps {
  revenueData: {
    name: string;
    value: number;
  }[];
  appointmentsByStatus: {
    name: string;
    value: number;
    color: string;
  }[];
  weeklyRevenue: {
    day: string;
    revenue: number;
  }[];
  servicePopularity: {
    name: string;
    value: number;
    color: string;
  }[];
  revenueTrendPeriod: RevenueTrendPeriod;
  setRevenueTrendPeriod: (period: RevenueTrendPeriod) => void;
  darkMode?: boolean;
  monthlyNewCustomers: number;
  confirmedAppointmentsRevenue: number;
  onServiceColorChange?: (serviceColors: { [key: string]: string }) => void;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  revenueData,
  appointmentsByStatus,
  weeklyRevenue,
  servicePopularity,
  revenueTrendPeriod,
  setRevenueTrendPeriod,
  darkMode: propDarkMode,
  monthlyNewCustomers,
  confirmedAppointmentsRevenue,
  onServiceColorChange
}) => {
  const themeContext = useTheme();
  const darkMode = propDarkMode !== undefined ? propDarkMode : themeContext.darkMode;
  
  // Add debugging for the incoming data
  useEffect(() => {
    console.log(`DashboardCharts received weeklyRevenue data: `, weeklyRevenue);
    console.log(`Current revenue trend period: ${revenueTrendPeriod}`);
    console.log(`Confirmed appointments revenue: ${confirmedAppointmentsRevenue}`);
    
    // Check if we have any non-zero values in the data
    const totalRevenue = weeklyRevenue.reduce((sum, item) => sum + item.revenue, 0);
    console.log(`Total revenue in chart data: ${totalRevenue}`);
  }, [weeklyRevenue, revenueTrendPeriod, confirmedAppointmentsRevenue]);
  
  const [periodDropdown, setPeriodDropdown] = useState<boolean>(false);
  const [showGoalEdit, setShowGoalEdit] = useState<boolean>(false);
  const [showServiceColorEdit, setShowServiceColorEdit] = useState<boolean>(false);
  const [serviceColors, setServiceColors] = useState<{ [key: string]: string }>({});
  
  // Get display name for the trend period
  const getTrendPeriodName = (): string => {
    switch (revenueTrendPeriod) {
      case 'week':
        return 'Weekly';
      case 'month':
        return 'Monthly'; 
      case 'year':
        return 'Yearly';
      default:
        return 'Weekly';
    }
  };
  
  // Define colors based on theme
  const textColor = darkMode ? '#CBD5E1' : '#1E293B';
  const gridColor = darkMode ? '#334155' : '#E2E8F0';
  const backgroundColor = darkMode ? '#1E293B' : '#FFFFFF';
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A267AC', '#6699CC'];

  // Add a useEffect for handling clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPeriodDropdown(false);
      }
      if (showGoalEdit && goalEditRef.current && !goalEditRef.current.contains(event.target as Node)) {
        setShowGoalEdit(false);
      }
      if (showServiceColorEdit && serviceColorEditRef.current && !serviceColorEditRef.current.contains(event.target as Node)) {
        setShowServiceColorEdit(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [periodDropdown, showGoalEdit, showServiceColorEdit]);

  // Add a ref for the dropdown container
  const dropdownRef = useRef<HTMLDivElement>(null);
  const goalEditRef = useRef<HTMLDivElement>(null);
  const serviceColorEditRef = useRef<HTMLDivElement>(null);

  // Update the onClick function to prevent event propagation
  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPeriodDropdown(!periodDropdown);
  };

  // Handle edit goals click
  const handleEditGoalsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGoalEdit(!showGoalEdit);
  };
  
  // Handle edit service colors click
  const handleEditServiceColorsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowServiceColorEdit(!showServiceColorEdit);
    
    // Initialize serviceColors state from current data if empty
    if (Object.keys(serviceColors).length === 0) {
      const initialColors: { [key: string]: string } = {};
      servicePopularity.forEach(service => {
        initialColors[service.name] = service.color;
      });
      setServiceColors(initialColors);
    }
  };
  
  // Handle color change for a service
  const handleServiceColorChange = (service: string, color: string) => {
    const updatedColors = { ...serviceColors };
    updatedColors[service] = color;
    setServiceColors(updatedColors);
    
    // Call the prop function if it exists
    if (onServiceColorChange) {
      onServiceColorChange(updatedColors);
    }
  };
  
  // Function to get the current color for a service, either from state or from props
  const getServiceColor = (serviceName: string, index: number): string => {
    if (serviceColors[serviceName]) {
      return serviceColors[serviceName];
    }
    
    const entry = servicePopularity.find(s => s.name === serviceName);
    if (entry?.color) {
      return entry.color;
    }
    
    return COLORS[index % COLORS.length];
  };

  // Format the tooltip content for the appointment status chart
  const formatAppointmentTooltip = (value: number, name: string) => {
    return [`${name}: ${value} (${((value / appointmentsByStatus.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%)`];
  };

  // Monthly goals data for the goal tracker
  const goalData = [
    {
      name: 'Total Revenue',
      // Use the direct sum of confirmed appointments revenue
      current: confirmedAppointmentsRevenue,
      target: 1000,
      color: '#3B82F6', // Blue
      unit: '$',
    },
    {
      name: 'Appointments',
      current: appointmentsByStatus.find(item => item.name === 'Completed')?.value || 0,
      target: 25,
      color: '#10B981', // Green
      unit: '',
    },
    {
      name: 'New Customers',
      // Use the actual count of new customers from props
      current: monthlyNewCustomers,
      target: 10,
      color: '#F59E0B', // Amber
      unit: '',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Monthly Goals Progress (replaces Business Health) */}
      <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Monthly Goals
          </h3>
          <div className="relative">
            <button
              onClick={handleEditGoalsClick}
              aria-haspopup="true"
              aria-expanded={showGoalEdit}
              className={`inline-flex items-center justify-center p-1.5 rounded-full transition-colors ${
                darkMode 
                  ? 'hover:bg-slate-700 text-slate-300 hover:text-slate-200' 
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-800'
              }`}
              title="Edit Goals"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            
            {showGoalEdit && (
              <div 
                ref={goalEditRef}
                className={`absolute right-0 top-full mt-1 rounded-md shadow-lg z-[100] ${
                  darkMode ? 'bg-slate-700' : 'bg-white'
                } border ${darkMode ? 'border-slate-600' : 'border-gray-200'} p-3 w-64`}
              >
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Edit Monthly Targets
                </h4>
                <div className="space-y-3">
                  {goalData.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <label className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {goal.name}:
                      </label>
                      <div className="flex items-center">
                        {goal.unit && <span className="text-xs mr-1">{goal.unit}</span>}
                        <input 
                          type="number" 
                          min="0"
                          defaultValue={goal.target}
                          className={`w-16 text-xs py-1 px-2 rounded ${
                            darkMode 
                              ? 'bg-slate-800 border-slate-600 text-slate-200' 
                              : 'bg-white border-gray-300 text-slate-700'
                          } border`}
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    className={`w-full mt-2 py-1.5 rounded text-xs font-medium ${
                      darkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Save Targets
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-64 flex flex-col justify-center space-y-6">
          {goalData.map((goal, index) => {
            const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100);
            return (
              <div key={index} className="w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {goal.name}
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {goal.name === 'Revenue' 
                      ? `${goal.unit}${goal.current.toFixed(2)} / ${goal.unit}${goal.target}`
                      : `${goal.unit}${goal.current} / ${goal.unit}${goal.target}`
                    }
                  </span>
                </div>
                <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div 
                    className="h-3 rounded-full" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: goal.color
                    }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-right" style={{ color: goal.color }}>
                  {percentage}% complete
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Appointment Status Distribution */}
      <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Appointment Status
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={appointmentsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                // Remove the direct labels on the pie slices to avoid overlapping
              >
                {appointmentsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor, color: textColor, border: 'none', borderRadius: '8px' }}
                formatter={formatAppointmentTooltip}
              />
              <Legend 
                formatter={(value, entry, index) => {
                  const item = appointmentsByStatus[index];
                  const total = appointmentsByStatus.reduce((sum, item) => sum + item.value, 0);
                  const percent = total > 0 ? (item.value / total) * 100 : 0;
                  return `${value} ${percent.toFixed(0)}%`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Revenue Trend with period selector inside */}
      <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Revenue Trend
            <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              ({getTrendPeriodName()})
            </span>
          </h3>
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPeriodDropdown(!periodDropdown);
              }}
              aria-haspopup="true"
              aria-expanded={periodDropdown}
              className={`inline-flex items-center text-xs px-2 py-1 rounded ${
                darkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"
              }`}
            >
              {getTrendPeriodName()} <ChevronDownIcon className="h-3 w-3 ml-1" />
            </button>
            
            {periodDropdown && (
              <div 
                className={`fixed mt-1 rounded-md shadow-lg z-[9999] ${
                  darkMode ? "bg-slate-700" : "bg-white"
                } border ${darkMode ? "border-slate-600" : "border-gray-200"} min-w-[120px]`} 
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevenueTrendPeriod('week');
                      setPeriodDropdown(false);
                    }}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      darkMode ? "text-slate-300 hover:bg-slate-600" : "text-gray-700 hover:bg-gray-100"
                    } ${revenueTrendPeriod === 'week' ? darkMode ? "bg-slate-600" : "bg-gray-100" : ""}`}
                  >
                    Weekly
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevenueTrendPeriod('month');
                      setPeriodDropdown(false);
                    }}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      darkMode ? "text-slate-300 hover:bg-slate-600" : "text-gray-700 hover:bg-gray-100"
                    } ${revenueTrendPeriod === 'month' ? darkMode ? "bg-slate-600" : "bg-gray-100" : ""}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevenueTrendPeriod('year');
                      setPeriodDropdown(false);
                    }}
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      darkMode ? "text-slate-300 hover:bg-slate-600" : "text-gray-700 hover:bg-gray-100"
                    } ${revenueTrendPeriod === 'year' ? darkMode ? "bg-slate-600" : "bg-gray-100" : ""}`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyRevenue}
              margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
              key={`revenue-chart-${revenueTrendPeriod}`}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="day" 
                tick={{ fill: textColor }}
                tickLine={{ stroke: gridColor }}
                axisLine={{ stroke: gridColor }}
                label={undefined}
                padding={{ right: 0 }}
              />
              <YAxis 
                tick={{ fill: textColor }} 
                tickLine={{ stroke: gridColor }}
                axisLine={{ stroke: gridColor }}
                label={{ 
                  value: 'EGP',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                  fill: textColor
                }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor, color: textColor, border: 'none', borderRadius: '8px' }}
                formatter={(value) => {
                  console.log(`Tooltip showing value: ${value}`);
                  return [`${value} EGP`, 'Revenue'];
                }}
                labelFormatter={(label, payload) => {
                  if (revenueTrendPeriod === 'week') {
                    const item = payload[0]?.payload;
                    return item?.fullDay || label;
                  }
                  if (revenueTrendPeriod === 'month') {
                    return label;
                  }
                  if (revenueTrendPeriod === 'year') {
                    const item = payload[0]?.payload;
                    return item?.fullMonth || label;
                  }
                  return label;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={revenueTrendPeriod === 'week' ? "#4F46E5" : revenueTrendPeriod === 'month' ? "#8B5CF6" : "#EC4899"} 
                fill={revenueTrendPeriod === 'week' ? "#4F46E550" : revenueTrendPeriod === 'month' ? "#8B5CF650" : "#EC489950"} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Service Popularity */}
      <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            Service Popularity
          </h3>
          <div className="relative">
            <button
              onClick={handleEditServiceColorsClick}
              aria-haspopup="true"
              aria-expanded={showServiceColorEdit}
              className={`inline-flex items-center justify-center p-1.5 rounded-full transition-colors ${
                darkMode 
                  ? 'hover:bg-slate-700 text-slate-300 hover:text-slate-200' 
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-800'
              }`}
              title="Edit Service Colors"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            
            {showServiceColorEdit && (
              <div 
                ref={serviceColorEditRef}
                className={`absolute right-0 top-full mt-1 rounded-md shadow-lg z-[100] ${
                  darkMode ? 'bg-slate-700' : 'bg-white'
                } border ${darkMode ? 'border-slate-600' : 'border-gray-200'} p-3 w-64`}
              >
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Edit Service Colors
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {servicePopularity.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`text-xs flex-grow truncate mr-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {service.name}:
                      </span>
                      <div className="flex items-center">
                        <input 
                          type="color" 
                          value={getServiceColor(service.name, index)}
                          onChange={(e) => handleServiceColorChange(service.name, e.target.value)}
                          className="w-8 h-6 cursor-pointer rounded border-0"
                        />
                        <div 
                          className="ml-2 w-4 h-4 rounded-full" 
                          style={{ backgroundColor: getServiceColor(service.name, index) }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={servicePopularity}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                type="number" 
                tick={{ fill: textColor }} 
                tickFormatter={(value) => Math.floor(value).toString()} // Format ticks as integers
                domain={[0, 'dataMax']} // Set domain from 0 to the maximum value
                allowDecimals={false} // Prevent decimal ticks
              />
              <YAxis dataKey="name" type="category" tick={{ fill: textColor }} width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor, color: textColor, border: 'none', borderRadius: '8px' }}
                formatter={(value: any) => [Math.floor(Number(value)), 'Usage']} // Format tooltip values as integers
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {servicePopularity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getServiceColor(entry.name, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts; 