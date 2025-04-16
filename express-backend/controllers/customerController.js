const Customer = require('../models/Customer');
const localDataService = require('../utils/localDataService');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (localDataService.isMongoConnected()) {
      const customers = await Customer.find({});
      return res.json(customers);
    } else {
      // Use local data service as fallback
      console.log('MongoDB disconnected, using local data storage');
      const customers = localDataService.find('customers');
      return res.json(customers);
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Fallback to local data even on error
    const customers = localDataService.find('customers');
    return res.json(customers);
  }
};

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Check if MongoDB is connected
    if (localDataService.isMongoConnected()) {
      const customer = await Customer.findById(customerId);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      return res.json(customer);
    } else {
      // Use local data service as fallback
      console.log('MongoDB disconnected, using local data storage');
      const customer = localDataService.findById('customers', customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
      return res.json(customer);
    }
  } catch (error) {
    console.error('Error fetching customer:', error);
    
    // Try to fetch from local storage on error
    const customer = localDataService.findById('customers', req.params.id);
    
    if (customer) {
      return res.json(customer);
    }
    
    return res.status(404).json({ message: 'Customer not found' });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, notes } = req.body;
    
    // Check if MongoDB is connected
    if (localDataService.isMongoConnected()) {
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
        user: req.user ? req.user._id : null, // Associate with user if available
      });
      
      // Also save to local storage for redundancy
      localDataService.create('customers', {
        firstName,
        lastName,
        email,
        phone,
        notes,
        user: req.user ? req.user._id : null,
        _id: customer._id.toString(),
      });
      
      return res.status(201).json(customer);
    } else {
      // Use local data service as fallback
      console.log('MongoDB disconnected, using local data storage');
      
      // Check if customer with this email already exists in local storage
      const customers = localDataService.find('customers', { email });
      
      if (customers.length > 0) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
      
      const newCustomer = localDataService.create('customers', {
        firstName,
        lastName,
        email,
        phone,
        notes,
        user: req.user ? req.user._id : null,
      });
      
      return res.status(201).json(newCustomer);
    }
  } catch (error) {
    console.error('Customer creation error:', error);
    
    // Try to create in local storage on error
    try {
      const { firstName, lastName, email, phone, notes } = req.body;
      
      // Check if customer with this email already exists in local storage
      const customers = localDataService.find('customers', { email });
      
      if (customers.length > 0) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
      
      const newCustomer = localDataService.create('customers', {
        firstName,
        lastName,
        email,
        phone,
        notes,
        user: req.user ? req.user._id : null,
      });
      
      return res.status(201).json(newCustomer);
    } catch (localError) {
      return res.status(400).json({ message: error.message });
    }
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, notes } = req.body;
    const customerId = req.params.id;
    
    // Check if MongoDB is connected
    if (localDataService.isMongoConnected()) {
      const customer = await Customer.findById(customerId);
    
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
    
      // Also update in local storage for redundancy
      localDataService.update('customers', customerId, {
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        notes: updatedCustomer.notes,
      });
      
      return res.json(updatedCustomer);
    } else {
      // Use local data service as fallback
      console.log('MongoDB disconnected, using local data storage');
      
      const customer = localDataService.findById('customers', customerId);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // If email is changed, check if the new email is already in use
      if (email && email !== customer.email) {
        const customers = localDataService.find('customers', { email });
        
        if (customers.length > 0) {
          return res.status(400).json({ message: 'Customer with this email already exists' });
        }
      }
      
      const updatedCustomer = localDataService.update('customers', customerId, {
        firstName: firstName || customer.firstName,
        lastName: lastName || customer.lastName,
        email: email || customer.email,
        phone: phone !== undefined ? phone : customer.phone,
        notes: notes !== undefined ? notes : customer.notes,
      });
      
      return res.json(updatedCustomer);
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    
    // Try to update in local storage on error
    try {
      const { firstName, lastName, email, phone, notes } = req.body;
      const customerId = req.params.id;
      
      const customer = localDataService.findById('customers', customerId);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      const updatedCustomer = localDataService.update('customers', customerId, {
        firstName: firstName || customer.firstName,
        lastName: lastName || customer.lastName,
        email: email || customer.email,
        phone: phone !== undefined ? phone : customer.phone,
        notes: notes !== undefined ? notes : customer.notes,
      });
      
      return res.json(updatedCustomer);
    } catch (localError) {
      return res.status(400).json({ message: error.message });
    }
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Check if MongoDB is connected
    if (localDataService.isMongoConnected()) {
      const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await customer.deleteOne();
    
      // Also delete from local storage for consistency
      localDataService.remove('customers', customerId);
      
      return res.json({ message: 'Customer removed' });
    } else {
      // Use local data service as fallback
      console.log('MongoDB disconnected, using local data storage');
      
      const customer = localDataService.findById('customers', customerId);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      const success = localDataService.remove('customers', customerId);
      
      if (!success) {
        return res.status(400).json({ message: 'Error removing customer' });
      }
      
      return res.json({ message: 'Customer removed' });
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    // Try to delete from local storage on error
    try {
      const customerId = req.params.id;
      
      const success = localDataService.remove('customers', customerId);
      
      if (!success) {
        return res.status(400).json({ message: 'Error removing customer' });
      }
      
      return res.json({ message: 'Customer removed' });
    } catch (localError) {
      return res.status(400).json({ message: error.message });
    }
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
}; 