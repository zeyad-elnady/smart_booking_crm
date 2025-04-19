const express = require("express");
const router = express.Router();
const {
   getDashboardStats,
   getRevenueStats,
} = require("../controllers/dashboardController");

// Get dashboard statistics
router.get("/stats", getDashboardStats);
router.get("/revenue-stats", getRevenueStats);

module.exports = router;
