const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password, fullName, city, state } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ username });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return; // Stop execution
  }

  // Create the new user
  const user = await User.create({
    username,
    password, // Mongoose pre-save middleware will hash this
    fullName,
    city,
    state,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      city: user.city,
      state: user.state,
      token: generateToken(user._id), // Send JWT back to the frontend
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  const user = await User.findOne({ username });

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      city: user.city,
      state: user.state,
      token: generateToken(user._id), // Send JWT back
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' }); // 401 Unauthorized
  }
});

module.exports = router;