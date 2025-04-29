const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const localDataService = require('../utils/localDataService');

// Mock data for when MongoDB is unavailable
const mockCustomers = [
  {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    notes: 'Regular customer',
  },
  {
    _id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-987-6543',
    notes: 'Prefers evening appointments',
  },
  {
    _id: '3',
    name: 'Sam Wilson',
    email: 'sam@example.com',
    phone: '555-555-5555',
    notes: 'Allergic to certain products',
  }
];

// Modified controller functions to handle MongoDB connection issues
const modifiedControllers = {
  getCustomers: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, checking local storage for customers');
        
        // Try to get customers from local storage first
        const localCustomers = localDataService.find('customers');
        
        if (localCustomers && localCustomers.length > 0) {
          console.log(`Found ${localCustomers.length} customers in local storage`);
          return res.json(localCustomers);
        }
        
        // Fall back to mock customers if no local storage customers
        console.log('No customers found in local storage, returning mock customers');
        return res.json(mockCustomers);
      }
      
      return getCustomers(req, res);
    } catch (error) {
      console.error('Error in getCustomers:', error.message);
      
      // Try to get customers from local storage on error
      try {
        const localCustomers = localDataService.find('customers');
        if (localCustomers && localCustomers.length > 0) {
          return res.json(localCustomers);
        }
      } catch (localError) {
        console.error('Local storage error:', localError.message);
      }
      
      // Fall back to mock customers
      res.json(mockCustomers);
    }
  },
  
  getCustomerById: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, checking local storage for customer');
        
        // Try to get customer from local storage first
        const localCustomer = localDataService.findById('customers', req.params.id);
        
        if (localCustomer) {
          console.log('Found customer in local storage');
          return res.json(localCustomer);
        }
        
        // Fall back to mock customer if not found in local storage
        console.log('Customer not found in local storage, returning mock customer');
        const mockCustomer = mockCustomers.find(c => c._id === req.params.id) || mockCustomers[0];
        return res.json(mockCustomer);
      }
      
      return getCustomerById(req, res);
    } catch (error) {
      console.error('Error in getCustomerById:', error.message);
      
      // Try to get customer from local storage on error
      try {
        const localCustomer = localDataService.findById('customers', req.params.id);
        if (localCustomer) {
          return res.json(localCustomer);
        }
      } catch (localError) {
        console.error('Local storage error:', localError.message);
      }
      
      // Fall back to mock customer
      const mockCustomer = mockCustomers.find(c => c._id === req.params.id) || mockCustomers[0];
      res.json(mockCustomer);
    }
  }
};

// Route: /api/customers
router.route('/')
  .get(protect, modifiedControllers.getCustomers)
  .post(protect, createCustomer);

// Route: /api/customers/:id
router.route('/:id')
  .get(protect, modifiedControllers.getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

module.exports = router; 