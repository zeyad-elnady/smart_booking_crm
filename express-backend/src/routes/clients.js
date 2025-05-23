const express = require('express');
const router = express.Router();
const languageMiddleware = require('../middleware/language');

// Apply language middleware to all routes
router.use(languageMiddleware);

// Get all clients
router.get('/', (req, res) => {
  try {
    // Simulate getting clients from database
    const clients = [];
    
    res.json({
      success: true,
      message: res.translate('success'),
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: res.translate('serverError'),
      error: error.message
    });
  }
});

// Create new client
router.post('/', (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: res.translate('requiredFields')
      });
    }

    // Simulate creating client in database
    const newClient = { id: 1, name, email, phone };

    res.status(201).json({
      success: true,
      message: res.translate('clientCreated'),
      data: newClient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: res.translate('serverError'),
      error: error.message
    });
  }
});

// Update client
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: res.translate('requiredFields')
      });
    }

    // Simulate updating client in database
    const updatedClient = { id, name, email, phone };

    res.json({
      success: true,
      message: res.translate('clientUpdated'),
      data: updatedClient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: res.translate('serverError'),
      error: error.message
    });
  }
});

// Delete client
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Simulate deleting client from database
    res.json({
      success: true,
      message: res.translate('clientDeleted')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: res.translate('serverError'),
      error: error.message
    });
  }
});

module.exports = router; 