const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // We'll use bcrypt for password hashing

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true, // Ensure usernames are unique
      trim: true, // Remove leading/trailing whitespace
      minlength: [3, 'Username must be at least 3 characters long'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    fullName: {
      type: String,
      default: '', // Can be empty initially
      trim: true,
    },
    city: {
      type: String,
      default: '', // Can be empty initially
      trim: true,
    },
    state: {
      type: String,
      default: '', // Can be empty initially
      trim: true,
    },
    // You could add other fields like registration date, etc.
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
  }
);

// Middleware to hash the password before saving a user
userSchema.pre('save', async function (next) {
  // Only hash if the password field is modified
  if (!this.isModified('password')) {
    next();
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);

module.exports = User;