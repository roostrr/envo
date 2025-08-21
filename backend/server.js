const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const careerRoutes = require('./routes/career');
const youtubeRoutes = require('./routes/youtube');
const aiRoutes = require('./routes/ai');
const contentRoutes = require('./routes/content');
const supportRoutes = require('./routes/support');
const summaryFeedbackRoutes = require('./routes/summaryFeedback');
const chatFeedbackRoutes = require('./routes/chatFeedback');

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/career', careerRoutes);
app.use('/api', youtubeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api', summaryFeedbackRoutes);
app.use('/api', chatFeedbackRoutes);

// Proxy routes for Flask ML service
app.all('/api/standardized/*', async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5004';
    const flaskUrl = `${mlServiceUrl}${req.url}`;
    console.log(`Proxying request to Flask: ${req.method} ${flaskUrl}`);
    
    const response = await axios({
      method: req.method,
      url: flaskUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Flask service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'ML service is not available',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'University Recruitment Platform API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'University Recruitment Platform API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
      nodejs: 'running',
      flask: 'checking...' // You can enhance this to actually check Flask status
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI_PROD, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Starting server without database connection...');
    console.log('Please install MongoDB or configure a cloud MongoDB instance');
  }
};

// Flask service check function
const checkFlaskService = async () => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL;
    if (mlServiceUrl) {
      const response = await axios.get(`${mlServiceUrl}/health`, { timeout: 5000 });
      console.log('✅ ML service is available');
      return true;
    } else {
      console.log('⚠️ ML_SERVICE_URL not configured');
      return false;
    }
  } catch (error) {
    console.log('⚠️ ML service is not available:', error.message);
    return false;
  }
};

// Start server
const PORT = process.env.PORT || 5001;
const startServer = async () => {
  await connectDB();
  
  // Check ML service availability
  await checkFlaskService();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
};

startServer();

module.exports = app; 