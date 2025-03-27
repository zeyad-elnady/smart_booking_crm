const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect, admin } = require('../middleware/authMiddleware');

// Mock data storage - services are now stored by user ID
const mockServicesStore = {
  // Default admin user services
  '1': [
    {
      _id: '1',
      name: 'Haircut',
      description: 'Professional haircut service',
      duration: '30 minutes',
      price: '$30',
      category: 'Hair',
      isActive: true,
      userId: '1'
    },
    {
      _id: '2',
      name: 'Manicure',
      description: 'Nail care treatment for hands',
      duration: '45 minutes',
      price: '$25',
      category: 'Nails',
      isActive: true,
      userId: '1'
    },
    {
      _id: '3',
      name: 'Facial',
      description: 'Deep cleansing facial treatment',
      duration: '60 minutes',
      price: '$50',
      category: 'Skin',
      isActive: true,
      userId: '1'
    }
  ]
  // New users will get their entry created when they register or access services
};

// Modified controller functions to handle MongoDB connection issues
const modifiedControllers = {
  getServices: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, returning mock data');
        
        // Get user ID from the authenticated user
        const userId = req.user?._id || '1'; // Default to admin if no user
        
        // Get services for this user or initialize empty array
        const userServices = mockServicesStore[userId] || [];
        
        // If this is a new user with no services, initialize their store
        if (!mockServicesStore[userId]) {
          mockServicesStore[userId] = [];
        }
        
        return res.json(userServices);
      }
      
      return getServices(req, res);
    } catch (error) {
      console.error('Error in getServices:', error.message);
      res.json([]);
    }
  },
  
  getServiceById: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, returning mock service');
        
        const userId = req.user?._id || '1'; // Default to admin if no user
        const userServices = mockServicesStore[userId] || [];
        
        const mockService = userServices.find(s => s._id === req.params.id);
        
        if (mockService) {
          return res.json(mockService);
        } else {
          return res.status(404).json({ message: 'Service not found' });
        }
      }
      
      return getServiceById(req, res);
    } catch (error) {
      console.error('Error in getServiceById:', error.message);
      res.status(404).json({ message: 'Service not found' });
    }
  },
  
  createService: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, creating mock service');
        
        const userId = req.user?._id || '1'; // Default to admin if no user
        
        // Initialize user's services if this is their first
        if (!mockServicesStore[userId]) {
          mockServicesStore[userId] = [];
        }
        
        // Create a new service with unique ID
        const newService = {
          _id: `service_${Date.now()}`,
          ...req.body,
          userId: userId
        };
        
        // Add to user's services
        mockServicesStore[userId].push(newService);
        
        return res.status(201).json(newService);
      }
      
      return createService(req, res);
    } catch (error) {
      console.error('Error in createService:', error.message);
      res.status(400).json({ message: error.message });
    }
  },
  
  updateService: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, updating mock service');
        
        const userId = req.user?._id || '1'; // Default to admin if no user
        
        // Get user's services
        if (!mockServicesStore[userId]) {
          return res.status(404).json({ message: 'Service not found' });
        }
        
        // Find the service to update
        const serviceIndex = mockServicesStore[userId].findIndex(s => s._id === req.params.id);
        
        if (serviceIndex === -1) {
          return res.status(404).json({ message: 'Service not found' });
        }
        
        // Update the service
        mockServicesStore[userId][serviceIndex] = {
          ...mockServicesStore[userId][serviceIndex],
          ...req.body,
          _id: req.params.id, // Ensure ID doesn't change
          userId: userId // Ensure userId doesn't change
        };
        
        return res.json(mockServicesStore[userId][serviceIndex]);
      }
      
      return updateService(req, res);
    } catch (error) {
      console.error('Error in updateService:', error.message);
      res.status(400).json({ message: error.message });
    }
  },
  
  deleteService: async (req, res) => {
    try {
      // Check if MongoDB is connected
      if (require('mongoose').connection.readyState !== 1) {
        console.log('MongoDB not connected, deleting mock service');
        
        const userId = req.user?._id || '1'; // Default to admin if no user
        
        // Get user's services
        if (!mockServicesStore[userId]) {
          return res.status(404).json({ message: 'Service not found' });
        }
        
        // Find the service to delete
        const serviceIndex = mockServicesStore[userId].findIndex(s => s._id === req.params.id);
        
        if (serviceIndex === -1) {
          return res.status(404).json({ message: 'Service not found' });
        }
        
        // Remove the service
        mockServicesStore[userId].splice(serviceIndex, 1);
        
        return res.json({ message: 'Service removed' });
      }
      
      return deleteService(req, res);
    } catch (error) {
      console.error('Error in deleteService:', error.message);
      res.status(500).json({ message: error.message });
    }
  }
};

// Route: /api/services
router.route('/')
  .get(protect, modifiedControllers.getServices)
  .post(protect, modifiedControllers.createService);

// Route: /api/services/:id
router.route('/:id')
  .get(protect, modifiedControllers.getServiceById)
  .put(protect, modifiedControllers.updateService)
  .delete(protect, modifiedControllers.deleteService);

module.exports = router; 