'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { authAPI, serviceAPI, type ServiceData } from '@/services/api';
import SignOutButton from '@/components/SignOutButton';

// Business types
const BUSINESS_TYPES = [
  'Hair Salon',
  'Barbershop',
  'Nail Salon',
  'Spa',
  'Massage Therapy',
  'Beauty Salon',
  'Wellness Center',
  'Fitness Studio',
  'Consultation Services',
  'Other'
];

// Default service categories by business type
const DEFAULT_CATEGORIES = {
  'Hair Salon': ['Haircut', 'Color', 'Treatment', 'Styling'],
  'Barbershop': ['Haircut', 'Beard Trim', 'Shave', 'Styling'],
  'Nail Salon': ['Manicure', 'Pedicure', 'Nail Art', 'Nail Extensions'],
  'Spa': ['Facial', 'Massage', 'Body Treatment', 'Waxing'],
  'Massage Therapy': ['Swedish Massage', 'Deep Tissue', 'Hot Stone', 'Sports Massage'],
  'Beauty Salon': ['Makeup', 'Facial', 'Waxing', 'Lash Extensions'],
  'Wellness Center': ['Consultation', 'Therapy', 'Nutrition', 'Assessment'],
  'Fitness Studio': ['Personal Training', 'Group Class', 'Assessment', 'Consultation'],
  'Consultation Services': ['Initial Consultation', 'Follow-up', 'Special Session', 'Assessment'],
  'Other': ['Service 1', 'Service 2', 'Service 3', 'Service 4']
};

// Default services by category
const getDefaultServices = (categories: string[], businessType: string) => {
  const services: ServiceData[] = [];
  
  categories.forEach((category) => {
    // Generate 1-3 default services for each selected category
    if (category === 'Haircut' && (businessType === 'Hair Salon' || businessType === 'Barbershop')) {
      services.push({
        name: 'Basic Haircut',
        description: 'A standard haircut service',
        duration: '30',
        price: '25',
        category,
        isActive: true
      });
      services.push({
        name: 'Premium Haircut',
        description: 'Includes wash, cut, and style',
        duration: '45',
        price: '40',
        category,
        isActive: true
      });
    } else if (category === 'Color' && businessType === 'Hair Salon') {
      services.push({
        name: 'Root Touch-up',
        description: 'Color application on roots only',
        duration: '60',
        price: '65',
        category,
        isActive: true
      });
      services.push({
        name: 'Full Color',
        description: 'Full head color application',
        duration: '90',
        price: '85',
        category,
        isActive: true
      });
    } else if (category === 'Facial' && (businessType === 'Spa' || businessType === 'Beauty Salon')) {
      services.push({
        name: 'Express Facial',
        description: 'Quick facial treatment',
        duration: '30',
        price: '40',
        category,
        isActive: true
      });
      services.push({
        name: 'Deep Cleansing Facial',
        description: 'Thorough facial with extractions',
        duration: '60',
        price: '75',
        category,
        isActive: true
      });
    } else if (category === 'Massage' && businessType === 'Spa') {
      services.push({
        name: 'Relaxation Massage',
        description: 'Gentle massage for relaxation',
        duration: '60',
        price: '80',
        category,
        isActive: true
      });
    } else if (category === 'Manicure' && businessType === 'Nail Salon') {
      services.push({
        name: 'Basic Manicure',
        description: 'Filing, cuticle care, and polish',
        duration: '30',
        price: '25',
        category,
        isActive: true
      });
      services.push({
        name: 'Gel Manicure',
        description: 'Long-lasting gel polish application',
        duration: '45',
        price: '40',
        category,
        isActive: true
      });
    } else {
      // Generic service for other categories
      services.push({
        name: `Standard ${category}`,
        description: `Regular ${category.toLowerCase()} service`,
        duration: '30',
        price: '40',
        category,
        isActive: true
      });
    }
  });
  
  return services;
};

const Register = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Check if the user is already logged in on component mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check authentication status after mounting
  useEffect(() => {
    if (mounted) {
      const user = authAPI.getCurrentUser();
      if (user) {
        setIsLoggedIn(true);
        setDebugInfo('User already logged in');
      }
    }
  }, [mounted]);
  
  // Step 1: Account data
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Step 2: Business data
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessType: BUSINESS_TYPES[0]
  });
  
  // Step 3: Service categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Step 4: Default services
  const [defaultServices, setDefaultServices] = useState<ServiceData[]>([]);
  
  // Update service categories when business type changes
  useEffect(() => {
    if (businessData.businessType) {
      setSelectedCategories(DEFAULT_CATEGORIES[businessData.businessType as keyof typeof DEFAULT_CATEGORIES] || []);
    }
  }, [businessData.businessType]);
  
  // Update default services when categories change
  useEffect(() => {
    if (selectedCategories.length > 0 && businessData.businessType) {
      setDefaultServices(getDefaultServices(selectedCategories, businessData.businessType));
    }
  }, [selectedCategories, businessData.businessType]);
  
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData({ ...accountData, [name]: value });
  };
  
  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessData({ ...businessData, [name]: value });
  };
  
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  const handleServiceChange = (index: number, field: keyof ServiceData, value: string | boolean) => {
    const updatedServices = [...defaultServices];
    updatedServices[index] = { 
      ...updatedServices[index], 
      [field]: value 
    };
    setDefaultServices(updatedServices);
  };
  
  const goToNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!accountData.name || !accountData.email || !accountData.password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (accountData.password !== accountData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (accountData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    } else if (currentStep === 2) {
      if (!businessData.businessName) {
        setError('Please enter your business name.');
        return;
      }
    } else if (currentStep === 3) {
      if (selectedCategories.length === 0) {
        setError('Please select at least one service category.');
        return;
      }
    }
    
    setError(null);
    setCurrentStep(currentStep + 1);
  };
  
  const goToPreviousStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugInfo('Starting registration process...');
    
    try {
      // 1. Register the user account
      setDebugInfo('Registering user account...');
      const userData = await authAPI.register({
        name: accountData.name,
        email: accountData.email,
        password: accountData.password,
        businessName: businessData.businessName,
        businessType: businessData.businessType
      });
      
      setDebugInfo(`User registered successfully! User ID: ${userData._id}`);
      
      // 2. Create the default services
      if (defaultServices.length > 0) {
        setDebugInfo('Creating default services...');
        
        try {
          // Create services sequentially
          for (const service of defaultServices) {
            if (service.name && service.category) {
              await serviceAPI.createService(service);
            }
          }
          setDebugInfo('Default services created successfully!');
        } catch (serviceError: any) {
          console.error('Error creating services:', serviceError);
          setDebugInfo(`Error creating services: ${serviceError.message || 'Unknown error'}`);
          // Continue with registration even if service creation fails
        }
      }
      
      // 3. Redirect to dashboard
      setDebugInfo('Registration complete! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      let debugMessage = 'Registration error details: ';
      
      if (error.response) {
        // API error response
        debugMessage += `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Network error
        debugMessage += 'Network error - no response received';
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Request error
        debugMessage += `Request error: ${error.message}`;
        errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      setDebugInfo(debugMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    // Clear credentials
    authAPI.logout();
    
    // Update component state
    setIsLoggedIn(false);
    setDebugInfo('Logged out successfully');
    
    // Force an immediate and complete page reload/redirect
    window.location.replace('/login');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  // If user is already logged in, show a different view
  if (mounted && isLoggedIn) {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="glass border border-white/10 rounded-xl shadow-xl p-8 max-w-md w-full space-y-8 animate-fadeIn">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 gradient-text">You're already registered!</h2>
            <p className="mb-8 text-gray-300">
              You already have an account with Smart Booking CRM. Would you like to continue to your dashboard or sign out?
            </p>
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleGoToDashboard}
                className="glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 w-full"
              >
                Go to Dashboard
              </button>
              <SignOutButton className="w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderAccountForm();
        
      case 2:
        return renderBusinessForm();
        
      case 3:
        return renderServiceCategories();
        
      case 4:
        return renderDefaultServices();
        
      case 5:
        return renderConfirmation();
        
      default:
        return null;
    }
  };
  
  // Render account creation form (step 1)
  const renderAccountForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold gradient-text">Create Your Account</h2>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={accountData.name}
          onChange={handleAccountChange}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-800/50 text-gray-100 placeholder-gray-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={accountData.email}
          onChange={handleAccountChange}
          placeholder="Enter your email"
          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-800/50 text-gray-100 placeholder-gray-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
        <input
          type="password"
          name="password"
          value={accountData.password}
          onChange={handleAccountChange}
          placeholder="Enter your password"
          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-800/50 text-gray-100 placeholder-gray-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={accountData.confirmPassword}
          onChange={handleAccountChange}
          placeholder="Confirm your password"
          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-800/50 text-gray-100 placeholder-gray-500"
          required
        />
      </div>
    </div>
  );
  
  // Render business setup form (step 2)
  const renderBusinessForm = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold gradient-text">Tell Us About Your Business</h2>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
        <input
          type="text"
          name="businessName"
          value={businessData.businessName}
          onChange={handleBusinessChange}
          placeholder="Enter your business name"
          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-800/50 text-gray-100 placeholder-gray-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Business Type</label>
        <select
          name="businessType"
          value={businessData.businessType}
          onChange={handleBusinessChange}
          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-800/50 text-gray-100"
        >
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
  
  // Render service categories selection (step 3)
  const renderServiceCategories = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold gradient-text">Select Your Service Categories</h2>
      <p className="text-sm text-gray-300 mb-4">
        These categories will help organize your services. You can add more later.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {DEFAULT_CATEGORIES[businessData.businessType as keyof typeof DEFAULT_CATEGORIES]?.map((category) => (
          <div 
            key={category} 
            onClick={() => handleCategoryToggle(category)}
            className={`glass p-3 rounded-lg cursor-pointer transition-all ${
              selectedCategories.includes(category) 
                ? 'border-2 border-indigo-500' 
                : 'border border-white/10 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center">
              <div className={`h-4 w-4 rounded-md mr-2 flex items-center justify-center ${
                selectedCategories.includes(category) ? 'bg-indigo-500' : 'border border-gray-400'
              }`}>
                {selectedCategories.includes(category) && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm">{category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render default services selection (step 4)
  const renderDefaultServices = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold gradient-text">Review Default Services</h2>
      <p className="text-sm text-gray-300 mb-4">
        We've created some default services for you. You can edit or remove them later.
      </p>
      <div className="space-y-6">
        {defaultServices.map((service, index) => (
          <div key={index} className="glass border border-white/10 p-4 rounded-lg">
            <div className="mb-2">
              <span className="inline-block bg-indigo-600/30 text-indigo-300 text-xs px-2 py-1 rounded-full">
                {service.category}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <input
                type="text"
                value={service.name}
                onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                className="text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 w-full text-white"
                placeholder="Service Name"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={service.duration}
                  onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                  className="w-16 px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800/50 text-gray-100"
                  placeholder="Min"
                />
                <input
                  type="text"
                  value={service.price}
                  onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                  className="w-16 px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800/50 text-gray-100"
                  placeholder="$"
                />
              </div>
            </div>
            <textarea
              value={service.description}
              onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
              className="w-full h-16 px-3 py-2 text-sm border border-gray-600 rounded resize-none bg-gray-800/50 text-gray-100"
              placeholder="Description"
            />
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render confirmation step (step 5)
  const renderConfirmation = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold gradient-text">Ready to Launch Your Business</h2>
      <div className="glass border border-white/10 p-4 rounded-lg">
        <h3 className="font-medium text-white mb-2">Account Summary</h3>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium text-gray-300">Name:</span> {accountData.name}</p>
          <p><span className="font-medium text-gray-300">Email:</span> {accountData.email}</p>
          <p><span className="font-medium text-gray-300">Business:</span> {businessData.businessName}</p>
          <p><span className="font-medium text-gray-300">Business Type:</span> {businessData.businessType}</p>
          <p><span className="font-medium text-gray-300">Service Categories:</span> {selectedCategories.join(', ')}</p>
          <p><span className="font-medium text-gray-300">Default Services:</span> {defaultServices.length}</p>
        </div>
      </div>
      <p className="text-sm text-gray-300">
        Click "Complete Setup" to create your account and set up your business. You'll be able to customize everything later.
      </p>
    </div>
  );
  
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-[#0f1235] to-[#090726] text-white">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-10 filter blur-3xl floating animation-delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-green-400 to-teal-500 opacity-10 filter blur-3xl floating animation-delay-3000"></div>
      </div>

      <div className="w-full max-w-4xl mx-auto my-10 animate-fadeIn">
        <div className="flex flex-col md:flex-row glass border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {/* Left side - Setup Process */}
          <div className="w-full md:w-1/3 bg-gradient-to-br from-purple-600/80 to-blue-600/80 p-8">
            <div className="h-full flex flex-col justify-between">
              <div>
                <h1 className="text-white text-2xl font-bold mb-6 solid-text">Setup Your Business</h1>
                <div className="space-y-4">
                  {[
                    "Create Account",
                    "Business Information",
                    "Service Categories",
                    "Default Services",
                    "Complete Setup"
                  ].map((step, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        currentStep > index + 1 
                          ? 'bg-green-500'
                          : currentStep === index + 1
                            ? 'glass text-white'
                            : 'glass-dark bg-opacity-50'
                      }`}>
                        {currentStep > index + 1 ? (
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <span className={`ml-3 ${
                        currentStep === index + 1 ? 'text-white font-semibold' : 'text-blue-100'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8">
                <p className="text-blue-100 text-sm">
                  Already have an account?
                </p>
                <Link 
                  href="/login" 
                  className="text-indigo-300 font-medium hover:text-white transition-colors"
                >
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="w-full md:w-2/3 p-8 glass-dark bg-opacity-20">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-grow">
                {renderStepContent()}
                
                {error && (
                  <div className="mt-4 glass border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative">
                    {error}
                  </div>
                )}
                
                {debugInfo && (
                  <div className="mt-4 glass border border-gray-500/30 text-gray-300 text-sm px-4 py-3 rounded-lg">
                    <p className="font-medium mb-1">Debug Info:</p>
                    <pre className="text-xs overflow-auto">{debugInfo}</pre>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="flex items-center text-gray-300 hover:text-white transition-all"
                    disabled={loading}
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back
                  </button>
                ) : (
                  <div></div>
                )}
                
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="flex items-center glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-4 py-2 rounded-full transition-all duration-300 hover:scale-105"
                    disabled={loading}
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="glass-dark bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-6 py-2 rounded-full transition-all duration-300 hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 