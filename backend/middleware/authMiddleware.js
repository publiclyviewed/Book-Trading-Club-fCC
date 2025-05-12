const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const protect = async (req, res, next) => {
  let token;

  // Check for token in the Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by the ID in the token and attach to the request object
      // Exclude the password field
      req.user = await User.findById(decoded.id).select('-password');

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Not authorized, token failed', error);
      res.status(401).json({ message: 'Not authorized, token failed' }); // 401 Unauthorized
    }
  }

  // If no token is found
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' }); // 401 Unauthorized
  }
};

module.exports = { protect };