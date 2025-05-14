const express = require('express');
const router = express.Router();
const Trade = require('../models/TradeModel');
const Book = require('../models/BookModel'); // Need Book model to update ownership
const { protect } = require('../middleware/authMiddleware'); // Need protect middleware

// @desc    Propose a new trade
// @route   POST /api/trades
// @access  Private (requires token)
router.post('/', protect, async (req, res) => {
  console.log('Received POST /api/trades request'); // Debug Log 1
  console.log('Request body:', req.body); // Debug Log 2 (What backend received)
  console.log('Authenticated user ID:', req.user._id); // Debug Log 3 (Who is proposing)


  const { targetBookId, offeredBookIds } = req.body; // Expecting IDs from frontend

  // Basic validation
  if (!targetBookId || !offeredBookIds || !Array.isArray(offeredBookIds) || offeredBookIds.length === 0) {
    console.warn('Validation failed for trade proposal:', req.body); // Debug Log 4
    return res.status(400).json({ message: 'Please provide a target book ID and at least one offered book ID.' });
  }

  try {
    // 1. Find the target book and ensure it exists and is not owned by the proposer
    console.log('Attempting to find target book with ID:', targetBookId); // Debug Log 5
    const targetBook = await Book.findById(targetBookId).populate('owner');
    console.log('Result of finding target book:', targetBook ? { _id: targetBook._id, owner: targetBook.owner?._id } : 'Not found'); // Debug Log 6 (Log details if found)

    if (!targetBook) {
      console.warn('Target book not found:', targetBookId); // Debug Log 7
      return res.status(404).json({ message: 'Target book not found.' });
    }
    if (targetBook.owner._id.equals(req.user._id)) {
       console.warn('Proposer owns target book:', req.user._id, targetBookId); // Debug Log 8
       return res.status(400).json({ message: 'You cannot propose a trade for your own book.' });
    }

    // 2. Find the offered books and ensure they exist and are owned by the proposer
    console.log('Attempting to find offered books with IDs:', offeredBookIds); // Debug Log 9
    const offeredBooks = await Book.find({ _id: { $in: offeredBookIds } });
    console.log('Result of finding offered books (count):', offeredBooks.length); // Debug Log 10

    if (offeredBooks.length !== offeredBookIds.length) {
        console.warn('Mismatch in offered books found vs requested:', offeredBooks.length, offeredBookIds.length); // Debug Log 11
        return res.status(404).json({ message: 'One or more offered books not found.' });
    }
    const allOfferedBooksOwnedByProposer = offeredBooks.every(book => book.owner.equals(req.user._id));
     if (!allOfferedBooksOwnedByProposer) {
         console.warn('Offered books not owned by proposer:', req.user._id, offeredBookIds); // Debug Log 12
         return res.status(400).json({ message: 'You can only offer books you own.' });
     }

    // 3. Check if a similar pending trade already exists (optional but good practice)
    console.log('Checking for existing pending trade...'); // Debug Log 13
    const existingTrade = await Trade.findOne({
        proposer: req.user._id,
        targetBook: targetBookId,
        status: 'pending'
        // You might add checks for offered books too, but it gets complex
    });
     console.log('Existing pending trade found:', !!existingTrade); // Debug Log 14
    if (existingTrade) {
         console.warn('Existing pending trade found for this book.'); // Debug Log 15
         return res.status(400).json({ message: 'A pending trade proposal for this book already exists.' });
    }


    // 4. Create the new trade proposal
    console.log('Attempting to create trade...'); // Debug Log 16
    const trade = await Trade.create({
      proposer: req.user._id, // Logged-in user
      recipient: targetBook.owner._id, // Owner of the target book
      targetBook: targetBookId,
      offeredBooks: offeredBookIds,
      status: 'pending',
    });
    console.log('Trade created with ID:', trade._id); // Debug Log 17

    // Populate the created trade for a meaningful response - Using array syntax
     console.log('Attempting to populate created trade using array syntax...'); // Debug Log 18
     const populatedTrade = await trade.populate([
       { path: 'proposer', select: 'username fullName' },
       { path: 'recipient', select: 'username fullName' },
       { path: 'targetBook', select: 'title author' },
       { path: 'offeredBooks', select: 'title author' }
     ]);
     console.log('Trade populated successfully.'); // Debug Log 19


    res.status(201).json(populatedTrade); // 201 Created

  } catch (error) {
    // This catches any unhandled error that occurred in the try block
    console.error('Error details within POST /api/trades catch block:', error); // <-- Crucial Debug Log
    // You can inspect the 'error' object here in the backend terminal
    // Example: if (error.name === 'CastError') { ... }

    res.status(500).json({ message: 'Server Error proposing trade.' }); // Send generic error to frontend
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
  console.log('Received PUT /api/trades/:tradeId request'); // <-- Debug Log PUT 1
  console.log('Trade ID from params:', req.params.tradeId); // <-- Debug Log PUT 2
  console.log('Request body:', req.body); // <-- Debug Log PUT 3 (What backend received)

  const { status } = req.body; // Expecting status: 'accepted' or 'rejected'
  const tradeId = req.params.tradeId;

  // Basic validation
  console.log('Validating received status:', status); // <-- Debug Log PUT 4
  if (!status || !['accepted', 'rejected', 'cancelled'].includes(status)) {
     if (status !== 'accepted' && status !== 'rejected') {
        console.warn('Validation failed: Invalid status provided', status); // <-- Debug Log PUT 5
       return res.status(400).json({ message: 'Invalid status provided. Must be "accepted" or "rejected".' });
     }
  }
  console.log('Status validation passed.'); // <-- Debug Log PUT 6


  try {
    // 1. Find the trade proposal
    console.log('Attempting to find trade with ID:', tradeId); // <-- Debug Log PUT 7
    const trade = await Trade.findById(tradeId);
    console.log('Found trade:', trade ? { _id: trade._id, status: trade.status } : 'Not found'); // <-- Debug Log PUT 8

    if (!trade) {
       console.warn('Trade not found:', tradeId); // <-- Debug Log PUT 9
      return res.status(404).json({ message: 'Trade proposal not found.' });
    }

    // 2. Ensure the logged-in user is the recipient of the trade
     console.log('Checking if user is recipient. Trade recipient:', trade.recipient, 'User ID:', req.user._id); // <-- Debug Log PUT 10
    if (!trade.recipient.equals(req.user._id)) {
       console.warn('User not authorized for this trade action.'); // <-- Debug Log PUT 11
       return res.status(403).json({ message: 'You are not authorized to respond to this trade.' }); // 403 Forbidden
    }

    // 3. Ensure the trade is still pending
    console.log('Checking if trade status is pending. Current status:', trade.status); // <-- Debug Log PUT 12
    if (trade.status !== 'pending') {
      console.warn('Trade is not pending:', trade.status); // <-- Debug Log PUT 13
      return res.status(400).json({ message: `Trade is already ${trade.status}. Cannot respond.` });
    }
     console.log('Trade status is pending. Proceeding.'); // <-- Debug Log PUT 14


    // 4. Update trade status
    console.log(`Updating trade status to: ${status}`); // <-- Debug Log PUT 15
    trade.status = status;

    // 5. If status is 'accepted', perform the book ownership transfer
    if (status === 'accepted') {
        console.log('Trade accepted. Performing ownership transfer.'); // <-- Debug Log PUT 16
        // Use a Mongoose session or transaction for atomicity if needed for high concurrency,
        // but for this project, simple updates should be sufficient.

        // Get the IDs for the update
        const targetBookId = trade.targetBook;
        const offeredBookIds = trade.offeredBooks;
        const proposerId = trade.proposer;
        const recipientId = trade.recipient;


        // Check if all books still exist and are with the correct owners
        // This is important to prevent issues if books were deleted or traded elsewhere
        console.log('Checking if books in trade still exist and have correct owners...'); // <-- Debug Log PUT 16a
        const booksInTrade = await Book.find({ _id: { $in: [targetBookId, ...offeredBookIds] } });
        console.log('Found books in trade (count):', booksInTrade.length); // <-- Debug Log PUT 16b


        if (booksInTrade.length !== offeredBookIds.length + 1) {
             console.warn('One or more books involved in the trade are missing.'); // <-- Debug Log PUT 16c
             trade.status = 'cancelled'; // Auto-cancel if books are missing
             await trade.save(); // Save the cancellation status
             return res.status(400).json({ message: 'One or more books involved in the trade are missing. Trade cancelled.' });
        }

        // Helper function to check ownership from the fetched booksInTrade array
        const getBookOwnerFromFetched = (bookIdToCheck) => {
            const book = booksInTrade.find(book => book._id.equals(bookIdToCheck));
            return book ? book.owner : null;
        };

        const targetBookStillOwnedByRecipient = getBookOwnerFromFetched(targetBookId)?.equals(recipientId);
        const allOfferedBooksStillOwnedByProposer = offeredBookIds.every(offeredId =>
            getBookOwnerFromFetched(offeredId)?.equals(proposerId)
        );

        console.log('Ownership check results: Target book with recipient?', targetBookStillOwnedByRecipient, 'Offered books with proposer?', allOfferedBooksStillOwnedByProposer); // <-- Debug Log PUT 16d


        if (!targetBookStillOwnedByRecipient || !allOfferedBooksStillOwnedByProposer) {
             console.warn('Ownership check failed. Ownership changed.'); // <-- Debug Log PUT 16e
             trade.status = 'cancelled'; // Auto-cancel if ownership changed
             await trade.save(); // Save the cancellation status
             return res.status(400).json({ message: 'Ownership of books involved in the trade has changed. Trade cancelled.' });
        }

        console.log('Ownership check passed. Proceeding with updates.'); // <-- Debug Log PUT 16f


        // Perform the ownership transfer:
        console.log('Updating target book owner...'); // <-- Debug Log PUT 16g
        await Book.findByIdAndUpdate(targetBookId, { owner: proposerId });
        console.log('Target book owner updated.'); // <-- Debug Log PUT 16h


        console.log('Updating offered books owners...'); // <-- Debug Log PUT 16i
        await Book.updateMany({ _id: { $in: offeredBookIds } }, { owner: recipientId });
        console.log('Offered books owners updated.'); // <-- Debug Log PUT 16j>


        // Optional: Cancel any other pending trades involving these books
        console.log('Attempting to cancel conflicting trades...'); // <-- Debug Log PUT 16k
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
         console.log('Conflicting trades checked/cancelled.'); // <-- Debug Log PUT 16l


        console.log('Ownership transfer logic completed.'); // <-- Debug Log PUT 17

    }

    // Save the updated trade status
    console.log('Attempting to save final updated trade status...'); // <-- Debug Log PUT 18
    const updatedTrade = await trade.save();
    console.log('Trade status saved successfully.'); // <-- Debug Log PUT 19


    // Populate the updated trade for a meaningful response - Using array syntax
    console.log('Attempting to populate saved trade using array syntax...'); // <-- Debug Log PUT 20
    const populatedTrade = await updatedTrade.populate([
      { path: 'proposer', select: 'username fullName' },
      { path: 'recipient', select: 'username fullName' },
      { path: 'targetBook', select: 'title author' },
      { path: 'offeredBooks', select: 'title author' }
    ]);
    console.log('Trade populated successfully.'); // <-- Debug Log PUT 21


    res.status(200).json(populatedTrade);
    console.log('PUT /api/trades/:tradeId request finished successfully.'); // <-- Debug Log PUT 22


  } catch (error) {
    // This catches any unhandled error that occurred in the try block
    console.error('Error details within PUT /api/trades/:tradeId catch block:', error); // <-- Crucial Debug Log
    // Log the error name and message specifically if available
    if (error.name) console.error('Error Name:', error.name);
    if (error.message) console.error('Error Message:', error.message);

    res.status(500).json({ message: 'Server Error updating trade status.' }); // Send generic error to frontend
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


module.exports = router;