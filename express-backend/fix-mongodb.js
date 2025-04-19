/**
 * MongoDB Connection Fix Script
 *
 * This script fixes the issue with the isMongoConnected function
 * in the localDataService.js file.
 */

const fs = require("fs");
const path = require("path");

// Path to the localDataService.js file
const LOCAL_DATA_SERVICE_PATH = path.join(
   __dirname,
   "utils",
   "localDataService.js"
);

console.log("Fixing MongoDB connection issue...");

try {
   // Read the file
   let content = fs.readFileSync(LOCAL_DATA_SERVICE_PATH, "utf8");

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
   fs.writeFileSync(LOCAL_DATA_SERVICE_PATH, content);

   console.log("Successfully fixed the MongoDB connection issue!");
   console.log(
      "The isMongoConnected function now properly checks the MongoDB connection status."
   );
} catch (error) {
   console.error("Error fixing MongoDB connection issue:", error);
   process.exit(1);
}
