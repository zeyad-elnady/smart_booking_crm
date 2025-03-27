const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Route: /api/appointments
router.route('/')
  .get(protect, getAppointments)
  .post(protect, createAppointment);

// @route   GET /api/appointments/recent
// @desc    Get recent appointments for dashboard
// @access  Public - for testing
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3; // Default to 3 recent appointments
    
    // Mock data for development/testing
    const mockAppointments = [
      { 
        _id: '1', 
        customer: 'John Doe',
        service: 'Haircut',
        time: '10:00 AM', 
        status: 'Confirmed' 
      },
      { 
        _id: '2', 
        customer: 'Jane Smith',
        service: 'Manicure',
        time: '11:30 AM', 
        status: 'Pending'
      },
      { 
        _id: '3', 
        customer: 'Mike Johnson',
        service: 'Massage',
        time: '2:00 PM', 
        status: 'Confirmed'
      }
    ];
    
    // Return mock data - in a real implementation, this would fetch from database
    res.json(mockAppointments);
  } catch (error) {
    console.error('Error getting recent appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: /api/appointments/:id
router.route('/:id')
  .get(protect, getAppointmentById)
  .put(protect, updateAppointment)
  .delete(protect, deleteAppointment);

module.exports = router; 