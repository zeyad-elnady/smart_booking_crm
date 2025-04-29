const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Local database data directory
const DB_DATA_DIR = path.join(__dirname, "../data");

// MongoDB Connection URL - use environment variable or default to localhost
const MONGODB_URI =
   process.env.MONGODB_URI || "mongodb://localhost:27017/smart_booking_crm";

// Ensure data directory exists for local storage
const ensureDataDir = () => {
   if (!fs.existsSync(DB_DATA_DIR)) {
      try {
         fs.mkdirSync(DB_DATA_DIR, { recursive: true });
         console.log("Created local database directory");
      } catch (err) {
         console.error("Failed to create data directory:", err);
         throw err;
      }
   }
};

// Initialize local storage
const initializeLocalStorage = () => {
   const localDataPath = path.join(DB_DATA_DIR, "local-data.json");

   try {
      if (!fs.existsSync(localDataPath)) {
         const initialData = {
            users: [],
            customers: [],
            appointments: [],
            services: [],
            lastUpdated: new Date().toISOString(),
         };

         fs.writeFileSync(localDataPath, JSON.stringify(initialData, null, 2));
         console.log("Initialized local data storage");
      } else {
         console.log("Using existing local data storage");
      }

      fs.writeFileSync(
         path.join(DB_DATA_DIR, "db-status.json"),
         JSON.stringify({
            mode: "local", // Changed to local only mode
            initialized: true,
            lastStartup: new Date().toISOString(),
         })
      );
   } catch (err) {
      console.error("Failed to initialize local storage:", err);
      throw err;
   }
};

// Main connection function
const connectDB = async () => {
   try {
      // First set up local storage
      console.log("Setting up local data storage...");
      ensureDataDir();
      initializeLocalStorage();
      console.log("Local storage system ready");

      // Then connect to MongoDB
      console.log("Connecting to MongoDB...");
      await mongoose.connect(MONGODB_URI, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
         serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });

      console.log("MongoDB Connected");

      // Handle connection events
      mongoose.connection.on("error", (err) => {
         console.error("MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
         console.log("MongoDB disconnected");
      });

      process.on("SIGINT", async () => {
         await mongoose.connection.close();
         console.log("MongoDB connection closed through app termination");
         process.exit(0);
      });

      return true;
   } catch (error) {
      console.error(`Database connection error: ${error.message}`);
      throw error;
   }
};

module.exports = connectDB;
