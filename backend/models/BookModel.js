const mongoose = require('mongoose');

const bookSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a book title'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Please add the author(s)'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId, // This field will store the user's ID
      required: true,
      ref: 'User', // This tells Mongoose that this ObjectId refers to the 'User' model
    },
    imageUrl: { // Optional: Add a field for a book cover image URL
        type: String,
        default: '',
        trim: true,
    }
    // You could add other fields like ISBN, publication year, description, etc.
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;