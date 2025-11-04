// src/controllers/authController.js
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendResponse, sendError } = require('../utils/responseHandler');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'USER'
    });

    // Generate token
    const token = generateToken(user._id);

    sendResponse(res, 201, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    }, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Generate token
    const token = generateToken(user._id);

    sendResponse(res, 200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};