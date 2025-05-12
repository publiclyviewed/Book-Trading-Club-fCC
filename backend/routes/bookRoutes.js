const express = require('express');
const router = express.Router();
const Book = require('../models/BookModel');
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware

// @desc    Get all books
// @route   GET /api/books
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find all books
    // Use .populate('owner', 'username fullName') to get selected user info instead of just the ID
    const books = await Book.find({}).populate('owner', 'username fullName city state');

    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Add a new book
// @route   POST /api/books
// @access  Private (requires token)
router.post('/', protect, async (req, res) => {
  try {
    const { title, author, imageUrl } = req.body;

    // Simple validation
    if (!title || !author) {
      return res.status(400).json({ message: 'Please include a title and author' });
    }

    // Create the new book, associating it with the logged-in user (req.user._id)
    const book = await Book.create({
      title,
      author,
      imageUrl,
      owner: req.user._id, // The owner is the currently logged-in user
    });

    // Optionally populate the owner field for the response
     const populatedBook = await book.populate('owner', 'username fullName city state');


    res.status(201).json(populatedBook); // 201 Created
  } catch (error) {
    console.error(error);
     // Mongoose validation errors might have specific messages
     if (error.name === 'ValidationError') {
        res.status(400).json({ message: error.message });
     } else {
        res.status(500).json({ message: 'Server Error' });
     }
  }
});

// @desc    Get books for a specific user (Optional but useful)
// @route   GET /api/books/user/:userId
// @access  Public (or Private if you only want users seeing their own list)
// router.get('/user/:userId', async (req, res) => {
//     try {
//         const books = await Book.find({ owner: req.params.userId }).populate('owner', 'username fullName city state');
//         res.status(200).json(books);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });


module.exports = router;