/**
 * Local Data Service
 * 
 * This utility provides methods for reading/writing data to local files
 * as a fallback when MongoDB is not available.
 * 
 * Features:
 * - Data encryption for sensitive information
 * - Data validation matching MongoDB schemas
 * - Automatic backup rotation and cleanup
 * - Data compression for efficient storage
 * - Corruption detection and recovery
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const mongoose = require('mongoose');

// Path to data directory
const DATA_DIR = path.join(__dirname, '../data');
const LOCAL_DATA_FILE = path.join(DATA_DIR, 'local-data.json');
const ENCRYPTION_KEY = process.env.JWT_SECRET || 'local_development_secret_key';

// Maximum number of backup files to keep
const MAX_BACKUPS = 10;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
const encrypt = (text) => {
  try {
    // Create a random initialization vector
    const iv = crypto.randomBytes(16);
    // Create cipher using the key and iv
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      iv
    );
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return iv + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback to unencrypted text on error
  }
};

/**
 * Decrypt sensitive data
 * @param {string} text - Text to decrypt
 * @returns {string} - Decrypted text
 */
const decrypt = (text) => {
  try {
    // If text doesn't contain the separator, it's not encrypted
    if (!text || !text.includes(':')) {
      return text;
    }
    
    // Split iv and encrypted data
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      iv
    );
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original text on error
  }
};

/**
 * Compress data for storage
 * @param {Object} data - Data to compress
 * @returns {Buffer} - Compressed data
 */
const compressData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return zlib.gzipSync(jsonString);
  } catch (error) {
    console.error('Compression error:', error);
    // Fallback to uncompressed JSON
    return Buffer.from(JSON.stringify(data));
  }
};

/**
 * Decompress data from storage
 * @param {Buffer} compressedData - Compressed data
 * @returns {Object} - Decompressed data
 */
const decompressData = (compressedData) => {
  try {
    const decompressedData = zlib.gunzipSync(compressedData);
    return JSON.parse(decompressedData.toString());
  } catch (error) {
    // Try to parse as uncompressed JSON if gunzip fails
    try {
      return JSON.parse(compressedData.toString());
    } catch (parseError) {
      console.error('Decompression error:', error);
      console.error('Parse error:', parseError);
      // Return empty data structure if all fails
      return {
        users: [],
        customers: [],
        appointments: [],
        services: [],
        lastUpdated: new Date().toISOString(),
        error: 'Data recovery failed'
      };
    }
  }
};

/**
 * Validate data against MongoDB schema
 * @param {string} collection - Collection name
 * @param {Object} data - Data to validate
 * @returns {Object} - Validated data and validation errors
 */
const validateAgainstSchema = (collection, data) => {
  try {
    let model;
    
    // Get the appropriate model
    switch (collection) {
      case 'users':
        model = require('../models/User');
        break;
      case 'customers':
        model = require('../models/Customer');
        break;
      case 'services':
        model = require('../models/Service');
        break;
      case 'appointments':
        model = require('../models/Appointment');
        break;
      default:
        return { isValid: true, data }; // No validation for unknown collections
    }
    
    // Create a new model instance without saving to DB
    const document = new model(data);
    
    // Validate the document
    const validationError = document.validateSync();
    
    if (validationError) {
      const errors = {};
      
      // Format validation errors
      Object.keys(validationError.errors).forEach(key => {
        errors[key] = validationError.errors[key].message;
      });
      
      return {
        isValid: false,
        errors,
        data // Return original data even if invalid
      };
    }
    
    return { isValid: true, data };
  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: true, data }; // Skip validation on error
  }
};

/**
 * Process sensitive data (encrypt/decrypt)
 * @param {string} collection - Collection name
 * @param {Object} data - Data to process
 * @param {boolean} isEncrypt - Whether to encrypt or decrypt
 * @returns {Object} - Processed data
 */
const processSensitiveData = (collection, data, isEncrypt) => {
  // Skip if data is null or not an object
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const processedData = { ...data };
  
  // Process based on collection type
  switch (collection) {
    case 'users':
      // Encrypt/decrypt sensitive user fields
      if (processedData.email) {
        processedData.email = isEncrypt ? 
          encrypt(processedData.email) : 
          decrypt(processedData.email);
      }
      // Don't store plaintext passwords in the JSON file
      if (processedData.password && isEncrypt) {
        processedData.password = '[PROTECTED]';
      }
      break;
      
    case 'customers':
      // Encrypt/decrypt sensitive customer fields
      if (processedData.email) {
        processedData.email = isEncrypt ? 
          encrypt(processedData.email) : 
          decrypt(processedData.email);
      }
      if (processedData.phone) {
        processedData.phone = isEncrypt ? 
          encrypt(processedData.phone) : 
          decrypt(processedData.phone);
      }
      break;
      
    case 'appointments':
      // No sensitive data to encrypt in appointments
      break;
      
    case 'services':
      // No sensitive data to encrypt in services
      break;
  }
  
  return processedData;
};

/**
 * Rotate backup files and clean up old ones
 */
const rotateBackups = () => {
  try {
    const backupFiles = fs.readdirSync(DATA_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort((a, b) => {
        // Sort by creation time, newest first
        return fs.statSync(path.join(DATA_DIR, b)).mtime.getTime() - 
               fs.statSync(path.join(DATA_DIR, a)).mtime.getTime();
      });
    
    // Keep only the newest MAX_BACKUPS files
    if (backupFiles.length > MAX_BACKUPS) {
      const filesToDelete = backupFiles.slice(MAX_BACKUPS);
      
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(path.join(DATA_DIR, file));
          console.log(`Deleted old backup: ${file}`);
        } catch (error) {
          console.error(`Failed to delete backup ${file}:`, error);
        }
      });
    }
  } catch (error) {
    console.error('Error rotating backups:', error);
  }
};

// Initialize empty data file if it doesn't exist
if (!fs.existsSync(LOCAL_DATA_FILE)) {
  const initialData = {
    users: [],
    customers: [],
    appointments: [],
    services: [],
    lastUpdated: new Date().toISOString()
  };
  
  try {
    // Save as compressed file
    fs.writeFileSync(LOCAL_DATA_FILE, compressData(initialData));
    console.log('Initialized local data storage');
  } catch (error) {
    console.error('Failed to initialize local data storage:', error);
    // Try uncompressed fallback
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

/**
 * Read data from local storage
 * @returns {Object} The parsed data
 */
const readLocalData = () => {
  try {
    // Try to read as compressed data
    const compressedData = fs.readFileSync(LOCAL_DATA_FILE);
    const data = decompressData(compressedData);
    
    // Decrypt sensitive fields
    Object.keys(data).forEach(collection => {
      if (Array.isArray(data[collection])) {
        data[collection] = data[collection].map(item => 
          processSensitiveData(collection, item, false)
        );
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error reading local data:', error);
    
    // Try to recover from backup
    try {
      console.log('Attempting to recover from backup...');
      const backupFiles = fs.readdirSync(DATA_DIR)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort((a, b) => {
          // Sort by creation time, newest first
          return fs.statSync(path.join(DATA_DIR, b)).mtime.getTime() - 
                 fs.statSync(path.join(DATA_DIR, a)).mtime.getTime();
        });
      
      if (backupFiles.length > 0) {
        const latestBackup = backupFiles[0];
        console.log(`Recovering from backup: ${latestBackup}`);
        
        const backupData = fs.readFileSync(path.join(DATA_DIR, latestBackup));
        const data = decompressData(backupData);
        
        // Restore the backup to the main file
        fs.writeFileSync(LOCAL_DATA_FILE, backupData);
        
        // Decrypt sensitive fields
        Object.keys(data).forEach(collection => {
          if (Array.isArray(data[collection])) {
            data[collection] = data[collection].map(item => 
              processSensitiveData(collection, item, false)
            );
          }
        });
        
        return data;
      }
    } catch (backupError) {
      console.error('Backup recovery failed:', backupError);
    }
    
    // Return empty data structure if file can't be read
    return {
      users: [],
      customers: [],
      appointments: [],
      services: [],
      lastUpdated: new Date().toISOString(),
      error: 'Recovery failed'
    };
  }
};

/**
 * Write data to local storage
 * @param {Object} data - The data to write
 */
const writeLocalData = (data) => {
  try {
    // Update timestamp
    data.lastUpdated = new Date().toISOString();
    
    // Encrypt sensitive data
    const encryptedData = { ...data };
    Object.keys(encryptedData).forEach(collection => {
      if (Array.isArray(encryptedData[collection])) {
        encryptedData[collection] = encryptedData[collection].map(item => 
          processSensitiveData(collection, item, true)
        );
      }
    });
    
    // Compress and write to file
    fs.writeFileSync(LOCAL_DATA_FILE, compressData(encryptedData));
    
    // Create a backup copy
    const backupFileName = `backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(
      path.join(DATA_DIR, backupFileName),
      compressData(encryptedData)
    );
    
    // Clean up old backups
    rotateBackups();
  } catch (error) {
    console.error('Error writing local data:', error);
    
    // Try uncompressed fallback
    try {
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (fallbackError) {
      console.error('Fallback write failed:', fallbackError);
    }
  }
};

/**
 * Synchronize MongoDB data with local storage
 * This helps keep both storages in sync when MongoDB is available
 */
const syncWithMongoDB = async () => {
  if (!isMongoConnected()) {
    return false;
  }
  
  try {
    console.log('Synchronizing MongoDB with local storage...');
    
    // Import models
    const User = require('../models/User');
    const Customer = require('../models/Customer');
    const Service = require('../models/Service');
    const Appointment = require('../models/Appointment');
    
    // Fetch all data from MongoDB
    const users = await User.find({}).lean();
    const customers = await Customer.find({}).lean();
    const services = await Service.find({}).lean();
    const appointments = await Appointment.find({}).lean();
    
    // Update local storage with MongoDB data
    const localData = readLocalData();
    
    // Convert MongoDB ObjectIDs to strings
    const prepareForStorage = (items) => {
      return items.map(item => {
        const prepared = { ...item };
        if (prepared._id) {
          prepared._id = prepared._id.toString();
        }
        // Convert other ObjectIDs to strings
        Object.keys(prepared).forEach(key => {
          if (prepared[key] && prepared[key]._id) {
            prepared[key] = prepared[key]._id.toString();
          }
        });
        return prepared;
      });
    };
    
    // Update local storage with prepared data
    localData.users = prepareForStorage(users);
    localData.customers = prepareForStorage(customers);
    localData.services = prepareForStorage(services);
    localData.appointments = prepareForStorage(appointments);
    localData.lastSyncedWithMongoDB = new Date().toISOString();
    
    // Save updated data
    writeLocalData(localData);
    
    console.log('Synchronization complete');
    return true;
  } catch (error) {
    console.error('Synchronization error:', error);
    return false;
  }
};

/**
 * Generate a unique ID for new records
 * @returns {string} A unique ID
 */
const generateId = () => {
  return crypto.randomUUID();
};

/**
 * Find records by collection name
 * @param {string} collection - The collection name (users, customers, etc.)
 * @param {Object} query - Query parameters to filter results
 * @returns {Array} The matching records
 */
const find = (collection, query = {}) => {
  const data = readLocalData();
  
  if (!data[collection]) {
    return [];
  }
  
  // If no query params, return all items
  if (Object.keys(query).length === 0) {
    return data[collection];
  }
  
  // Filter by query parameters
  return data[collection].filter(item => {
    for (const key in query) {
      if (query[key] !== item[key]) {
        return false;
      }
    }
    return true;
  });
};

/**
 * Find one record by collection name and ID
 * @param {string} collection - The collection name
 * @param {string} id - The record ID
 * @returns {Object|null} The matching record or null
 */
const findById = (collection, id) => {
  const data = readLocalData();
  
  if (!data[collection]) {
    return null;
  }
  
  return data[collection].find(item => item._id === id) || null;
};

/**
 * Create a new record
 * @param {string} collection - The collection name
 * @param {Object} record - The record to create
 * @returns {Object} The created record with ID
 */
const create = (collection, record) => {
  const data = readLocalData();
  
  if (!data[collection]) {
    data[collection] = [];
  }
  
  // Validate record against schema
  const { isValid, errors } = validateAgainstSchema(collection, record);
  
  if (!isValid) {
    console.warn(`Validation errors for ${collection}:`, errors);
    // Continue anyway for local storage
  }
  
  const newRecord = {
    ...record,
    _id: record._id || generateId(),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data[collection].push(newRecord);
  writeLocalData(data);
  
  return newRecord;
};

/**
 * Update an existing record
 * @param {string} collection - The collection name
 * @param {string} id - The record ID
 * @param {Object} update - The fields to update
 * @returns {Object|null} The updated record or null
 */
const update = (collection, id, update) => {
  const data = readLocalData();
  
  if (!data[collection]) {
    return null;
  }
  
  const index = data[collection].findIndex(item => item._id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Validate updated record
  const updatedRecord = {
    ...data[collection][index],
    ...update,
    updatedAt: new Date().toISOString()
  };
  
  const { isValid, errors } = validateAgainstSchema(collection, updatedRecord);
  
  if (!isValid) {
    console.warn(`Validation errors for ${collection} update:`, errors);
    // Continue anyway for local storage
  }
  
  data[collection][index] = updatedRecord;
  writeLocalData(data);
  
  return data[collection][index];
};

/**
 * Delete a record
 * @param {string} collection - The collection name
 * @param {string} id - The record ID
 * @returns {boolean} Success status
 */
const remove = (collection, id) => {
  const data = readLocalData();
  
  if (!data[collection]) {
    return false;
  }
  
  const index = data[collection].findIndex(item => item._id === id);
  
  if (index === -1) {
    return false;
  }
  
  data[collection].splice(index, 1);
  writeLocalData(data);
  
  return true;
};

/**
 * Check if MongoDB is connected
 * @returns {boolean} Connection status
 */
const isMongoConnected = () => {
  // Modified to always return false to use local storage only
  // This eliminates the MongoDB dependency for local development
  return false;
  
  // Original implementation commented out:
  /*
  try {
    // Check MongoDB connection state
    const mongooseState = require('mongoose').connection.readyState;
    return mongooseState === 1;
  } catch (error) {
    return false;
  }
  */
};

/**
 * Export data to a file
 * @param {string} exportPath - Path to export file
 * @returns {boolean} Success status
 */
const exportData = (exportPath) => {
  try {
    const data = readLocalData();
    
    // Create a human-readable, unencrypted export
    const exportData = { ...data };
    
    // Format date for the export filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filePath = exportPath || path.join(DATA_DIR, `export-${timestamp}.json`);
    
    // Save as pretty JSON
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    
    return {
      success: true,
      path: filePath
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Import data from a file
 * @param {string} importPath - Path to import file
 * @returns {Object} Result object with success status and details
 */
const importData = (importPath) => {
  try {
    if (!fs.existsSync(importPath)) {
      return {
        success: false,
        error: 'Import file not found'
      };
    }
    
    // Read and parse import file
    const importData = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    
    // Validate data structure
    const requiredCollections = ['users', 'customers', 'appointments', 'services'];
    const missingCollections = requiredCollections.filter(
      collection => !importData[collection]
    );
    
    if (missingCollections.length > 0) {
      return {
        success: false,
        error: `Import file missing collections: ${missingCollections.join(', ')}`
      };
    }
    
    // Validate each record in each collection
    const validationErrors = {};
    let totalRecords = 0;
    
    for (const collection of requiredCollections) {
      validationErrors[collection] = [];
      
      importData[collection].forEach((record, index) => {
        totalRecords++;
        const { isValid, errors } = validateAgainstSchema(collection, record);
        
        if (!isValid) {
          validationErrors[collection].push({
            index,
            id: record._id,
            errors
          });
        }
      });
    }
    
    // Check if there are validation errors
    const hasErrors = Object.values(validationErrors).some(
      collectionErrors => collectionErrors.length > 0
    );
    
    // Create backup before import
    const currentData = readLocalData();
    const backupFileName = `pre-import-backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
    writeLocalData(currentData);
    fs.copyFileSync(
      LOCAL_DATA_FILE,
      path.join(DATA_DIR, backupFileName)
    );
    
    // Write the imported data
    writeLocalData(importData);
    
    return {
      success: true,
      importedRecords: totalRecords,
      hasValidationErrors: hasErrors,
      validationErrors: hasErrors ? validationErrors : null,
      backup: backupFileName
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  find,
  findById,
  create,
  update,
  remove,
  isMongoConnected,
  readLocalData,
  writeLocalData,
  syncWithMongoDB,
  exportData,
  importData
}; 