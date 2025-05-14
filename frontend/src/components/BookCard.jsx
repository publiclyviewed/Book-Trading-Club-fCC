import React from 'react';
import { useAuth } from '../context/AuthContext'; // To get the current user ID
import './BookCard.css'; // Optional: Create CSS for BookCard

function BookCard({ book, onProposeTrade }) {
    const { user } = useAuth(); // Get current user from context

    // Handle case where book or owner might be missing (shouldn't happen with backend validation/population but safe check)
    const isMyBook = user && book.owner && book.owner._id === user._id;

    return (
        <div className="book-card"> {/* Use a class for styling */}
            {book.imageUrl && (
                <img src={book.imageUrl} alt={`Cover of ${book.title}`} className="book-cover" />
            )}
            <div className="book-info">
                <h4>{book.title}</h4>
                <p>by {book.author}</p>
                <p>Owned by: {book.owner ? (book.owner.fullName || book.owner.username) : 'Unknown'}</p>
            </div>

            <div className="book-actions">
                {/* Conditionally render Propose Trade button */}
                {user && !isMyBook && ( // Only show if logged in AND it's NOT their book
                    <button onClick={() => onProposeTrade(book)}>Propose Trade</button>
                )}
                 {user && isMyBook && ( // Optionally indicate if it's their book
                    <span className="my-book-indicator">Your book</span> // Use a span/div for text
                 )}
            </div>
        </div>
    );
}

export default BookCard;