const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const localDataService = require("./utils/localDataService");

// Load environment variables
dotenv.config();

// Create data directory if it doesn't exist
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
   fs.mkdirSync(DATA_DIR, { recursive: true });
}

const app = express();

// Enhanced CORS setup for local development across different URLs
app.use(
   cors({
      origin: true, // Allow any origin
      credentials: true, // Allow cookies to be sent
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
   })
);

// Allow pre-flight requests for all routes
app.options("*", cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger that doesn't output to console
app.use((req, res, next) => {
   next();
});

// Add a default authentication middleware to bypass login
app.use((req, res, next) => {
  // Add a default user to all requests
  req.user = {
    _id: '1', // Default test user ID
    name: 'Test User',
    email: 'test@example.com',
    businessName: 'Test Business',
    businessType: 'Hair Salon',
    role: 'admin'
  };
  
  console.log(`Request to ${req.originalUrl} - Using default user authentication`);
  next();
});

// Import routes
const serviceRoutes = require("./routes/serviceRoutes");
const customerRoutes = require("./routes/customerRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Health check route for API connectivity testing
app.get("/", (req, res) => {
   const dbStatus = localDataService.isMongoConnected()
      ? "connected"
      : "using local storage";

   res.json({
      message: "Smart Booking CRM API",
      status: "online",
      database: dbStatus,
      timestamp: new Date().toISOString(),
   });
});

// Mount routes
app.use("/api/services", serviceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Database status and operations routes
app.get("/api/db/status", (req, res) => {
   const statusFile = path.join(DATA_DIR, "db-status.json");
   let syncStatus = {};

   if (fs.existsSync(statusFile)) {
      try {
         syncStatus = JSON.parse(fs.readFileSync(statusFile, "utf8"));
      } catch (error) {
         console.error("Error reading status file:", error);
      }
   }

   const backupFiles = fs.existsSync(DATA_DIR)
      ? fs.readdirSync(DATA_DIR).filter((file) => file.startsWith("backup-"))
           .length
      : 0;

   res.json({
      mongodb: {
         connected: false,
         url: null,
      },
      localStorage: {
         available: true,
         backupCount: backupFiles,
      },
      lastSync: syncStatus.endTime || null,
      syncSuccess: syncStatus.success || false,
   });
});

// 404 handler
app.use((req, res, next) => {
   res.status(404).json({
      message: `Route not found: ${req.originalUrl}`,
   });
});

// Error handling middleware
app.use((err, req, res, next) => {
   console.error("Global error handler:", err);
   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
   res.status(statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : null,
   });
});

// Start server function
const startServer = async () => {
   try {
      // Always use local storage mode
      console.log("Running in local storage only mode");
      console.log("Application will use local storage only");

      // Initialize local storage
      await localDataService.initializeStorage();
      
      // Start the server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
         console.log(`Server running on port ${PORT}`);
      });
   } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1); // Exit if we can't start the server
   }
};

// Start the server
startServer();
