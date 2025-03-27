# Smart Booking CRM Backend

This is the backend API for the Smart Booking CRM system, a booking and appointment management system for small businesses.

## Features

- User authentication and authorization with JWT
- Service management (CRUD operations)
- Customer management (CRUD operations)
- Appointment scheduling and management
- RESTful API design

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (installed locally or accessible via connection string)

### Installation

1. Clone the repository
2. Navigate to the project directory: `cd express-backend`
3. Install dependencies: `npm install`
4. Create a `.env` file based on the `.env.example` file
5. Start the development server: `npm run dev`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartbooking
JWT_SECRET=your_jwt_secret_should_be_changed_in_production
NODE_ENV=development
```

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

## Future Enhancements

- Email notifications for appointments
- Calendar integration
- Analytics dashboard
- Payment processing

## License

This project is created for educational purposes. 