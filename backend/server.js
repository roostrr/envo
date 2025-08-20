const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
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
    const flaskUrl = `http://localhost:5004${req.url}`;
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

// Flask app startup function
const startFlaskApp = () => {
  return new Promise((resolve, reject) => {
    console.log('Starting Flask ML service...');
    
    const flaskProcess = spawn('python', ['standardized_app.py'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let flaskStarted = false;

    flaskProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Flask: ${output.trim()}`);
      
      // Check if Flask app is ready
      if (output.includes('Running on http://127.0.0.1:5004') && !flaskStarted) {
        flaskStarted = true;
        console.log('✅ Flask ML service started successfully on port 5004');
        resolve(flaskProcess);
      }
    });

    flaskProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.log(`Flask Error: ${error.trim()}`);
    });

    flaskProcess.on('error', (error) => {
      console.error('❌ Failed to start Flask app:', error);
      reject(error);
    });

    flaskProcess.on('close', (code) => {
      console.log(`Flask process exited with code ${code}`);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!flaskStarted) {
        console.log('⚠️ Flask app startup timeout - continuing without Flask service');
        resolve(null);
      }
    }, 10000);
  });
};

// Start server
const PORT = process.env.PORT || 5001;
const startServer = async () => {
  await connectDB();
  
  // Start Flask app
  try {
    await startFlaskApp();
  } catch (error) {
    console.log('⚠️ Flask app failed to start - continuing without ML service');
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
};

startServer();

module.exports = app; 