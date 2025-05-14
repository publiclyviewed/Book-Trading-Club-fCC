import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // To get the current user ID and token
import { useNavigate } from 'react-router-dom'; // For redirection if needed
import './TradePage.css'; // Import CSS for styling the trade page

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';


// --- Helper component to display a single trade (Incoming or Outgoing) ---
// Defined outside the main TradePage function for clarity, but can be in the same file
function TradeItem({ trade, isIncoming, onTradeAction, isActing }) {
    // isActing is a boolean passed down to disable buttons while processing
    const { user } = useAuth(); // Get current user (useful for displaying 'You' vs username)

    // Determine proposer and recipient display names
    const proposerName = trade.proposer
        ? (trade.proposer._id === user?._id ? 'You' : (trade.proposer.fullName || trade.proposer.username))
        : 'Unknown Proposer';

    const recipientName = trade.recipient
        ? (trade.recipient._id === user?._id ? 'You' : (trade.recipient.fullName || trade.recipient.username))
        : 'Unknown Recipient';


    // Format offered books list for display
    const offeredBooksList = trade.offeredBooks && trade.offeredBooks.length > 0
        ? trade.offeredBooks.map(book => `"${book.title}" by ${book.author}`).join(', ')
        : 'No books offered'; // Should ideally always have offered books per backend validation


    return (
        // Use a class for styling, add status class for different colors/indicators
        <div className={`trade-item ${trade.status}`}>
            <div className="trade-summary">
                {/* Display who is proposing/receiving */}
                {isIncoming ? (
                    <p><strong>From:</strong> {proposerName}</p>
                ) : (
                    <p><strong>To:</strong> {recipientName}</p>
                )}
                 {/* Display the current status */}
                 <p><strong>Status:</strong> {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}</p> {/* Capitalize status */}
            </div>

            {/* Display details of the books involved */}
             <div className="trade-details">
                <p><strong>Target Book ({isIncoming ? 'you receive' : 'you want'}):</strong> "{trade.targetBook?.title}" by {trade.targetBook?.author || 'Unknown Author'}</p>
                <p><strong>Offered Book(s) ({isIncoming ? 'you give' : 'you offer'}):</strong> {offeredBooksList}</p>
            </div>

            {/* Actions for Incoming Trades that are Pending */}
            {isIncoming && trade.status === 'pending' && (
                <div className="trade-actions">
                    {/* Buttons disabled while an action is being processed */}
                    <button className="accept-button" onClick={() => onTradeAction(trade._id, 'accepted')} disabled={isActing}>Accept</button>
                    <button className="reject-button" onClick={() => onTradeAction(trade._id, 'rejected')} disabled={isActing}>Reject</button>
                     {/* Optional: Add a cancel button for proposer/recipient if needed */}
                     {/* <button className="cancel-button" onClick={() => onTradeAction(trade._id, 'cancelled')} disabled={isActing}>Cancel</button> */}
                </div>
            )}

             {/* Optional: Actions for Outgoing Trades (e.g., Cancel a pending outgoing trade) */}
             {!isIncoming && trade.status === 'pending' && (
                  <div className="trade-actions">
                      {/* Example Cancel button - requires backend route for cancelling */}
                      {/* <button className="cancel-button" onClick={() => onTradeAction(trade._id, 'cancelled')} disabled={isActing}>Cancel Proposal</button> */}
                  </div>
             )}

             {/* Optional: Display a timestamp */}
             {/* <div className="trade-timestamp">
                 <small>Proposed on: {new Date(trade.createdAt).toLocaleDateString()}</small>
             </div> */}
        </div>
    );
}
// --- End of TradeItem Helper Component ---


// --- Main TradePage Component ---
function TradePage() {
  // State to hold incoming and outgoing trades
  const [incomingTrades, setIncomingTrades] = useState([]);
  const [outgoingTrades, setOutgoingTrades] = useState([]);

  // Loading states for fetching trades
  const [loadingIncoming, setLoadingIncoming] = useState(true);
  const [loadingOutgoing, setLoadingOutgoing] = useState(true);

  // State for errors (fetching or performing actions)
  const [error, setError] = useState(null);

  // --- FIX: Add useState for actingTradeId ---
   const [actingTradeId, setActingTradeId] = useState(null); // State to track which trade is being acted upon
  // --- End FIX ---


  // Get authentication status and navigation hook
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();


  // Effect to check authentication and redirect if necessary
  // ProtectedRoute should handle this, but this is a fallback/assurance
   useEffect(() => {
       if (!isAuthenticated) {
           console.log('User not authenticated on TradePage, redirecting to login.');
           navigate('/login');
       }
   }, [isAuthenticated, navigate]); // Re-run if auth status or navigate function changes


  // Function to fetch trades from the backend
  const fetchTrades = async () => {
      // Ensure user is authenticated before attempting to fetch
      if (!isAuthenticated) {
          // This case is handled by the useEffect above
          return;
      }

      // Reset loading and error states before fetching
      setLoadingIncoming(true);
      setLoadingOutgoing(true);
      setError(null); // Clear previous errors

      const token = localStorage.getItem('token');
       if (!token) {
           // Should be authenticated if we reach here, but check token exists
           console.error('Authentication token missing during trade fetch.');
           setError('Authentication token missing. Please log in again.');
           // Trigger logout and redirect via context/App if needed
           // useAuth().logout(); // Call logout if hook is available here
           // navigate('/login'); // Use navigate if hook is available
           setLoadingIncoming(false);
           setLoadingOutgoing(false);
           return;
       }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`, // Include the JWT
        },
      };

      try {
        // Fetch incoming trades for the logged-in user
        const incomingResponse = await axios.get(`${API_URL}/trades/incoming`, config);
        setIncomingTrades(incomingResponse.data);
        setLoadingIncoming(false);

        // Fetch outgoing trades for the logged-in user
        const outgoingResponse = await axios.get(`${API_URL}/trades/outgoing`, config);
        setOutgoingTrades(outgoingResponse.data);
        setLoadingOutgoing(false);

      } catch (err) {
        console.error('Error fetching trades:', err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : 'Failed to fetch trades.');
        setLoadingIncoming(false);
        setLoadingOutgoing(false);

         // Handle unauthorized error specifically - token is likely invalid/expired
         if (err.response && err.response.status === 401) {
             console.error('Token expired or invalid during trade fetch, logging out.');
             localStorage.removeItem('token'); // Clear invalid token
              localStorage.removeItem('userInfo'); // Clear cached user info
             // Trigger logout and navigate to login page
             // useAuth().logout(); // Call logout if hook is available here
             navigate('/login');
        }
      }
  };


  // Effect to fetch trades when the component mounts or authentication status changes
  useEffect(() => {
       // Only fetch if authenticated (initial check is done by AuthProvider)
       if (isAuthenticated) {
            fetchTrades();
       }
       // Note: fetchTrades itself handles the unauthenticated case as a fallback
  }, [isAuthenticated]); // Depend on isAuthenticated to refetch when user logs in/out


  // Function to handle Accept or Reject action on an incoming trade
  const handleTradeAction = async (tradeId, action) => {
      // action will be 'accepted' or 'rejected'
      if (!isAuthenticated) {
           setError('User not authenticated to perform trade action.');
           // Trigger logout and redirect
           // useAuth().logout(); // Call logout if hook is available here
           // navigate('/login');
           return;
       }

       const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token missing during trade action.');
            setError('Authentication token missing. Please log in again.');
             // Trigger logout and redirect
             // useAuth().logout(); // Call logout if hook is available here
             // navigate('/login');
            return;
        }

       // Set the trade ID being acted upon to disable buttons
       setActingTradeId(tradeId);
       setError(null); // Clear previous errors


      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Include the JWT
          },
        };
        const updateData = {
          status: action, // 'accepted' or 'rejected'
        };

        // Send the PUT request to update the trade status
        const response = await axios.put(`${API_URL}/trades/${tradeId}`, updateData, config);

        console.log(`Trade ${action} successfully:`, response.data);
        // Set a success message if you like
        // setSuccessMessage(`Trade ${action} successfully!`); // Need success state

        // Refresh the trade lists after a successful action
        fetchTrades(); // Re-fetch all trades

        // Important: If trade was ACCEPTED, the book ownership changed.
        // The user story requires the user can view all books posted by *every* user.
        // The HomePage GET /api/books already fetches populated owner data.
        // When the user next visits the HomePage, they will see the updated ownership
        // because the HomePage fetches fresh data on mount.
        // An alert here is a simple way to inform the user.
        if (action === 'accepted') {
             alert('Trade accepted! Visit the All Books page to see the updated ownership.');
             // Optional: trigger a global state update that HomePage listens to for instant refresh
        }


      } catch (err) {
        console.error(`Error ${action} trade:`, err.response ? err.response.data : err.message); // Log the error details

        // --- Improved Error Display Logic ---
        // Prioritize the backend message if available
        const backendErrorMessage = err.response && err.response.data && typeof err.response.data.message === 'string'
            ? err.response.data.message
            : `Failed to ${action} trade. Server error.`; // Fallback message if no specific backend message

        setError(backendErrorMessage); // Set the specific or generic error message
        // --- End Improved Error Display Logic ---


         if (err.response && err.response.status === 401) {
             console.error('Token expired or invalid during trade action, logging out.');
             localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
             // logout(); // Use context logout
             navigate('/login');
        }
      } finally {
          // Clear the acting state regardless of success or failure
          setActingTradeId(null);
      }
  };


  // Render loading state if either list is loading
  if (loadingIncoming || loadingOutgoing) {
    return <div>Loading trades...</div>;
  }

   // If not authenticated, ProtectedRoute should redirect.
   // This is a final visual fallback.
    if (!isAuthenticated) {
        return <div>Please log in to view trades.</div>;
    }


  return (
    <div className="trade-page-container"> {/* Use a container class for styling */}
      <h2>Trade Requests</h2>

       {/* Display general error messages */}
       {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Incoming Trades Section */}
      <div className="incoming-trades-section">
          <h3>Incoming Trades</h3>
          {incomingTrades.length === 0 ? (
            <p>No incoming trade requests.</p>
          ) : (
            <div className="trade-list"> {/* Use class for list styling */}
              {incomingTrades.map(trade => (
                <TradeItem
                  key={trade._id}
                  trade={trade}
                  isIncoming={true} // Mark as incoming
                  onTradeAction={handleTradeAction} // Pass the action handler
                  isActing={actingTradeId === trade._id} // Pass acting state
                />
              ))}
            </div>
          )}
      </div>

      {/* Outgoing Trades Section */}
      <div className="outgoing-trades-section">
          <h3>Outgoing Trades</h3>
           {loadingOutgoing ? (
            <p>Loading outgoing trades...</p>
          ) : outgoingTrades.length === 0 ? (
            <p>No outgoing trade requests.</p>
          ) : (
            <div className="trade-list"> {/* Use class for list styling */}
              {outgoingTrades.map(trade => (
                <TradeItem
                  key={trade._id}
                  trade={trade}
                  isIncoming={false} // Mark as outgoing
                  // No actions needed for outgoing trades based on user story (unless canceling)
                  // Pass action handler if you add cancel functionality
                  // onTradeAction={handleTradeAction}
                   isActing={false} // No actions available on outgoing trades currently
                />
              ))}
            </div>
          )}
      </div>

    </div>
  );
}

export default TradePage;