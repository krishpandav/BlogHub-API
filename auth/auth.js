const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { logMessage } = require('../common/log.js');
const folder = 'auth';

const adminAuth = (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }
    next();

  } catch (error) {
    console.error('Admin middleware error:', error.message);
    logMessage(`${folder}/adminAuth`, error, req);
    return res.status(500).json({
      success: false,
      message: 'Server error in admin middleware'
    });
  }
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is active
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active'
      });
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error.message);
    logMessage(`${folder}/auth`, error, req);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { auth, adminAuth };
