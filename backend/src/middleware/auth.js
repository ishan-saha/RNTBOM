
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // 🔍 Get token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // 🔥 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 Get user (exclude password + populate org)
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('organization', 'name');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Invalid token.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    // ✅ attach user
    req.user = user;

    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);

    // 🔥 Better error handling
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};


// 👑 Role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role '${req.user?.role}'`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
