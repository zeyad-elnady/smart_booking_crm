# Smart Booking CRM

A modern CRM system for managing appointments, customers, and services.

## Features

-  Customer Management
-  Appointment Scheduling
-  Service Management
-  Dashboard with Analytics
-  Offline Support
-  Real-time Notifications

## Tech Stack

### Frontend

-  Next.js 14
-  TypeScript
-  Tailwind CSS
-  IndexedDB for offline storage
-  React Query for data fetching

### Backend

-  Node.js
-  Express.js
-  MongoDB
-  JWT Authentication

## Prerequisites

-  Node.js version 18.x or 20.x (LTS versions recommended)
-  MongoDB installed and running locally
-  npm or yarn package manager

## Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/smart-booking-crm.git
   cd smart-booking-crm
   ```

2. Run the setup script:

   ```bash
   npm run setup
   ```

   This will:

   -  Check Node.js version compatibility
   -  Create necessary .env files
   -  Fix MongoDB connection issues
   -  Install all dependencies
   -  Set up the data directory

3. Start the development servers:

   ```bash
   npm run dev
   ```

4. Access the application:
   -  Frontend: http://localhost:3000
   -  Backend API: http://localhost:5000

## Troubleshooting

### Node.js Version Issues

If you encounter Node.js version-related issues:

1. Install nvm (Node Version Manager):

   ```bash
   # Windows
   winget install CoreyButler.NVMforWindows

   # macOS/Linux
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. Install and use a compatible Node.js version:
   ```bash
   nvm install 18
   nvm use 18
   ```

### Memory Issues

If you encounter memory-related issues:

1. The setup script automatically adds memory configuration to .env files
2. You can manually increase the memory limit by setting NODE_OPTIONS:

   ```bash
   # Windows
   set NODE_OPTIONS=--max-old-space-size=4096

   # macOS/Linux
   export NODE_OPTIONS=--max-old-space-size=4096
   ```

### Clean Installation

If you need to start fresh:

```bash
npm run clean
npm run setup
```

## Available Scripts

-  `npm run setup` - Run the setup script
-  `npm run dev` - Start development servers
-  `npm run build` - Build the frontend
-  `npm run start` - Start the production server
-  `npm run clean` - Clean all node_modules

## Project Structure

```
smart-booking-crm/
├── frontend/           # Next.js frontend
├── express-backend/    # Express.js backend
├── setup-project.js    # Setup script
└── package.json       # Root package.json
```

## Data Storage

The application uses a hybrid storage approach:

-  If MongoDB is available, it will use MongoDB for data storage
-  If MongoDB is not available, it will automatically fall back to local file storage
-  Local data is stored in the `express-backend/data` directory

## Need Help?

Contact the development team for assistance.

## Development

-  Backend runs on port 5000
-  Frontend runs on port 3000
-  MongoDB runs on default port 27017

## Testing

```bash
# Run backend tests
cd express-backend
npm test

# Run frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
