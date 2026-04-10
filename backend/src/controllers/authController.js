// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // Generate JWT token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || '7d',
//   });
// };

// // @desc    Register a new user
// // @route   POST /api/auth/signup
// // @access  Public
// const signup = async (req, res) => {
//   try {
//     const { name, email, password, organization, role, country } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: 'An account with this email already exists.',
//       });
//     }

//     // Create user (password will be hashed via pre-save hook)
//     const user = await User.create({
//       name,
//       email,
//       password,
//       organization,
//       role: role || 'user',
//       country,
//     });

//     const token = generateToken(user._id);

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save({ validateBeforeSave: false });

//     res.status(201).json({
//       success: true,
//       message: 'Account created successfully!',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         organization: user.organization,
//         role: user.role,
//         country: user.country,
//         createdAt: user.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error('Signup error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during registration.',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined,
//     });
//   }
// };

// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user with password field included
//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password.',
//       });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({
//         success: false,
//         message: 'Your account has been deactivated.',
//       });
//     }

//     const isPasswordMatch = await user.matchPassword(password);
//     if (!isPasswordMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password.',
//       });
//     }

//     const token = generateToken(user._id);

//     // Update last login timestamp
//     user.lastLogin = new Date();
//     await user.save({ validateBeforeSave: false });

//     res.status(200).json({
//       success: true,
//       message: 'Login successful!',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         organization: user.organization,
//         role: user.role,
//         country: user.country,
//         lastLogin: user.lastLogin,
//       },
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login.',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined,
//     });
//   }
// };

// // @desc    Get current logged-in user
// // @route   GET /api/auth/me
// // @access  Private
// const getMe = async (req, res) => {
//   res.status(200).json({
//     success: true,
//     user: req.user,
//   });
// };

// module.exports = { signup, login, getMe };



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

    // 🔥 4. Prevent random admin creation
    if (role === 'admin') {
      // allow only if no users exist OR add your logic
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        role = 'user'; // downgrade
      }
    }

    // 🔥 5. Handle organization (string or ObjectId)
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