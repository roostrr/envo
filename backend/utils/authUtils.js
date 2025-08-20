const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Decode JWT token without verification (for getting payload)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Generate access token from refresh token
const generateAccessTokenFromRefresh = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    return generateToken(decoded.id);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Generate temporary token (for password reset, etc.)
const generateTemporaryToken = (userId, purpose, expiresIn = '1h') => {
  return jwt.sign(
    { id: userId, purpose },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Verify temporary token
const verifyTemporaryToken = (token, purpose) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== purpose) {
      throw new Error('Invalid token purpose');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid temporary token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken,
  generateAccessTokenFromRefresh,
  isTokenExpired,
  getTokenExpiration,
  generateTemporaryToken,
  verifyTemporaryToken
}; 