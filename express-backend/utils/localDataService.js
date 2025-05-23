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

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const mongoose = require("mongoose");

// Path to data directory
const DATA_DIR = path.join(__dirname, "../data");
const LOCAL_DATA_FILE = path.join(DATA_DIR, "local-data.json");
const ENCRYPTION_KEY = process.env.JWT_SECRET || "local_development_secret_key";

// Maximum number of backup files to keep
const MAX_BACKUPS = 10;

// In-memory cache for better performance
let dataCache = null;
let lastCacheUpdate = null;
const CACHE_TTL = 30000; // 30 seconds cache TTL

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
            "aes-256-cbc",
            Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
            iv
        );
        // Encrypt the text
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        // Return iv + encrypted data
        return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
        console.error("Encryption error:", error);
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
        if (!text || !text.includes(":")) {
            return text;
        }

        // Split iv and encrypted data
        const parts = text.split(":");
        const iv = Buffer.from(parts[0], "hex");
        const encryptedText = parts[1];

        // Create decipher
        const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
            iv
        );

        // Decrypt the data
        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
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
        console.error("Compression error:", error);
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
            console.error("Decompression error:", error);
            console.error("Parse error:", parseError);
            // Return empty data structure if all fails
            return {
                users: [],
                customers: [],
                appointments: [],
                services: [],
                lastUpdated: new Date().toISOString(),
                error: "Data recovery failed",
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
            case "users":
                model = require("../models/User");
                break;
            case "customers":
                model = require("../models/Customer");
                break;
            case "services":
                model = require("../models/Service");
                break;
            case "appointments":
                model = require("../models/Appointment");
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
            Object.keys(validationError.errors).forEach((key) => {
                errors[key] = validationError.errors[key].message;
            });

            return {
                isValid: false,
                errors,
                data, // Return original data even if invalid
            };
        }

        return { isValid: true, data };
    } catch (error) {
        console.error("Validation error:", error);
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
    if (!data || typeof data !== "object") {
        return data;
    }

    const processedData = {...data };

    // Process based on collection type
    switch (collection) {
        case "users":
            // Encrypt/decrypt sensitive user fields
            if (processedData.email) {
                processedData.email = isEncrypt ?
                    encrypt(processedData.email) :
                    decrypt(processedData.email);
            }
            // Don't store plaintext passwords in the JSON file
            if (processedData.password && isEncrypt) {
                processedData.password = "[PROTECTED]";
            }
            break;

        case "customers":
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

        case "appointments":
            // No sensitive data to encrypt in appointments
            break;

        case "services":
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
        const backupFiles = fs
            .readdirSync(DATA_DIR)
            .filter((file) => file.startsWith("backup-") && file.endsWith(".json"))
            .sort((a, b) => {
                // Sort by creation time, newest first
                return (
                    fs.statSync(path.join(DATA_DIR, b)).mtime.getTime() -
                    fs.statSync(path.join(DATA_DIR, a)).mtime.getTime()
                );
            });

        // Keep only the newest MAX_BACKUPS files
        if (backupFiles.length > MAX_BACKUPS) {
            const filesToDelete = backupFiles.slice(MAX_BACKUPS);

            filesToDelete.forEach((file) => {
                try {
                    fs.unlinkSync(path.join(DATA_DIR, file));
                    console.log(`Deleted old backup: ${file}`);
                } catch (error) {
                    console.error(`Failed to delete backup ${file}:`, error);
                }
            });
        }
    } catch (error) {
        console.error("Error rotating backups:", error);
    }
};

// Initialize empty data file if it doesn't exist
if (!fs.existsSync(LOCAL_DATA_FILE)) {
    const initialData = {
        users: [],
        customers: [],
        appointments: [],
        services: [],
        lastUpdated: new Date().toISOString(),
    };

    try {
        // Save as compressed file
        fs.writeFileSync(LOCAL_DATA_FILE, compressData(initialData));
        console.log("Initialized local data storage with empty collections");
    } catch (error) {
        console.error("Failed to initialize local data storage:", error);
        // Try uncompressed fallback
        fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log("Initialized local data storage with uncompressed fallback");
    }
} else {
    // Validate existing file structure
    try {
        const compressedData = fs.readFileSync(LOCAL_DATA_FILE);
        const data = decompressData(compressedData);

        // Check if structure is valid
        const requiredCollections = ['users', 'customers', 'appointments', 'services'];
        let needsUpdate = false;

        requiredCollections.forEach(collection => {
            if (!data[collection]) {
                console.log(`Data file missing ${collection} collection, will fix`);
                data[collection] = [];
                needsUpdate = true;
            } else if (!Array.isArray(data[collection])) {
                console.log(`Data file has invalid ${collection} collection (not an array), will fix`);
                data[collection] = [];
                needsUpdate = true;
            }
        });

        // Update file if needed
        if (needsUpdate) {
            console.log("Fixing invalid data file structure");
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(LOCAL_DATA_FILE, compressData(data));
            console.log("Data file structure fixed");
        }
    } catch (error) {
        console.error("Error validating existing data file:", error);
    }
}

/**
 * Read data from local storage
 * @returns {Object} The parsed data
 */
const readLocalData = () => {
    // Return cached data if available and not expired
    const now = Date.now();
    if (dataCache && lastCacheUpdate && (now - lastCacheUpdate) < CACHE_TTL) {
        return dataCache;
    }

    try {
        console.log("Attempting to read local data file");
        // Try to read as compressed data
        const compressedData = fs.readFileSync(LOCAL_DATA_FILE);
        const data = decompressData(compressedData);

        // Ensure all required collections exist and are arrays
        const requiredCollections = ['users', 'customers', 'appointments', 'services'];
        let dataValid = true;

        requiredCollections.forEach(collection => {
            if (!data[collection]) {
                console.log(`Missing ${collection} collection, initializing as empty array`);
                data[collection] = [];
                dataValid = false;
            } else if (!Array.isArray(data[collection])) {
                console.log(`${collection} is not an array (type: ${typeof data[collection]}), fixing`);
                data[collection] = [];
                dataValid = false;
            }
        });

        // If we had to fix something, save the corrected data
        if (!dataValid) {
            console.log("Data structure was invalid, saving corrected version");
            writeLocalData(data);
        }

        console.log(`Successfully read data with ${data.customers.length} customers and ${data.services ? data.services.length : 0} services`);

        // Decrypt sensitive fields
        Object.keys(data).forEach((collection) => {
            if (Array.isArray(data[collection])) {
                data[collection] = data[collection].map((item) =>
                    processSensitiveData(collection, item, false)
                );
            }
        });

        // Update cache
        dataCache = data;
        lastCacheUpdate = now;

        return data;
    } catch (error) {
        console.error("Error reading local data:", error);

        // Create a new data file with sample data
        console.log("Creating new data file with default empty collections");
        const newData = {
            users: [],
            customers: [],
            appointments: [],
            services: [],
            lastUpdated: new Date().toISOString()
        };

        try {
            // Write as plain JSON for simplicity
            fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(newData, null, 2));
            console.log("Created new local data file with empty collections");

            // Update cache with the new data
            dataCache = newData;
            lastCacheUpdate = now;

            return newData;
        } catch (writeError) {
            console.error("Error creating new data file:", writeError);
            return {
                users: [],
                customers: [],
                appointments: [],
                services: [],
                lastUpdated: new Date().toISOString(),
                error: "Recovery failed"
            };
        }
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
        const encryptedData = {...data };
        Object.keys(encryptedData).forEach((collection) => {
            if (Array.isArray(encryptedData[collection])) {
                encryptedData[collection] = encryptedData[collection].map((item) =>
                    processSensitiveData(collection, item, true)
                );
            }
        });

        // Compress and write to file
        fs.writeFileSync(LOCAL_DATA_FILE, compressData(encryptedData));

        // Update the cache
        dataCache = data;
        lastCacheUpdate = Date.now();

        // Create a backup copy - TEMPORARILY DISABLED to prevent nodemon restart loop
        // Uncomment this in production, but for development it causes nodemon to restart in a loop
        /*
    const backupFileName = `backup-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(
      path.join(DATA_DIR, backupFileName),
      compressData(encryptedData)
    );
    
    // Clean up old backups
    rotateBackups();
    */
    } catch (error) {
        console.error("Error writing local data:", error);

        // Try uncompressed fallback
        try {
            fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));

            // Still update cache even with fallback
            dataCache = data;
            lastCacheUpdate = Date.now();
        } catch (fallbackError) {
            console.error("Fallback write failed:", fallbackError);
        }
    }
};

/**
 * Clear the in-memory cache
 * Forces next read to load from disk
 */
const clearCache = () => {
    dataCache = null;
    lastCacheUpdate = null;
    console.log("Local data cache cleared");
};

/**
 * Synchronize MongoDB data with local storage
 * This helps keep both storages in sync when MongoDB is available
 */
const syncWithMongoDB = async() => {
    if (!isMongoConnected()) {
        return false;
    }

    try {
        console.log("Synchronizing MongoDB with local storage...");

        // Import models
        const User = require("../models/User");
        const Customer = require("../models/Customer");
        const Service = require("../models/Service");
        const Appointment = require("../models/Appointment");

        // Fetch all data from MongoDB
        const users = await User.find({}).lean();
        const customers = await Customer.find({}).lean();
        const services = await Service.find({}).lean();
        const appointments = await Appointment.find({}).lean();

        // Update local storage with MongoDB data
        const localData = readLocalData();

        // Convert MongoDB ObjectIDs to strings
        const prepareForStorage = (items) => {
            return items.map((item) => {
                const prepared = {...item };
                if (prepared._id) {
                    prepared._id = prepared._id.toString();
                }
                // Convert other ObjectIDs to strings
                Object.keys(prepared).forEach((key) => {
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

        console.log("Synchronization complete");
        return true;
    } catch (error) {
        console.error("Synchronization error:", error);
        return false;
    }
};

/**
 * Generate a unique ID
 * @param {string} collection - The collection name for sequential IDs
 * @returns {string} A unique ID
 */
const generateId = (collection = null) => {
    // For customers collection, use sequential IDs starting from 1
    if (collection === 'customers') {
        const data = readLocalData();
        if (!data[collection] || !Array.isArray(data[collection])) {
            return '1'; // Start with ID 1 if collection is empty
        }

        // Find the highest current ID
        const highestId = data[collection]
            .map(item => parseInt(item._id))
            .filter(id => !isNaN(id))
            .reduce((max, id) => Math.max(max, id), 0);

        // Return the next sequential ID
        return String(highestId + 1);
    }

    // For other collections, continue to use UUID format
    return crypto.randomUUID().toString();
};

/**
 * Find records by collection name
 * @param {string} collection - The collection name (users, customers, etc.)
 * @param {Object} query - Query parameters to filter results
 * @param {string} userId - The user ID to filter by (for data isolation)
 * @returns {Array} The matching records
 */
const find = (collection, query = {}, userId = null) => {
    const data = readLocalData();

    if (!data[collection]) {
        return [];
    }

    // Filter by user ID first if provided and not the users collection itself
    let filteredData = data[collection];
    if (userId && collection !== 'users') {
        filteredData = filteredData.filter(item => !item.userId || item.userId === userId);
    }

    // If no query params, return filtered items
    if (Object.keys(query).length === 0) {
        return filteredData;
    }

    // Filter by query parameters
    return filteredData.filter((item) => {
        for (const key in query) {
            // Special handling for phone numbers in customers collection
            if (collection === 'customers' && key === 'phone' && item[key] && query[key]) {
                // Normalize phone numbers by removing spaces and special characters
                const normalizedQueryPhone = query[key].replace(/\s+|-|\(|\)|\+/g, '');
                const normalizedItemPhone = decrypt(item[key]).replace(/\s+|-|\(|\)|\+/g, '');

                // Compare normalized phone numbers
                if (normalizedQueryPhone !== normalizedItemPhone) {
                    return false;
                }
            }
            // Regular comparison for other fields
            else if (query[key] !== item[key]) {
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
 * @param {string} userId - The user ID for data isolation
 * @returns {Object|null} The matching record or null
 */
const findById = (collection, id, userId = null) => {
    const data = readLocalData();

    if (!data[collection]) {
        return null;
    }

    // Find the item
    const item = data[collection].find((item) => item._id === id);

    // Check if item exists and belongs to the user (if userId provided)
    if (!item || (userId && collection !== 'users' && item.userId && item.userId !== userId)) {
        return null;
    }

    return item;
};

/**
 * Create a new record
 * @param {string} collection - The collection name
 * @param {Object} record - The record to create
 * @param {string} userId - The user ID to associate with this record
 * @returns {Object} The created record with ID
 */
const create = (collection, record, userId = null) => {
    const data = readLocalData();

    // Ensure collection exists and is an array
    if (!data[collection]) {
        console.log(`Creating missing ${collection} collection as an empty array`);
        data[collection] = [];
    } else if (!Array.isArray(data[collection])) {
        console.log(`Converting ${collection} to an array as it was type: ${typeof data[collection]}`);
        data[collection] = [];
    }

    // Validate record against schema
    const { isValid, errors } = validateAgainstSchema(collection, record);

    if (!isValid) {
        console.warn(`Validation errors for ${collection}:`, errors);
        // Continue anyway for local storage
    }

    // Add userId to the record if provided (except for users collection)
    const newRecord = {
        ...record,
        _id: record._id || generateId(collection),
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Add userId to associate with the specific user (except for users collection)
    if (userId && collection !== 'users') {
        newRecord.userId = userId;
    }

    data[collection].push(newRecord);
    writeLocalData(data);

    return newRecord;
};

/**
 * Update an existing record
 * @param {string} collection - The collection name
 * @param {string} id - The record ID
 * @param {Object} update - The fields to update
 * @param {string} userId - The user ID for data isolation
 * @returns {Object|null} The updated record or null
 */
const update = (collection, id, update, userId = null) => {
    const data = readLocalData();

    if (!data[collection]) {
        return null;
    }

    const index = data[collection].findIndex((item) => item._id === id);

    if (index === -1) {
        return null;
    }

    // Check if item belongs to the user (if userId provided)
    if (userId && collection !== 'users' &&
        data[collection][index].userId &&
        data[collection][index].userId !== userId) {
        return null;
    }

    // Validate updated record
    const updatedRecord = {
        ...data[collection][index],
        ...update,
        updatedAt: new Date().toISOString(),
    };

    // Preserve userId if it already exists
    if (data[collection][index].userId) {
        updatedRecord.userId = data[collection][index].userId;
    }

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
 * @param {string} userId - The user ID for data isolation
 * @returns {boolean} Success status
 */
const remove = (collection, id, userId = null) => {
    const data = readLocalData();

    if (!data[collection]) {
        return false;
    }

    const index = data[collection].findIndex((item) => item._id === id);

    if (index === -1) {
        return false;
    }

    // Check if item belongs to the user (if userId provided)
    if (userId && collection !== 'users' &&
        data[collection][index].userId &&
        data[collection][index].userId !== userId) {
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
        console.error("Error checking MongoDB connection:", error);
        return false;
    }
};

/**
 * Initialize storage with default data structure
 * @returns {Object} The initialized data structure
 */
const initializeStorage = () => {
    const defaultData = {
        users: [],
        appointments: [],
        customers: [],
        services: [],
        settings: []
    };
    writeLocalData(defaultData);
    return defaultData;
};

/**
 * Initialize user-specific data
 * @param {string} userId - The user ID
 * @returns {Object} The initialized user data
 */
const initializeUserData = (userId) => {
    const data = readLocalData();
    const userData = {
        appointments: [],
        customers: [],
        services: [],
        settings: []
    };
    
    // Add userId to each collection
    Object.keys(userData).forEach(collection => {
        if (!data[collection]) {
            data[collection] = [];
        }
    });
    
    writeLocalData(data);
    return userData;
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
    clearCache,
    initializeStorage,
    initializeUserData
};