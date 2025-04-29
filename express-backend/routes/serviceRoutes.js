const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const {
   getServices,
   getServiceById,
   createService,
   updateService,
   deleteService,
} = require("../controllers/serviceController");

// Test endpoint to check connections
router.get("/test-connection", async (req, res) => {
   try {
      // Check MongoDB connection
      const dbState = mongoose.connection.readyState;
      const dbStatus = {
         0: "disconnected",
         1: "connected",
         2: "connecting",
         3: "disconnecting",
      };

      // Test database by trying to query services
      let dbQueryWorking = false;
      try {
         await mongoose.connection.db.admin().ping();
         dbQueryWorking = true;
      } catch (error) {
         console.error("Database query test failed:", error);
      }

      res.json({
         success: true,
         api: {
            status: "working",
            endpoint: req.originalUrl,
            method: req.method,
         },
         database: {
            status: dbStatus[dbState],
            connected: dbState === 1,
            queryTest: dbQueryWorking,
            url: process.env.MONGODB_URI,
         },
         server: {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT,
         },
      });
   } catch (error) {
      console.error("Connection test error:", error);
      res.status(500).json({
         success: false,
         error: error.message,
      });
   }
});

// Routes
router.route("/").get(protect, getServices).post(protect, createService); // Added auth middleware back

router
   .route("/:id")
   .get(protect, getServiceById)
   .put(protect, updateService)
   .delete(protect, deleteService);

module.exports = router;
