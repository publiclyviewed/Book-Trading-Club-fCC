import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Although protected route covers auth, good practice to ensure user is available

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';


function AddBookPage() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    imageUrl: '', // Optional
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
   // Use useAuth just to ensure we know the user is expected to be logged in
   const { isAuthenticated } = useAuth();
   // ProtectedRoute handles redirection if not authenticated, but good for clarity

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Need the token to call the protected backend route
    const token = localStorage.getItem('token');
     if (!token) {
        // This case should be handled by ProtectedRoute, but as a fallback:
        console.error('No token found for adding book.');
        navigate('/login'); // Redirect if somehow no token
        return;
     }


    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include the token
        },
      };

      // Send the form data to the backend /api/books endpoint
      const response = await axios.post(`${API_URL}/books`, formData, config);

      console.log('Book added successfully:', response.data);
      setSuccessMessage('Book added successfully!');
      setFormData({ // Clear the form
        title: '',
        author: '',
        imageUrl: '',
      });
      // Optional: Redirect to home page after adding
      // navigate('/');


    } catch (err) {
      console.error('Error adding book:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'Failed to add book');
       if (err.response && err.response.status === 401) {
             // If the token is invalid, clear it and redirect
             localStorage.removeItem('token');
             localStorage.removeItem('userInfo');
             navigate('/login');
        }
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, ProtectedRoute should have redirected.
  // This is an extra layer of safety, but the main protection is the route itself.
   if (!isAuthenticated) {
       return null; // Or a message like "Please log in to add books"
   }


  return (
    <div>
      <h2>Add New Book</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="author">Author:</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
          />
        </div>
         <div>
          <label htmlFor="imageUrl">Image URL (Optional):</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Adding Book...' : 'Add Book'}
        </button>
      </form>

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default AddBookPage;