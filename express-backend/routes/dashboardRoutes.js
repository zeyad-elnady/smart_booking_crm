const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Mock data storage - in a real app, this would be replaced with database queries
const userStats = {};

// Generate consistent mock data based on userId
function generateMockStats(userId) {
  // Use a fixed appointment count matching our mock appointments array (which has 3 items)
  return {
    appointmentsToday: 3, // Fixed to match the 3 appointments in appointmentRoutes.js
    totalCustomers: 3, // Match the number of unique customers
    revenueToday: 250, // Some realistic revenue amount
    averageWaitTime: 15, // Average wait time in minutes
    lastUpdated: new Date()
  };
}

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Public - for testing
router.get('/stats', (req, res) => {
  try {
    // Use a fixed mock user ID for testing
    const userId = req.user?._id || "123456789012345678901234";
    
    // Generate stats if they don't exist
    if (!userStats[userId]) {
      userStats[userId] = generateMockStats(userId);
    }
    
    // Format data for the frontend
    res.json({
      appointmentsToday: userStats[userId].appointmentsToday,
      totalCustomers: userStats[userId].totalCustomers,
      revenueToday: userStats[userId].revenueToday,
      averageWaitTime: userStats[userId].averageWaitTime
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 