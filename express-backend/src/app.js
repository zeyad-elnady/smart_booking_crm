const express = require('express');
const cors = require('cors');
const clientsRouter = require('./routes/clients');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/clients', clientsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: res.translate ? res.translate('serverError') : 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: res.translate ? res.translate('notFound') : 'Not found',
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 