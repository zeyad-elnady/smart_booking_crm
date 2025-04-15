const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const localDataService = require('./utils/localDataService');

// Load environment variables
dotenv.config();

// Create data directory if it doesn't exist
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Connect to database
console.log('Connecting to database...');
connectDB();

// Import routes
const serviceRoutes = require('./routes/serviceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Enhanced CORS setup for local development across different URLs
app.use(cors({
  origin: true, // Allow any origin
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Allow pre-flight requests for all routes
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware - DISABLED TO FIX INFINITE LOOP
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
//   console.log('Headers:', JSON.stringify(req.headers));
//   if (req.body && Object.keys(req.body).length > 0) {
//     const sanitizedBody = { ...req.body };
//     if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
//     console.log('Body:', JSON.stringify(sanitizedBody));
//   }
//   next();
// });

// Simple request logger that doesn't output to console
app.use((req, res, next) => {
  // Skip logging but keep middleware
  next();
});

// Logging in development mode - DISABLED TO FIX INFINITE LOOP
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// Health check route for API connectivity testing
app.get('/', (req, res) => {
  const dbStatus = localDataService.isMongoConnected() 
    ? 'connected' 
    : 'using local storage';
  
  res.json({ 
    message: 'Smart Booking CRM API', 
    status: 'online',
    database: dbStatus,
    timestamp: new Date().toISOString() 
  });
});

// Database status and operations routes
app.get('/api/db/status', (req, res) => {
  const isConnected = localDataService.isMongoConnected();
  const statusFile = path.join(DATA_DIR, 'db-status.json');
  let syncStatus = {};
  
  // Read sync status if it exists
  if (fs.existsSync(statusFile)) {
    try {
      syncStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    } catch (error) {
      console.error('Error reading status file:', error);
    }
  }
  
  // Get local storage stats
  const backupFiles = fs.existsSync(DATA_DIR) 
    ? fs.readdirSync(DATA_DIR).filter(file => file.startsWith('backup-')).length 
    : 0;
  
  res.json({
    mongodb: {
      connected: isConnected,
      url: isConnected ? process.env.MONGODB_URI : null
    },
    localStorage: {
      available: true,
      backupCount: backupFiles
    },
    lastSync: syncStatus.endTime || null,
    syncSuccess: syncStatus.success || false
  });
});

// Trigger manual database sync
app.post('/api/db/sync', async (req, res) => {
  try {
    // Import the sync function
    const syncDatabases = require('./scripts/syncDatabases');
    
    // Run the sync as a background process
    res.json({ 
      message: 'Database synchronization started',
      status: 'running'
    });
    
    // Execute sync after sending response
    syncDatabases().then(success => {
      console.log(`Manual sync completed with status: ${success ? 'success' : 'failed'}`);
    }).catch(error => {
      console.error('Manual sync error:', error);
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to start synchronization',
      error: error.message
    });
  }
});

// Export data route
app.get('/api/db/export', (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const exportPath = path.join(DATA_DIR, `export-${timestamp}.json`);
    
    const result = localDataService.exportData(exportPath);
    
    if (result.success) {
      res.json({
        message: 'Data exported successfully',
        path: result.path
      });
    } else {
      res.status(500).json({
        message: 'Export failed',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Export failed',
      error: error.message
    });
  }
});

// Mount routes
app.use('/api/services', serviceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Setup periodic database synchronization
let syncInterval = null;
const setupPeriodicSync = () => {
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Set up periodic sync every 15 minutes if MongoDB is connected
  syncInterval = setInterval(async () => {
    if (localDataService.isMongoConnected()) {
      console.log('Running scheduled database synchronization...');
      try {
        const syncDatabases = require('./scripts/syncDatabases');
        await syncDatabases();
      } catch (error) {
        console.error('Scheduled sync error:', error);
      }
    }
  }, 15 * 60 * 1000); // 15 minutes
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT} and http://<your-ip-address>:${PORT}`);
  
  // Set up periodic database sync
  setupPeriodicSync();
  
  // Initial database sync if MongoDB is connected
  if (localDataService.isMongoConnected()) {
    console.log('Performing initial database synchronization...');
    const syncDatabases = require('./scripts/syncDatabases');
    syncDatabases().catch(error => {
      console.error('Initial sync error:', error);
    });
  }
  
  // Log startup message for debugging
  console.log('==========================================================');
  console.log('Server started successfully with CORS enabled for all origins');
  console.log('The server is accessible from any device on your network');
  console.log('==========================================================');
}); 