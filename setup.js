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

// Check if Node.js version is sufficient
const nodeVersion = process.version;
const nodeVersionNum = parseFloat(nodeVersion.substring(1));
if (nodeVersionNum < 18) {
   console.error(
      `${colors.red}Error: Node.js version 18 or higher is required. Current version: ${nodeVersion}${colors.reset}`
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
NODE_ENV=development`;
   fs.writeFileSync(backendEnvPath, backendEnvContent);
   console.log(`${colors.green}Backend .env file created.${colors.reset}`);
}

// Create frontend .env file if it doesn't exist
const frontendEnvPath = path.join(__dirname, "frontend", ".env");
if (!fs.existsSync(frontendEnvPath)) {
   console.log(`${colors.yellow}Creating frontend .env file...${colors.reset}`);
   const frontendEnvContent = `NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000`;
   fs.writeFileSync(frontendEnvPath, frontendEnvContent);
   console.log(`${colors.green}Frontend .env file created.${colors.reset}`);
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
2. Start the backend: ${colors.yellow}cd express-backend && npm run dev${colors.reset}
3. Start the frontend: ${colors.yellow}cd frontend && npm run dev${colors.reset}

${colors.blue}Or use the root script to start both:${colors.reset}
${colors.yellow}npm run dev${colors.reset}

${colors.blue}Access the application:${colors.reset}
- Frontend: ${colors.yellow}http://localhost:3000${colors.reset}
- Backend API: ${colors.yellow}http://localhost:5000${colors.reset}
`);
