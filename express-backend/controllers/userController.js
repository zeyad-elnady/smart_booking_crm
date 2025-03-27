const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

// Mock user data for local development
let users = {
  '1': {
    _id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$eLHs4cL5zUJxpK1rXX1pouR.5QpOQOyZyJXPP8gA9NHxjzJMXZ/Ya', // password123
    businessName: 'Test Business',
    businessType: 'Hair Salon',
    role: 'admin'
  }
};

// Generate a simple mock token for local development
const generateMockToken = (id) => {
  return `mock_token_${id}_${Date.now()}`;
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'abc123', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, businessName, businessType } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  try {
    // Check for user existence in mock DB
    if (Object.values(users).some((user) => user.email === email)) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user ID
    const userId = Date.now().toString();

    // Create user
    const user = {
      _id: userId,
      name,
      email,
      password: hashedPassword,
      businessName: businessName || '',
      businessType: businessType || '',
      role: 'user'
    };

    // Store user in mock DB
    users[userId] = user;

    // Return user data
    const token = generateMockToken(userId);
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      businessType: user.businessType,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(400);
    throw new Error(error.message || 'Registration failed');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  console.log('Login attempt for:', req.body.email);
  
  const { email, password } = req.body;

  // Check if required fields are provided
  if (!email || !password) {
    console.log('Login failed: Missing required fields');
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    // Find user by email in mock DB
    const user = Object.values(users).find((user) => user.email === email);

    if (!user) {
      console.log('Login failed: User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('Checking password for user:', email);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Login failed: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateMockToken(user._id);
    console.log('Login successful for user:', email, 'Token:', token.substring(0, 20) + '...');

    // Log all available users for debugging
    console.log('All available users:', Object.keys(users).map(id => ({
      id,
      email: users[id].email
    })));

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      businessType: user.businessType,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  if (req.user && req.user._id) {
    const user = users[req.user._id];
    
    if (user) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessType: user.businessType,
        role: user.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  if (req.user && req.user._id) {
    const user = users[req.user._id];
    
    if (user) {
      user.name = req.body.name || user.name;
      user.businessName = req.body.businessName || user.businessName;
      user.businessType = req.body.businessType || user.businessType;
      
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, 10);
      }
      
      users[req.user._id] = user;
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessType: user.businessType,
        role: user.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized');
  }
});

// Get all users for testing purposes
const getAllUsers = asyncHandler(async (req, res) => {
  const safeUsers = Object.values(users).map(user => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    businessType: user.businessType,
    role: user.role,
  }));
  
  res.status(200).json(safeUsers);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  getAllUsers,
}; 