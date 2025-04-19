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

-  Node.js (v18 or higher)
-  MongoDB (v5 or higher)
-  npm or yarn

## Setup Instructions

1. Clone the repository:

```bash
git clone <repository-url>
cd smart-booking-crm
```

2. Install dependencies:

```bash
# Install backend dependencies
cd express-backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:

   -  Copy `.env.example` to `.env` in both frontend and backend directories
   -  Update the variables as needed

4. Start MongoDB:

```bash
mongod
```

5. Start the backend server:

```bash
cd express-backend
npm run dev
```

6. Start the frontend development server:

```bash
cd frontend
npm run dev
```

7. Access the application:
   -  Frontend: http://localhost:3000
   -  Backend API: http://localhost:5000

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
