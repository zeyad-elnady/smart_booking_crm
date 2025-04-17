/**
 * Database Synchronization Script
 * 
 * This script synchronizes data between MongoDB and local file storage.
 * It can be run as a scheduled task or on demand to ensure data consistency.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const localDataService = require('../utils/localDataService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbooking';

// Path to data directory
const DATA_DIR = path.join(__dirname, '../data');
const DB_STATUS_FILE = path.join(DATA_DIR, 'db-status.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Save database status to a file
 * @param {Object} status - Status object
 */
const saveStatus = (status) => {
  try {
    fs.writeFileSync(DB_STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error saving status:', error);
  }
};

/**
 * Connect to MongoDB
 * @returns {Promise<boolean>} - Connection success
 */
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    });
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    return false;
  }
};

/**
 * Sync local data to MongoDB
 * This processes any locally created records and adds them to MongoDB
 */
const syncLocalToMongoDB = async () => {
  try {
    console.log('Syncing local data to MongoDB...');
    
    // Get local data
    const localData = localDataService.readLocalData();
    
    // Import models
    const User = require('../models/User');
    const Customer = require('../models/Customer');
    const Service = require('../models/Service');
    const Appointment = require('../models/Appointment');
    
    // Process each collection
    const collections = [
      { name: 'users', model: User },
      { name: 'customers', model: Customer },
      { name: 'services', model: Service },
      { name: 'appointments', model: Appointment }
    ];
    
    const syncStats = {
      created: 0,
      updated: 0,
      errors: 0
    };
    
    // Process each collection in sequence
    for (const { name, model } of collections) {
      console.log(`Processing ${name}...`);
      
      // Skip if no local data for this collection
      if (!Array.isArray(localData[name]) || localData[name].length === 0) {
        console.log(`No local ${name} to process.`);
        continue;
      }
      
      // Process each item in the collection
      for (const item of localData[name]) {
        try {
          // Skip if no ID
          if (!item._id) {
            console.warn(`Skipping ${name} item with no ID`);
            continue;
          }
          
          // Check if the item exists in MongoDB
          const existingItem = await model.findById(item._id).lean();
          
          if (!existingItem) {
            // Create new item in MongoDB
            const cleanItem = { ...item };
            // Remove MongoDB-specific fields
            delete cleanItem.__v;
            
            const newItem = new model(cleanItem);
            await newItem.save();
            syncStats.created++;
          } else {
            // Update existing item
            // Only update if the local version is newer
            const localUpdated = new Date(item.updatedAt || 0);
            const dbUpdated = new Date(existingItem.updatedAt || 0);
            
            if (localUpdated > dbUpdated) {
              const updateResult = await model.updateOne(
                { _id: item._id },
                { $set: item }
              );
              
              if (updateResult.modifiedCount > 0) {
                syncStats.updated++;
              }
            }
          }
        } catch (itemError) {
          console.error(`Error processing ${name} item:`, itemError);
          syncStats.errors++;
        }
      }
    }
    
    console.log('Local to MongoDB sync completed.');
    console.log(`Created: ${syncStats.created}, Updated: ${syncStats.updated}, Errors: ${syncStats.errors}`);
    
    return syncStats;
  } catch (error) {
    console.error('Error syncing local to MongoDB:', error);
    return { error: error.message };
  }
};

/**
 * Main synchronization function
 */
const syncDatabases = async () => {
  console.log('=== Database Synchronization ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    // Set initial status
    const status = {
      startTime: new Date().toISOString(),
      success: false,
      mongoDBConnected: false,
      syncPerformed: false,
      stats: {}
    };
    
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    status.mongoDBConnected = connected;
    
    if (!connected) {
      console.log('MongoDB connection failed. Skipping sync.');
      status.error = 'MongoDB connection failed';
      saveStatus(status);
      return false;
    }
    
    // Perform two-way sync
    console.log('Performing two-way sync...');
    
    // First, sync from local to MongoDB
    const localToMongoStats = await syncLocalToMongoDB();
    status.stats.localToMongo = localToMongoStats;
    
    // Then sync from MongoDB to local
    const mongoToLocalSuccess = await localDataService.syncWithMongoDB();
    status.stats.mongoToLocal = { success: mongoToLocalSuccess };
    
    status.success = true;
    status.syncPerformed = true;
    status.endTime = new Date().toISOString();
    
    // Save status
    saveStatus(status);
    
    console.log('Database synchronization completed successfully.');
    return true;
  } catch (error) {
    console.error('Synchronization error:', error);
    
    const status = {
      startTime: new Date().toISOString(),
      success: false,
      error: error.message,
      endTime: new Date().toISOString()
    };
    
    saveStatus(status);
    return false;
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
};

// Run the sync if this script is called directly
if (require.main === module) {
  syncDatabases()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = syncDatabases;
} 