/**
 * Smart Booking CRM - Project Setup Script
 *
 * This script handles all setup and configuration for the project,
 * including fixing known issues with MongoDB connection and data storage.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for console output
const colors = {
   reset: "\x1b[0m",
   green: "\x1b[32m",
   yellow: "\x1b[33m",
   red: "\x1b[31m",
   blue: "\x1b[34m",
};

console.log(`${colors.blue}Starting Smart Booking CRM setup...${colors.reset}`);

// Check if Node.js version is compatible
const nodeVersion = process.version;
const nodeVersionNum = parseFloat(nodeVersion.substring(1));
if (nodeVersionNum < 18 || nodeVersionNum >= 23) {
   console.error(
      `${colors.red}Error: Node.js version 18-22 is required. Current version: ${nodeVersion}${colors.reset}`
   );
   console.log(
      `${colors.yellow}Please install a compatible Node.js version using nvm or your preferred version manager.${colors.reset}`
   );
   process.exit(1);
}

// Create backend .env file if it doesn't exist
const backendEnvPath = path.join(__dirname, "express-backend", ".env");
if (!fs.existsSync(backendEnvPath)) {
   console.log(`${colors.yellow}Creating backend .env file...${colors.reset}`);
   const backendEnvContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_booking_crm
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
NODE_OPTIONS=--max-old-space-size=4096`;
   fs.writeFileSync(backendEnvPath, backendEnvContent);
   console.log(`${colors.green}Backend .env file created.${colors.reset}`);
}

// Create frontend .env file if it doesn't exist
const frontendEnvPath = path.join(__dirname, "frontend", ".env");
if (!fs.existsSync(frontendEnvPath)) {
   console.log(`${colors.yellow}Creating frontend .env file...${colors.reset}`);
   const frontendEnvContent = `NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_OPTIONS=--max-old-space-size=4096`;
   fs.writeFileSync(frontendEnvPath, frontendEnvContent);
   console.log(`${colors.green}Frontend .env file created.${colors.reset}`);
}

// Fix MongoDB connection issue
console.log(
   `${colors.yellow}Fixing MongoDB connection issue...${colors.reset}`
);
try {
   const localDataServicePath = path.join(
      __dirname,
      "express-backend",
      "utils",
      "localDataService.js"
   );
   if (fs.existsSync(localDataServicePath)) {
      let content = fs.readFileSync(localDataServicePath, "utf8");

      // Find the isMongoConnected function
      const functionRegex =
         /const isMongoConnected = \(\) => \{[\s\S]*?return true;[\s\S]*?\}/;

      // Replace it with the correct implementation
      const newImplementation = `const isMongoConnected = () => {
  try {
    // Check MongoDB connection state
    const mongooseState = require('mongoose').connection.readyState;
    return mongooseState === 1;
  } catch (error) {
    console.error("Error checking MongoDB connection:", error);
    return false;
  }
}`;

      content = content.replace(functionRegex, newImplementation);

      // Write the updated content back to the file
      fs.writeFileSync(localDataServicePath, content);
      console.log(
         `${colors.green}Successfully fixed the MongoDB connection issue!${colors.reset}`
      );
   } else {
      console.log(
         `${colors.yellow}localDataService.js not found. Skipping MongoDB fix.${colors.reset}`
      );
   }
} catch (error) {
   console.error(
      `${colors.red}Error fixing MongoDB connection issue: ${error.message}${colors.reset}`
   );
}

// Create data directory for local storage
const dataDir = path.join(__dirname, "express-backend", "data");
if (!fs.existsSync(dataDir)) {
   console.log(
      `${colors.yellow}Creating data directory for local storage...${colors.reset}`
   );
   fs.mkdirSync(dataDir, { recursive: true });

   // Initialize local data file
   const localDataPath = path.join(dataDir, "local-data.json");
   const initialData = {
      users: [],
      customers: [],
      appointments: [],
      services: [],
      lastUpdated: new Date().toISOString(),
   };

   fs.writeFileSync(localDataPath, JSON.stringify(initialData, null, 2));
   console.log(`${colors.green}Initialized local data storage.${colors.reset}`);
}

// Install dependencies
console.log(`${colors.yellow}Installing dependencies...${colors.reset}`);

try {
   // Install root dependencies
   console.log(`${colors.blue}Installing root dependencies...${colors.reset}`);
   execSync("npm install", { stdio: "inherit" });

   // Install backend dependencies
   console.log(
      `${colors.blue}Installing backend dependencies...${colors.reset}`
   );
   execSync("cd express-backend && npm install", { stdio: "inherit" });

   // Install frontend dependencies
   console.log(
      `${colors.blue}Installing frontend dependencies...${colors.reset}`
   );
   execSync("cd frontend && npm install", { stdio: "inherit" });

   console.log(
      `${colors.green}All dependencies installed successfully!${colors.reset}`
   );
} catch (error) {
   console.error(
      `${colors.red}Error installing dependencies: ${error.message}${colors.reset}`
   );
   process.exit(1);
}

console.log(`
${colors.green}Setup completed successfully!${colors.reset}

${colors.blue}To start the application:${colors.reset}
1. Start MongoDB: ${colors.yellow}mongod${colors.reset}
2. Start the application: ${colors.yellow}npm run dev${colors.reset}

${colors.blue}Access the application:${colors.reset}
- Frontend: ${colors.yellow}http://localhost:3000${colors.reset}
- Backend API: ${colors.yellow}http://localhost:5000${colors.reset}

${colors.blue}Important Notes:${colors.reset}
- The application will work with or without MongoDB running
- If MongoDB is not available, it will automatically use local file storage
- All data is stored in the ${colors.yellow}express-backend/data${colors.reset} directory
- If you encounter memory issues, try running with: ${colors.yellow}NODE_OPTIONS=--max-old-space-size=4096${colors.reset}
`);
