const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  getAllUsers,
  debugHelper
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// LOG requests for debugging
router.use((req, res, next) => {
  console.log(`USER ROUTE: ${req.method} ${req.originalUrl}`);
  next();
});

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/all', getAllUsers);
router.get('/debug', debugHelper); // Debug helper endpoint

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

module.exports = router;