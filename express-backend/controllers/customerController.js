const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    // Check MongoDB connection state
    const mongooseState = require('mongoose').connection.readyState;
    if (mongooseState !== 1) {
      console.log('MongoDB disconnected, returning mock customers');
      // Return mock customers for testing when database is unavailable
      return res.json([
        {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-123-4567',
          notes: 'Mock customer 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '555-987-6543',
          notes: 'Mock customer 2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
    
    const customers = await Customer.find({});
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    // Check MongoDB connection state
    const mongooseState = require('mongoose').connection.readyState;
    if (mongooseState !== 1) {
      console.log('MongoDB disconnected, using mock data');
      // Generate a mock customer with a random ID
      const mockId = Math.floor(Math.random() * 1000000).toString();
      const { firstName, lastName, email, phone, notes } = req.body;
      
      // Return a mock customer response
      return res.status(201).json({
        _id: mockId,
        firstName,
        lastName,
        email,
        phone,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    const { firstName, lastName, email, phone, notes } = req.body;
    
    // Check if customer with this email already exists
    const customerExists = await Customer.findOne({ email });
    
    if (customerExists) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }
    
    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      phone,
      notes,
    });
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, notes } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // If email is changed, check if the new email is already in use
    if (email && email !== customer.email) {
      const customerExists = await Customer.findOne({ email });
      
      if (customerExists) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
    }
    
    customer.firstName = firstName || customer.firstName;
    customer.lastName = lastName || customer.lastName;
    customer.email = email || customer.email;
    customer.phone = phone !== undefined ? phone : customer.phone;
    customer.notes = notes !== undefined ? notes : customer.notes;
    
    const updatedCustomer = await customer.save();
    
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await customer.deleteOne();
    
    res.json({ message: 'Customer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
}; 