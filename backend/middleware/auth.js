const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../utils/authUtils');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};

// Middleware to check if user is institution
const institutionAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.userType !== 'institution' && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Institution privileges required.'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Institution auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in institution authentication'
    });
  }
};

// Middleware to check if user is verified
const verifiedAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!req.user.isEmailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Email verification required'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Verified auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in verification check'
    });
  }
};

// Middleware to check if user can access specific resource
const resourceAuth = (resourceType) => {
  return async (req, res, next) => {
    try {
      await auth(req, res, () => {
        const user = req.user;
        
        // Admin can access everything
        if (user.userType === 'admin') {
          return next();
        }

        // Institution can access institution-specific resources
        if (user.userType === 'institution') {
          if (resourceType === 'institution' || resourceType === 'public') {
            return next();
          }
        }

        // Regular users can access public resources and their own data
        if (user.userType === 'regular') {
          if (resourceType === 'public' || 
              (resourceType === 'user' && req.params.userId === user._id.toString())) {
            return next();
          }
        }

        return res.status(403).json({
          success: false,
          message: 'Access denied to this resource'
        });
      });
    } catch (error) {
      console.error('Resource auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in resource authentication'
      });
    }
  };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

// Rate limiting middleware for authentication attempts
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!attempts.has(ip)) {
      attempts.set(ip, { count: 0, resetTime: now + windowMs });
    }

    const attempt = attempts.get(ip);
    
    if (now > attempt.resetTime) {
      attempt.count = 0;
      attempt.resetTime = now + windowMs;
    }

    attempt.count++;

    if (attempt.count > maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
      });
    }

    next();
  };
};

module.exports = {
  auth,
  adminAuth,
  institutionAuth,
  verifiedAuth,
  resourceAuth,
  optionalAuth,
  authRateLimit
}; 