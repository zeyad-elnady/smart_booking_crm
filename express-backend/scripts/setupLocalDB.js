/**
 * Local MongoDB Setup Helper
 * 
 * This script helps verify and set up a local MongoDB instance
 * for the Smart Booking CRM application.
 */

const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbooking';

// Path to data directory
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Check if MongoDB is installed and running
 */
const checkMongoDBInstallation = () => {
  return new Promise((resolve) => {
    console.log('Checking if MongoDB is installed and running...');
    
    exec('mongod --version', (error) => {
      if (error) {
        console.log('MongoDB is not installed or not in the PATH.');
        console.log('Please install MongoDB Community Edition from: https://www.mongodb.com/try/download/community');
        console.log('For Windows users, download the MongoDB installer and follow the installation steps.');
        console.log('Make sure to add MongoDB to your PATH environment variable.');
        resolve(false);
      } else {
        console.log('MongoDB is installed.');
        
        // Check if MongoDB is running
        checkMongoDBRunning().then(resolve);
      }
    });
  });
};

/**
 * Check if MongoDB server is running
 */
const checkMongoDBRunning = () => {
  return new Promise((resolve) => {
    console.log('Checking if MongoDB server is running...');
    
    mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    })
    .then(() => {
      console.log('MongoDB is running and accessible.');
      mongoose.disconnect();
      resolve(true);
    })
    .catch(() => {
      console.log('MongoDB server is not running or not accessible.');
      console.log('For Windows users, you can start MongoDB as a service or run:');
      console.log('  1. Open Command Prompt as Administrator');
      console.log('  2. Run: "net start MongoDB"');
      console.log('  3. Or manually start MongoDB using: "mongod --dbpath=C:/data/db"');
      resolve(false);
    });
  });
};

/**
 * Create initial database with test data
 */
const initializeDatabase = async () => {
  console.log('Initializing database with sample data...');
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Import models
    const User = require('../models/User');
    const Customer = require('../models/Customer');
    const Service = require('../models/Service');
    
    // Check if database is empty
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log('Database already contains data. Skipping initialization.');
      return true;
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}; 
/**
 * Main setup function
 */
const setupLocalDB = async () => {
  console.log('=== Smart Booking CRM - Local Database Setup ===');
  
  const mongoDBInstalled = await checkMongoDBInstallation();
  
  if (!mongoDBInstalled) {
    rl.question('Would you like to continue with file-based storage instead? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Continuing with file-based storage. The application will use local JSON files to store data.');
        
        // Update the .env file to use a non-existent MongoDB URI
        // This will force the app to use the file-based storage
        fs.writeFileSync(
          path.join(__dirname, '../.env'),
          `PORT=5000
MONGODB_URI=mongodb://non-existent-host:27017/smartbooking
JWT_SECRET=local_development_secret_key
NODE_ENV=development`
        );
        
        console.log('Setup complete. You can now start the application with:');
        console.log('  npm start');
        rl.close();
      } else {
        console.log('Setup aborted. Please install MongoDB and run this script again.');
        rl.close();
      }
    });
    return;
  }
  
  // If we get here, MongoDB is installed and running
  console.log('MongoDB is properly installed and running.');
  
  rl.question('Would you like to initialize the database with sample data? (y/n) ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      const success = await initializeDatabase();
      
      if (success) {
        console.log('Setup complete! You can now start the application with:');
        console.log('  npm start');
      } else {
        console.log('Database initialization failed. You can still start the application, but it may not have sample data.');
      }
    } else {
      console.log('Database initialization skipped. You can now start the application with:');
      console.log('  npm start');
    }
    
    rl.close();
  });
};

// Run the setup
setupLocalDB(); 