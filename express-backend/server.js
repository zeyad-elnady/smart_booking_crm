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
   const isConnected = localDataService.isMongoConnected();
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
         connected: isConnected,
         url: isConnected ? process.env.MONGODB_URI : null,
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
      // Check if we should skip MongoDB connection attempts
      if (process.env.SKIP_MONGODB === "true") {
         console.log("MongoDB connection skipped (SKIP_MONGODB=true)");
         console.log("Application will use local storage only");
      } else {
         // Connect to MongoDB first
         console.log("Connecting to database...");
         try {
            await connectDB();
            console.log("MongoDB Connected");
         } catch (dbError) {
            console.error("MongoDB connection failed:", dbError.message);
            console.log("Application will fall back to local storage");
         }
      }

      // Start the server regardless of database connection status
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
