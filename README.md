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

## Quick Start Guide

### Prerequisites

-  Node.js (v18 or higher)
-  MongoDB (v5 or higher)
-  npm or yarn

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd smart-booking-crm

# Run the setup script
npm run setup
```

This will:

-  Check your Node.js version
-  Create necessary .env files
-  Install all dependencies for frontend and backend

### Step 2: Fix MongoDB Connection Issue (Important!)

If you encounter crashes or database connection issues, run:

```bash
cd express-backend
npm run fix-mongodb
```

This will fix a known issue with the MongoDB connection handling.

### Step 3: Start the Application

1. Start MongoDB:

```bash
mongod
```

2. Start the application (this will start both frontend and backend):

```bash
npm run dev
```

3. Access the application:

-  Frontend: http://localhost:3000
-  Backend API: http://localhost:5000

## Troubleshooting

If you encounter any issues:

1. Make sure MongoDB is running
2. Check if all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check if ports 3000 and 5000 are available
5. Run the fix-mongodb script if you have database connection issues

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
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
