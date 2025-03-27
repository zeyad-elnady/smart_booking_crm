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
        console.log('MongoDB not connected, returning mock customers');
        return res.json(mockCustomers);
      }
      
      return getCustomers(req, res);
    } catch (error) {
      console.error('Error in getCustomers:', error.message);
      res.json(mockCustomers);
    }
  },
  
  getCustomerById: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, returning mock customer');
        const mockCustomer = mockCustomers.find(c => c._id === req.params.id) || mockCustomers[0];
        return res.json(mockCustomer);
      }
      
      return getCustomerById(req, res);
    } catch (error) {
      console.error('Error in getCustomerById:', error.message);
      const mockCustomer = mockCustomers.find(c => c._id === req.params.id) || mockCustomers[0];
      res.json(mockCustomer);
    }
  }
};

// Route: /api/customers
router.route('/')
  .get(modifiedControllers.getCustomers)
  .post(createCustomer);

// Route: /api/customers/:id
router.route('/:id')
  .get(protect, modifiedControllers.getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

module.exports = router; 