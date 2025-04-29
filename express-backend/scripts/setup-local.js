/**
 * Setup Local Storage
 * 
 * This script initializes the local storage with sample data
 * so the application can run without MongoDB.
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
  console.log('Created data directory');
}

// Generate a unique ID
const generateId = () => crypto.randomUUID();

// Generate current timestamp
const now = new Date().toISOString();
const tomorrow = new Date(Date.now() + 86400000).toISOString();
const dayAfterTomorrow = new Date(Date.now() + 172800000).toISOString();

// Sample data for services
const services = [
  {
    _id: generateId(),
    name: "Haircut",
    description: "Standard haircut service",
    duration: 30,
    price: 25,
    category: "Hair",
    isActive: true,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: generateId(),
    name: "Hair Coloring",
    description: "Full hair coloring service",
    duration: 90,
    price: 85,
    category: "Hair",
    isActive: true,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: generateId(),
    name: "Manicure",
    description: "Standard manicure service",
    duration: 45,
    price: 35,
    category: "Nails",
    isActive: true,
    createdAt: now,
    updatedAt: now
  }
];

// Sample data for customers
const customers = [
  {
    _id: generateId(),
    firstName: "John",
    lastName: "Smith",
    email: "john@example.com",
    phone: "555-1234",
    notes: "Regular customer",
    createdAt: now,
    updatedAt: now
  },
  {
    _id: generateId(),
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah@example.com",
    phone: "555-5678",
    notes: "Prefers afternoon appointments",
    createdAt: now,
    updatedAt: now
  }
];

// Sample data for appointments
const appointments = [
  {
    _id: generateId(),
    customer: customers[0]._id,
    service: services[0]._id,
    date: tomorrow,
    time: "10:00",
    duration: 30,
    status: "scheduled",
    notes: "First time client",
    createdAt: now,
    updatedAt: now
  },
  {
    _id: generateId(),
    customer: customers[1]._id,
    service: services[1]._id,
    date: dayAfterTomorrow,
    time: "14:00",
    duration: 90,
    status: "scheduled",
    notes: "Bring reference photos",
    createdAt: now,
    updatedAt: now
  }
];

// Sample data for users
const users = [
  {
    _id: generateId(),
    name: "Admin User",
    email: "admin@example.com",
    password: "$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Placeholder
    role: "admin",
    createdAt: now,
    updatedAt: now
  }
];

// Combine all data
const localData = {
  users,
  customers,
  services,
  appointments,
  lastUpdated: now
};

// Write data to file
try {
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(localData, null, 2));
  console.log('Sample data has been created in:', LOCAL_DATA_FILE);
  console.log('The application should now be able to run with local storage.');
} catch (error) {
  console.error('Error creating sample data:', error);
  process.exit(1);
}

// Create a db-status.json file
try {
  fs.writeFileSync(
    path.join(DATA_DIR, 'db-status.json'),
    JSON.stringify({
      mode: 'local',
      initialized: true,
      lastStartup: now,
      mongoDBAvailable: false
    }, null, 2)
  );
  console.log('DB status file created');
} catch (error) {
  console.error('Error creating DB status file:', error);
}

console.log('Local storage initialization complete!');
console.log('To run the backend, use: npm run dev');
console.log('Note: The application will try to connect to MongoDB but will fall back to local storage.'); 