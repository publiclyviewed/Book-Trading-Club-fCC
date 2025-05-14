import React, { useState, useEffect } from 'react';
import axios from 'axios';
// No longer need useAuth directly here unless needed for other logic
// import { useAuth } from '../context/AuthContext'; // Keep if needed

import BookCard from '../components/BookCard'; // Import BookCard from components
import TradeProposalModal from '../components/TradeProposalModal';

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';


function HomePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeTargetBook, setTradeTargetBook] = useState(null);

  const fetchBooks = async () => {
      try {
        const response = await axios.get(`${API_URL}/books`);
        setBooks(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to fetch books');
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleProposeTrade = (book) => {
      setTradeTargetBook(book);
      setIsTradeModalOpen(true);
  };

  const handleCloseTradeModal = () => {
      setIsTradeModalOpen(false);
      setTradeTargetBook(null);
      // Optional: Refresh books list after modal closes (e.g., if a trade was sent and ownership changed)
      // This is more relevant AFTER a trade is *accepted*, not just proposed.
      // We'll handle refreshing on the TradePage after accept/reject.
  };

   // Function called by the modal when a trade proposal is successfully sent
   // You could add logic here to show a temporary notification on the HomePage
  const handleTradeProposed = (newTrade) => {
      console.log("Trade proposed successfully!", newTrade);
      // Modal will handle closing and success message internally for now
      // If you have a global notification system, trigger it here.
  };


  if (loading) {
    return <div>Loading books...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>All Books</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}> {/* Add gap and center */}
        {books.map((book) => (
          <BookCard
            key={book._id}
            book={book}
            onProposeTrade={handleProposeTrade}
          />
        ))}
      </div>

      {/* Render Trade Proposal Modal if open and a target book is selected */}
       {isTradeModalOpen && tradeTargetBook && (
           <TradeProposalModal
              targetBook={tradeTargetBook}
              onClose={handleCloseTradeModal}
              onTradeProposed={handleTradeProposed}
           />
       )}

    </div>
  );
}

export default HomePage;