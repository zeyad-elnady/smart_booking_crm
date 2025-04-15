# Diagnostic Tools for Smart Booking CRM

This directory contains diagnostic tools and utilities to help troubleshoot the Smart Booking CRM application.

## Features

### API Connection Test

The API connection test (`ApiConnectionTest.tsx`) provides a simple interface to verify connectivity with the backend server. It:

- Tests the main API endpoint at http://localhost:5000
- Tests the appointments endpoint at http://localhost:5000/api/appointments/recent
- Shows detailed connection status and error messages
- Displays sample data when connection is successful
- Can be manually triggered to re-test connectivity

### System Information

The diagnostic page displays:

- Environment information (version, mode, runtime)
- Browser information via the `BrowserInfo.tsx` component
- Troubleshooting tips for common issues

## How to Use

1. Start both the frontend and backend servers:
   ```
   # In one terminal
   cd express-backend
   npm run dev
   
   # In another terminal
   cd frontend
   npm run dev
   ```

2. Navigate to the diagnostic page at `/diagnostic`

3. View connection status and system information

4. If connections fail, check the troubleshooting section for guidance

## Common Issues

- **API connection errors**: Ensure the backend server is running on port 5000
- **CORS issues**: The backend is configured to allow all origins for local development
- **Database errors**: The system can operate with local storage if MongoDB is not connected

## Development

To extend the diagnostic tools:

1. Add new components in the components directory
2. Update the diagnostic page to include them
3. Keep error messages clear and actionable

The diagnostic tools are designed to be developer-friendly and provide clear feedback for troubleshooting. 