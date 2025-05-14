const mongoose = require('mongoose');

const tradeSchema = mongoose.Schema(
  {
    proposer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User who proposed the trade
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Reference to the User who owns the target book
    },
    targetBook: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Book', // Reference to the book the proposer wants
    },
    offeredBooks: [ // An array of books the proposer is offering
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Book', // References to the books offered by the proposer
      }
    ],
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'], // Possible statuses
      default: 'pending', // Default status when a trade is created
    },
    // Optional: Add fields like tradeMessage, timestamps (already in schema options)
    // tradeMessage: {
    //     type: String,
    //     default: ''
    // }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;