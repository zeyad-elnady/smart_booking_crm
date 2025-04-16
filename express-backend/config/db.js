const fs = require("fs");
const path = require("path");

// Local database data directory
const DB_DATA_DIR = path.join(__dirname, "../data");

// Ensure data directory exists for local storage
const ensureDataDir = () => {
   if (!fs.existsSync(DB_DATA_DIR)) {
      try {
         fs.mkdirSync(DB_DATA_DIR, { recursive: true });
         console.log("Created local database directory");
      } catch (err) {
         console.error("Failed to create data directory:", err);
         throw err; // Propagate the error
      }
   }
};

// Initialize local storage
const initializeLocalStorage = () => {
   const localDataPath = path.join(DB_DATA_DIR, "local-data.json");

   try {
      // Create initial data structure if it doesn't exist
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

      // Create status file
      fs.writeFileSync(
         path.join(DB_DATA_DIR, "db-status.json"),
         JSON.stringify({
            mode: "local",
            initialized: true,
            lastStartup: new Date().toISOString(),
         })
      );
   } catch (err) {
      console.error("Failed to initialize local storage:", err);
      throw err; // Propagate the error
   }
};

// Main connection function - now just initializes local storage
const connectDB = async () => {
   try {
      console.log("Setting up local data storage...");
      ensureDataDir();
      initializeLocalStorage();
      console.log("Local storage system ready");
      return true;
   } catch (error) {
      console.error(`Storage setup error: ${error.message}`);
      throw error; // Propagate the error
   }
};

module.exports = connectDB;
