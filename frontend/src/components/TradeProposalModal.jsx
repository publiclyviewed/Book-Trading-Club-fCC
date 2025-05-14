import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // To get the current user ID
import './TradeProposalModal.css'; // We'll create this CSS file

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';


function TradeProposalModal({ targetBook, onClose, onTradeProposed }) {
  const { user, isAuthenticated } = useAuth(); // Get logged-in user from context
  const [userBooks, setUserBooks] = useState([]); // State to hold books owned by the user
  const [selectedOfferedBookId, setSelectedOfferedBookId] = useState(null); // State for selected offered book
  const [loading, setLoading] = useState(true); // Loading state for user books
  const [proposing, setProposing] = useState(false); // Loading state for proposing trade
  const [error, setError] = useState(null); // Error state
  const [successMessage, setSuccessMessage] = useState(null); // Success state


  // Fetch books owned by the current user when the modal opens
  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!isAuthenticated || !user) {
        // Should not happen if modal is only opened for logged-in users
        setError('You must be logged in to propose a trade.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
         setError('Authentication token missing.');
         setLoading(false);
         return;
      }

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        // We need a backend endpoint to get books *owned by the user*.
        // If you uncommented and implemented GET /api/books/user/:userId:
        // const response = await axios.get(`${API_URL}/books/user/${user._id}`, config);

        // Alternative: Fetch all books and filter on the frontend (less efficient for many books)
        const allBooksResponse = await axios.get(`${API_URL}/books`, config);
        const usersOwnBooks = allBooksResponse.data.filter(book => book.owner && book.owner._id === user._id);


        setUserBooks(usersOwnBooks);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching user books:', err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : 'Failed to load your books.');
        setLoading(false);
      }
    };

    fetchUserBooks();
  }, [user, isAuthenticated]); // Refetch if user or auth status changes

  // Handle selection of an offered book
  const handleBookSelect = (bookId) => {
      setSelectedOfferedBookId(bookId);
  };

  // Handle trade proposal submission
  const handleSubmitProposal = async () => {
    if (!selectedOfferedBookId) {
      setError('Please select a book to offer.');
      return;
    }

    if (!isAuthenticated || !user) {
        setError('User not authenticated.');
        return;
    }

     const token = localStorage.getItem('token');
      if (!token) {
         setError('Authentication token missing.');
         return;
      }

    setProposing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      const tradeData = {
        targetBookId: targetBook._id, // The book the modal is for
        offeredBookIds: [selectedOfferedBookId], // Offering the selected book (backend supports array)
      };

      console.log('Sending trade proposal data:', tradeData);

      const response = await axios.post(`${API_URL}/trades`, tradeData, config);

      console.log('Trade proposed successfully:', response.data);
      setSuccessMessage('Trade proposal sent!');
      // Call the success handler passed from parent
      if (onTradeProposed) {
          onTradeProposed(response.data);
      }
      // Optional: Close modal automatically after a short delay
       setTimeout(onClose, 2000);


    } catch (err) {
      console.error('Error proposing trade:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'Failed to propose trade.');
      if (err.response && err.response.status === 401) {
             // If the token is invalid, clear it and prompt re-login
             localStorage.removeItem('token');
             localStorage.removeItem('userInfo');
             // Optionally trigger a logout from context if you didn't already
             // logout();
             // navigate('/login'); // You might need to navigate from parent or context
             setError('Your session expired. Please log in again.');
             // Keep modal open with error, or redirect to login
        }
    } finally {
      setProposing(false);
    }
  };


  return (
    // Simple modal overlay structure
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Propose Trade for: "{targetBook.title}" by {targetBook.author}</h3>

        {loading ? (
          <p>Loading your books...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : userBooks.length === 0 ? (
          <p>You don't have any books to offer for trade yet.</p>
        ) : (
          <>
            <p>Select one of your books to offer:</p>
            <div className="user-books-list">
              {userBooks.map(book => (
                <div key={book._id} className={`user-book-item ${selectedOfferedBookId === book._id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id={`book-${book._id}`}
                    name="offeredBook"
                    value={book._id}
                    checked={selectedOfferedBookId === book._id}
                    onChange={() => handleBookSelect(book._id)}
                  />
                  <label htmlFor={`book-${book._id}`}>
                    {book.imageUrl && <img src={book.imageUrl} alt={book.title} style={{ width: '50px', height: '75px', objectFit: 'cover', marginRight: '10px' }} />}
                    "{book.title}" by {book.author}
                  </label>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="modal-actions">
          {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>} {/* Show error here too */}

          <button onClick={handleSubmitProposal} disabled={!selectedOfferedBookId || proposing}>
            {proposing ? 'Sending...' : 'Submit Trade Proposal'}
          </button>
          <button onClick={onClose} disabled={proposing}>Cancel</button> {/* Disable cancel while proposing */}
        </div>

      </div>
    </div>
  );
}

export default TradeProposalModal;