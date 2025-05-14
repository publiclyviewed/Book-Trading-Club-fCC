const express = require('express');
const router = express.Router();
const Trade = require('../models/TradeModel');
const Book = require('../models/BookModel'); // Need Book model to update ownership
const { protect } = require('../middleware/authMiddleware'); // Need protect middleware

// @desc    Propose a new trade
// @route   POST /api/trades
// @access  Private (requires token)
router.post('/', protect, async (req, res) => {
  const { targetBookId, offeredBookIds } = req.body; // Expecting IDs from frontend

  // Basic validation
  if (!targetBookId || !offeredBookIds || !Array.isArray(offeredBookIds) || offeredBookIds.length === 0) {
    return res.status(400).json({ message: 'Please provide a target book ID and at least one offered book ID.' });
  }

  try {
    // 1. Find the target book and ensure it exists and is not owned by the proposer
    const targetBook = await Book.findById(targetBookId).populate('owner');
    if (!targetBook) {
      return res.status(404).json({ message: 'Target book not found.' });
    }
    if (targetBook.owner._id.equals(req.user._id)) {
       return res.status(400).json({ message: 'You cannot propose a trade for your own book.' });
    }

    // 2. Find the offered books and ensure they exist and are owned by the proposer
    const offeredBooks = await Book.find({ _id: { $in: offeredBookIds } });
    if (offeredBooks.length !== offeredBookIds.length) {
        return res.status(404).json({ message: 'One or more offered books not found.' });
    }
    const allOfferedBooksOwnedByProposer = offeredBooks.every(book => book.owner.equals(req.user._id));
     if (!allOfferedBooksOwnedByProposer) {
         return res.status(400).json({ message: 'You can only offer books you own.' });
     }

    // 3. Check if a similar pending trade already exists (optional but good practice)
    const existingTrade = await Trade.findOne({
        proposer: req.user._id,
        targetBook: targetBookId,
        status: 'pending'
        // You might add checks for offered books too, but it gets complex
    });
    if (existingTrade) {
        return res.status(400).json({ message: 'A pending trade proposal for this book already exists.' });
    }


    // 4. Create the new trade proposal
    const trade = await Trade.create({
      proposer: req.user._id, // Logged-in user
      recipient: targetBook.owner._id, // Owner of the target book
      targetBook: targetBookId,
      offeredBooks: offeredBookIds,
      status: 'pending',
    });

    // Populate the created trade for a meaningful response
     const populatedTrade = await trade
       .populate('proposer', 'username fullName')
       .populate('recipient', 'username fullName')
       .populate('targetBook', 'title author')
       .populate('offeredBooks', 'title author');


    res.status(201).json(populatedTrade); // 201 Created

  } catch (error) {
    console.error('Error proposing trade:', error);
    res.status(500).json({ message: 'Server Error proposing trade.' });
  }
});

// @desc    Get incoming trade requests for the logged-in user
// @route   GET /api/trades/incoming
// @access  Private (requires token)
router.get('/incoming', protect, async (req, res) => {
    try {
        const incomingTrades = await Trade.find({ recipient: req.user._id })
            .populate('proposer', 'username fullName city state') // Get proposer details
            .populate('targetBook', 'title author') // Get target book details
            .populate('offeredBooks', 'title author') // Get offered books details
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json(incomingTrades);
    } catch (error) {
        console.error('Error fetching incoming trades:', error);
        res.status(500).json({ message: 'Server Error fetching incoming trades.' });
    }
});

// @desc    Get outgoing trade requests proposed by the logged-in user
// @route   GET /api/trades/outgoing
// @access  Private (requires token)
router.get('/outgoing', protect, async (req, res) => {
     try {
        const outgoingTrades = await Trade.find({ proposer: req.user._id })
            .populate('recipient', 'username fullName city state') // Get recipient details
            .populate('targetBook', 'title author') // Get target book details
            .populate('offeredBooks', 'title author') // Get offered books details
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json(outgoingTrades);
    } catch (error) {
        console.error('Error fetching outgoing trades:', error);
        res.status(500).json({ message: 'Server Error fetching outgoing trades.' });
    }
});


// @desc    Accept or Reject a trade proposal
// @route   PUT /api/trades/:tradeId
// @access  Private (requires token)
router.put('/:tradeId', protect, async (req, res) => {
  const { status } = req.body; // Expecting status: 'accepted' or 'rejected'
  const tradeId = req.params.tradeId;

  // Basic validation
  if (!status || !['accepted', 'rejected', 'cancelled'].includes(status)) { // Allow recipient to cancel too? User story doesn't say, but possible. Let's allow accept/reject for recipient.
     if (status !== 'accepted' && status !== 'rejected') { // Refine validation for recipient actions
       return res.status(400).json({ message: 'Invalid status provided. Must be "accepted" or "rejected".' });
     }
  }


  try {
    // 1. Find the trade proposal
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Trade proposal not found.' });
    }

    // 2. Ensure the logged-in user is the recipient of the trade
    if (!trade.recipient.equals(req.user._id)) {
       return res.status(403).json({ message: 'You are not authorized to respond to this trade.' }); // 403 Forbidden
    }

    // 3. Ensure the trade is still pending
    if (trade.status !== 'pending') {
      return res.status(400).json({ message: `Trade is already ${trade.status}. Cannot respond.` });
    }

    // 4. Update trade status
    trade.status = status;

    // 5. If status is 'accepted', perform the book ownership transfer
    if (status === 'accepted') {
        // Use a Mongoose session or transaction for atomicity if needed for high concurrency,
        // but for this project, simple updates should be sufficient.

        // Get the IDs for the update
        const targetBookId = trade.targetBook;
        const offeredBookIds = trade.offeredBooks;
        const proposerId = trade.proposer;
        const recipientId = trade.recipient;


        // Check if all books still exist and are with the correct owners
        // This is important to prevent issues if books were deleted or traded elsewhere
        const booksInTrade = await Book.find({ _id: { $in: [targetBookId, ...offeredBookIds] } });

        if (booksInTrade.length !== offeredBookIds.length + 1) {
             trade.status = 'cancelled'; // Auto-cancel if books are missing
             await trade.save();
             return res.status(400).json({ message: 'One or more books involved in the trade are missing. Trade cancelled.' });
        }

        const targetBookStillOwnedByRecipient = booksInTrade.find(book => book._id.equals(targetBookId))?.owner.equals(recipientId);
        const allOfferedBooksStillOwnedByProposer = offeredBooks.every(offeredId =>
            booksInTrade.find(book => book._id.equals(offeredId))?.owner.equals(proposerId)
        );

        if (!targetBookStillOwnedByRecipient || !allOfferedBooksStillOwnedByProposer) {
             trade.status = 'cancelled'; // Auto-cancel if ownership changed
             await trade.save();
             return res.status(400).json({ message: 'Ownership of books involved in the trade has changed. Trade cancelled.' });
        }


        // Perform the ownership transfer:
        // Target book now belongs to the proposer
        await Book.findByIdAndUpdate(targetBookId, { owner: proposerId });

        // Offered books now belong to the recipient
        // $in operator allows updating multiple documents by ID
        await Book.updateMany({ _id: { $in: offeredBookIds } }, { owner: recipientId });

        // Optional: Cancel any other pending trades involving these books
        // This prevents race conditions where multiple trades for the same book are accepted
        await Trade.updateMany(
            {
                _id: { $ne: tradeId }, // Exclude the current trade
                status: 'pending',
                $or: [ // Match trades involving any of the books in the current trade
                    { targetBook: { $in: [targetBookId, ...offeredBookIds] } },
                    { offeredBooks: { $in: [targetBookId, ...offeredBookIds] } }
                ]
            },
            { status: 'cancelled' } // Mark conflicting trades as cancelled
        );

    }

    // Save the updated trade status
    const updatedTrade = await trade.save();

    // Populate the updated trade for the response
     const populatedTrade = await updatedTrade
       .populate('proposer', 'username fullName')
       .populate('recipient', 'username fullName')
       .populate('targetBook', 'title author')
       .populate('offeredBooks', 'title author');


    res.status(200).json(populatedTrade);

  } catch (error) {
    console.error('Error updating trade status:', error);
    res.status(500).json({ message: 'Server Error updating trade status.' });
  }
});


module.exports = router;