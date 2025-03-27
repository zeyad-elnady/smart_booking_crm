const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      console.log('Auth token received:', token.substring(0, 10) + '...');
      
      // Check if it's a mock token (for local development without MongoDB)
      if (token.startsWith('mock_token_')) {
        console.log('Processing mock token');
        const parts = token.split('_');
        if (parts.length >= 3) {
          const mockUserId = parts[2]; // Extract user ID from mock token
          
          console.log('Mock token user ID:', mockUserId);
          
          // Create a simple user object with the id
          req.user = {
            _id: mockUserId,
            name: 'Mock User',
            email: 'mock@example.com',
            role: 'user'
          };
          
          next();
          return;
        } else {
          console.error('Invalid mock token format:', token);
          return res.status(401).json({ message: 'Not authorized, invalid mock token format' });
        }
      }
      
      // Verify real JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abc123');
      
      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
  } else {
    console.error('No authorization token found in request');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin }; 