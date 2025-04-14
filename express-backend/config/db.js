const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Maximum number of connection attempts
const MAX_RETRIES = 5;
// Local database data directory
const DB_DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists for local MongoDB storage
const ensureDataDir = () => {
  if (!fs.existsSync(DB_DATA_DIR)) {
    try {
      fs.mkdirSync(DB_DATA_DIR, { recursive: true });
      console.log('Created local database directory');
    } catch (err) {
      console.error('Failed to create data directory:', err);
    }
  }
};

const connectDB = async (retryCount = 0) => {
  try {
    ensureDataDir();
    
    console.log('Connecting to MongoDB...');
    
    // Local MongoDB connection
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create a file to store the connection status
    fs.writeFileSync(
      path.join(DB_DATA_DIR, 'db-status.json'), 
      JSON.stringify({ 
        connected: true, 
        lastConnected: new Date().toISOString() 
      })
    );
    
    // Set up connection monitoring
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      // Update status file
      fs.writeFileSync(
        path.join(DB_DATA_DIR, 'db-status.json'), 
        JSON.stringify({ 
          connected: false, 
          lastConnected: new Date().toISOString(),
          disconnectedAt: new Date().toISOString()
        })
      );
    });
    
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    // Update status file
    fs.writeFileSync(
      path.join(DB_DATA_DIR, 'db-status.json'), 
      JSON.stringify({ 
        connected: false, 
        lastAttempt: new Date().toISOString(),
        error: error.message
      })
    );
    
    // Retry logic for local-only setup
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection (${retryCount + 1}/${MAX_RETRIES})...`);
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectDB(retryCount + 1);
    }
    
    console.log('Warning: Starting server without MongoDB connection. Using local storage fallback.');
    initializeLocalStorageFallback();
  }
};

// Initialize local storage fallback when MongoDB is unavailable
const initializeLocalStorageFallback = () => {
  const localDataPath = path.join(DB_DATA_DIR, 'local-data.json');
  
  // Create initial data structure if it doesn't exist
  if (!fs.existsSync(localDataPath)) {
    const initialData = {
      users: [],
      customers: [],
      appointments: [],
      services: [],
      lastUpdated: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(localDataPath, JSON.stringify(initialData, null, 2));
      console.log('Initialized local data storage');
    } catch (err) {
      console.error('Failed to initialize local data storage:', err);
    }
  }
};

module.exports = connectDB; 