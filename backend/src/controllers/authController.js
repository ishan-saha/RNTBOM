
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');

// 🔐 Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ================= SIGNUP =================
const signup = async (req, res) => {
  try {
    let { name, email, password, organization, role, country } = req.body;

    // 🔥 1. Basic validation
    if (!name || !email || !password || !organization || !country) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // 🔥 2. Normalize email
    email = email.toLowerCase().trim();

    // 🔥 3. Prevent duplicate email (case-insensitive)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // 🔥 4. Handle organization (string or ObjectId)
    let org;

    if (mongoose.Types.ObjectId.isValid(organization)) {
      org = await Organization.findById(organization);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
      }
    } else {
      // treat as name
      const orgName = organization.trim().toLowerCase();

      org = await Organization.findOne({ name: orgName });

      if (!org) {
        org = await Organization.create({
          name: orgName,
        });
      }
    }

    // 🔥 6. Create user
    const user = await User.create({
      name,
      email,
      password,
      organization: org._id,
      role: role || 'user',
      country,
    });

    // 🔥 7. Populate org
    const populatedUser = await User.findById(user._id)
      .populate('organization', 'name');

    // 🔥 8. Generate token
    const token = generateToken(user._id);

    // 🔥 9. Update login info
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: populatedUser,
        token,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);

    // 🔥 Mongo duplicate key fallback
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate field error',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};


// ================= LOGIN =================
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email })
      .select('+password')
      .populate('organization', 'name');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id);

    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};


// ================= GET ME =================
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = { signup, login, getMe };