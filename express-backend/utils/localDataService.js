/**
 * Local Data Service
 * 
 * This utility provides methods for reading/writing data to local files
 * as a fallback when MongoDB is not available.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to data directory
const DATA_DIR = path.join(__dirname, '../data');
const LOCAL_DATA_FILE = path.join(DATA_DIR, 'local-data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty data file if it doesn't exist
if (!fs.existsSync(LOCAL_DATA_FILE)) {
  const initialData = {
    users: [],
    customers: [],
    appointments: [],
    services: [],
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initialData, null, 2));
}

/**
 * Read data from local storage
 * @returns {Object} The parsed data
 */
const readLocalData = () => {
  try {
    const data = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local data:', error);
    // Return empty data structure if file can't be read
    return {
      users: [],
      customers: [],
      appointments: [],
      services: [],
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Write data to local storage
 * @param {Object} data - The data to write
 */
const writeLocalData = (data) => {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
    // Create a backup copy
    fs.writeFileSync(
      path.join(DATA_DIR, `backup-${new Date().toISOString().replace(/:/g, '-')}.json`),
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error('Error writing local data:', error);
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
  
  const newRecord = {
    ...record,
    _id: generateId(),
    createdAt: new Date().toISOString(),
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
  
  data[collection][index] = {
    ...data[collection][index],
    ...update,
    updatedAt: new Date().toISOString()
  };
  
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
  try {
    // Check MongoDB connection state
    const mongooseState = require('mongoose').connection.readyState;
    return mongooseState === 1;
  } catch (error) {
    return false;
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
  writeLocalData
}; 