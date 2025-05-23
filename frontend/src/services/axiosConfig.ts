import axios from "axios";
import { toast } from 'react-hot-toast';
import { indexedDBService } from './indexedDB';

// Helper function to get the API URL
const getApiUrl = () => {
   const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:12345/api";
   console.log("Using API URL:", url);
   return url;
};

// Check if we're in a localhost/development environment
const isLocalDevelopment = () => {
   if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname.includes('192.168.') || 
         window.location.hostname.includes('.local');
   }
   return false;
};

// Create axios instance for API calls
const axiosInstance = axios.create({
   baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12345',
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json'
   }
});

// Create axios instance for Next.js API routes
const nextApiAxios = axios.create({
   baseURL: '/api',
   timeout: 10000,
   headers: {
      'Content-Type': 'application/json'
   }
});

// Add request interceptor
axiosInstance.interceptors.request.use(
   async (config) => {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

// Add response interceptor
const responseInterceptor = axiosInstance.interceptors.response.use(
   (response) => {
      return response;
   },
   async (error) => {
      if (!error.response) {
         // Network error
         toast.error('Network error. Working in offline mode.');
         return Promise.reject(error);
      }
      
      if (error.response.status === 401) {
         // Unauthorized - clear token and redirect to login
         localStorage.removeItem('token');
         window.location.href = '/login';
      }
      
      return Promise.reject(error);
   }
);

// Apply the same response interceptor to nextApiAxios
nextApiAxios.interceptors.response.use(
   (response) => response,
   async (error) => {
      if (!error.response) {
         toast.error('Network error. Working in offline mode.');
         return Promise.reject(error);
      }
      
      if (error.response.status === 401) {
         localStorage.removeItem('token');
         window.location.href = '/login';
      }
      
      return Promise.reject(error);
   }
);

export { axiosInstance as default, nextApiAxios };
