const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");

// Get dashboard statistics
router.get("/stats", getDashboardStats);

module.exports = router;
