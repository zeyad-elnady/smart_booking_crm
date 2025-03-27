# Smart Booking CRM

A modern, responsive appointment and service booking system built with Next.js, React, and Express.js.

## Project Structure

This project consists of two main parts:

1. **Frontend**: A Next.js application with a modern dark glassmorphism UI
2. **Backend**: An Express.js API with MongoDB database for data storage

## Features

- User authentication and authorization
- Service management (create, read, update, delete)
- Customer management
- Appointment scheduling and management
- Dark theme with glassmorphism design
- Responsive layout for all devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or accessible via connection string)
- npm or yarn

### Running the Backend

1. Navigate to the backend directory:
   ```
   cd express-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smartbooking
   JWT_SECRET=your_jwt_secret_should_be_changed_in_production
   NODE_ENV=development
   ```

4. Start the development server:
   ```
   npm run dev
   ```

The backend API will be available at http://localhost:5000

### Running the Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The frontend application will be available at http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/users` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get a service by ID
- `POST /api/services` - Create a new service (protected)
- `PUT /api/services/:id` - Update a service (protected)
- `DELETE /api/services/:id` - Delete a service (protected)

### Customers
- `GET /api/customers` - Get all customers (protected)
- `GET /api/customers/:id` - Get a customer by ID (protected)
- `POST /api/customers` - Create a new customer (protected)
- `PUT /api/customers/:id` - Update a customer (protected)
- `DELETE /api/customers/:id` - Delete a customer (protected)

### Appointments
- `GET /api/appointments` - Get all appointments (protected)
- `GET /api/appointments/:id` - Get an appointment by ID (protected)
- `POST /api/appointments` - Create a new appointment (protected)
- `PUT /api/appointments/:id` - Update an appointment (protected)
- `DELETE /api/appointments/:id` - Delete an appointment (protected)

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Axios
- Tailwind CSS

### Backend
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

## Future Enhancements

- Email notifications for appointments
- Calendar integration
- Analytics dashboard
- Payment processing

## License

This project is created for educational purposes. 