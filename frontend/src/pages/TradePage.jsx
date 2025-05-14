import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // To get the current user ID and token
import { useNavigate } from 'react-router-dom'; // To potentially redirect or refresh
import './TradePage.css'; // Optional: Create CSS for TradePage

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';


// --- Helper component to display a single trade (Incoming or Outgoing) ---
function TradeItem({ trade, isIncoming, onTradeAction }) {
    const { user } = useAuth(); // Get current user to check roles

    // Determine proposer and recipient names
    const proposerName = trade.proposer?.fullName || trade.proposer?.username || 'Unknown Proposer';
    const recipientName = trade.recipient?.fullName || trade.recipient?.username || 'Unknown Recipient';

    // Format offered books list
    const offeredBooksList = trade.offeredBooks && trade.offeredBooks.length > 0
        ? trade.offeredBooks.map(book => `"${book.title}" by ${book.author}`).join(', ')
        : 'No books offered';

    return (
        <div className={`trade-item ${trade.status}`}> {/* Add status class for styling */}
            <div className="trade-summary">
                {isIncoming ? (
                    <p><strong>Incoming Trade from:</strong> {proposerName}</p>
                ) : (
                    <p><strong>Outgoing Trade to:</strong> {recipientName}</p>
                )}
                 <p><strong>Status:</strong> {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}</p> {/* Capitalize status */}
            </div>
             <div className="trade-details">
                <p><strong>Target Book (they want):</strong> "{trade.targetBook?.title}" by {trade.targetBook?.author || 'Unknown Author'}</p>
                <p><strong>Offered Book(s) (you receive/you offer):</strong> {offeredBooksList}</p>
            </div>

            {/* Actions for Incoming Trades */}
            {isIncoming && trade.status === 'pending' && (
                <div className="trade-actions">
                    <button className="accept-button" onClick={() => onTradeAction(trade._id, 'accepted')} disabled={trade.acting}>Accept</button>
                    <button className="reject-button" onClick={() => onTradeAction(trade._id, 'rejected')} disabled={trade.acting}>Reject</button>
                    {/* `trade.acting` is a local state we might add in the parent to disable buttons while processing */}
                </div>
            )}

             {/* Optional: Actions for Outgoing Trades (e.g., Cancel) */}
             {!isIncoming && trade.status === 'pending' && (
                  <div className="trade-actions">
                      {/* You could add a Cancel button here */}
                      {/* <button className="cancel-button" onClick={() => onTradeAction(trade._id, 'cancelled')} disabled={trade.acting}>Cancel</button> */}
                  </div>
             )}
        </div>
    );
}
// --- End of TradeItem ---


function TradePage() {
  const [incomingTrades, setIncomingTrades] = useState([]);
  const [outgoingTrades, setOutgoingTrades] = useState([]);
  const [loadingIncoming, setLoadingIncoming] = useState(true);
  const [loadingOutgoing, setLoadingOutgoing] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuth(); // Check auth status
  const navigate = useNavigate(); // For redirection if needed

  // Redirect if not authenticated (ProtectedRoute should handle this too, but as a fallback)
   useEffect(() => {
       if (!isAuthenticated) {
           navigate('/login');
       }
   }, [isAuthenticated, navigate]);


  // Function to fetch trades
  const fetchTrades = async () => {
      if (!isAuthenticated) {
          // No need to fetch if not authenticated, already handled by useEffect/ProtectedRoute
          return;
      }

      const token = localStorage.getItem('token');
       if (!token) {
           setError('Authentication token missing. Please log in.');
           // logout(); // Use context logout if you have it here
           navigate('/login');
           return;
       }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        // Fetch incoming trades
        const incomingResponse = await axios.get(`${API_URL}/trades/incoming`, config);
        setIncomingTrades(incomingResponse.data);
        setLoadingIncoming(false);

        // Fetch outgoing trades
        const outgoingResponse = await axios.get(`${API_URL}/trades/outgoing`, config);
        setOutgoingTrades(outgoingResponse.data);
        setLoadingOutgoing(false);

      } catch (err) {
        console.error('Error fetching trades:', err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : 'Failed to fetch trades.');
        setLoadingIncoming(false);
        setLoadingOutgoing(false);
         if (err.response && err.response.status === 401) {
             // If token is invalid, clear and redirect
             localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
             // logout(); // Use context logout
             navigate('/login');
        }
      }
  };


  // Fetch trades when the component mounts or auth status changes
  useEffect(() => {
      fetchTrades();
  }, [isAuthenticated]); // Depend on isAuthenticated to re-fetch if user logs in/out


  // Function to handle Accept or Reject action on an incoming trade
  const handleTradeAction = async (tradeId, action) => {
      // action will be 'accepted' or 'rejected'
      if (!isAuthenticated) {
           setError('User not authenticated.');
           return;
       }

       const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication token missing.');
            return;
        }

       // Optional: Find the trade locally and set a 'acting' state to disable buttons
       // const tradeToUpdate = incomingTrades.find(trade => trade._id === tradeId);
       // if (tradeToUpdate) {
       //     // You would update state here to show loading/disable button
       //     // setIncomingTrades(prev => prev.map(t => t._id === tradeId ? {...t, acting: true} : t));
       // }


      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };
        const updateData = {
          status: action,
        };

        const response = await axios.put(`${API_URL}/trades/${tradeId}`, updateData, config);

        console.log(`Trade ${action} successfully:`, response.data);
        // Refresh the trade lists after a successful action
        fetchTrades(); // Re-fetch all trades

        // Important: If trade was ACCEPTED, the book ownership changed.
        // You might want to trigger a refresh of the books list on the HomePage.
        // This is complex with React Context or state management if HomePage isn't a child.
        // A simple solution is to just tell the user to visit Home page to see changes.
        // A better solution involves lifting state or using a shared state manager.
        if (action === 'accepted') {
             alert('Trade accepted! Visit the All Books page to see the updated ownership.');
             // Or trigger a context update that HomePage listens to
        }


      } catch (err) {
        console.error(`Error ${action} trade:`, err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : `Failed to ${action} trade.`);
         if (err.response && err.response.status === 401) {
             localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
             // logout(); // Use context logout
             navigate('/login');
        }
      } finally {
          // Optional: Clear 'acting' state if you added it
          // setIncomingTrades(prev => prev.map(t => t._id === tradeId ? {...t, acting: false} : t));
      }
  };


  return (
    <div>
      <h2>Trade Requests</h2>

       {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Incoming Trades */}
      <h3>Incoming Trades</h3>
      {loadingIncoming ? (
        <p>Loading incoming trades...</p>
      ) : incomingTrades.length === 0 ? (
        <p>No incoming trade requests.</p>
      ) : (
        <div className="trade-list">
          {incomingTrades.map(trade => (
            <TradeItem
              key={trade._id}
              trade={trade}
              isIncoming={true}
              onTradeAction={handleTradeAction} // Pass the action handler
            />
          ))}
        </div>
      )}

      {/* Outgoing Trades */}
      <h3>Outgoing Trades</h3>
       {loadingOutgoing ? (
        <p>Loading outgoing trades...</p>
      ) : outgoingTrades.length === 0 ? (
        <p>No outgoing trade requests.</p>
      ) : (
        <div className="trade-list">
          {outgoingTrades.map(trade => (
            <TradeItem
              key={trade._id}
              trade={trade}
              isIncoming={false} // Not an incoming trade
              // No actions needed for outgoing trades based on user story
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TradePage;