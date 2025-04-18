const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
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
router.route("/").get(getServices).post(createService); // Removed auth middleware temporarily for testing

router
   .route("/:id")
   .get(getServiceById)
   .put(updateService)
   .delete(deleteService);

module.exports = router;
