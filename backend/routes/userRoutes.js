const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/UserModel'); // Import the User model

// @desc    Get user profile/settings
// @route   GET /api/users/me
// @access  Private (requires token)
router.get('/me', protect, async (req, res) => {
  // req.user is available because of the protect middleware
  const user = req.user;

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      city: user.city,
      state: user.state,
    });
  } else {
    // This case should technically not happen if protect middleware works
    res.status(404).json({ message: 'User not found' });
  }
});


// @desc    Update user profile/settings
// @route   PUT /api/users/me
// @access  Private (requires token)
router.put('/me', protect, async (req, res) => {
  // req.user is available because of the protect middleware
  const user = req.user;

  if (user) {
    // Update fields if they are provided in the request body
    user.fullName = req.body.fullName !== undefined ? req.body.fullName : user.fullName;
    user.city = req.body.city !== undefined ? req.body.city : user.city;
    user.state = req.body.state !== undefined ? req.body.state : user.state;
    // Do NOT allow updating username or password directly via this route

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      city: updatedUser.city,
      state: updatedUser.state,
      // Do not send token back on update unless you specifically want to renew it
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});


module.exports = router;