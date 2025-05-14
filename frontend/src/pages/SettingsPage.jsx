import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

function SettingsPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    city: '',
    state: '',
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const { user, isAuthenticated, logout, login } = useAuth(); // Get user, isAuthenticated, logout from context


  // Fetch user data when the component mounts
  useEffect(() => {
      // No need to check localStorage here, AuthProvider does it
      // If not authenticated, ProtectedRoute will redirect before this effect runs
      if (!isAuthenticated || !user) { // Extra check, though ProtectedRoute should handle it
          // This means AuthProvider finished loading and user is null
          // ProtectedRoute should redirect to login
          return;
      }

      // Populate the form with user data from context once available
      // This assumes user data is in the context after initial load or login
      setFormData({
          fullName: user.fullName || '',
          city: user.city || '',
          state: user.state || '',
      });
      setLoading(false); // Stop loading as user data is available


  }, [user, isAuthenticated]); // Depend on user and isAuthenticated

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem('token'); // Still need token for the API call
    if (!token) {
        // This case should be handled by ProtectedRoute, but as a fallback:
        logout(); // Use context logout
        navigate('/login');
        return;
     }


    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put(`${API_URL}/users/me`, formData, config);

      console.log('Settings updated successfully:', response.data);
      setSuccessMessage('Settings saved successfully!');

      // *** Important: Update user info in context/localStorage after successful save ***
      // Use the login function or a specific update user function if you add one to context
      // For simplicity, re-login with the updated data (this updates localStorage & context state)
      login(token, response.data); // Pass the existing token and updated user data


    } catch (err) {
      console.error('Error saving settings:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'Failed to save settings');
       if (err.response && err.response.status === 401) {
             logout(); // Use context logout to clear token and state
             navigate('/login');
        }
    } finally {
      setSaving(false);
    }
  };

  // Show loading indicator while AuthProvider is checking authentication on initial load
  // or while fetching user data if that logic is inside the effect
  if (loading) {
     // Note: AuthProvider also has a loading state and shows 'Loading application...'
     // You might remove this inner loading state if AuthProvider handles it entirely
    return <div>Loading settings form...</div>;
  }


  return (
    <div>
      <h2>User Settings</h2>
      <form onSubmit={handleSubmit}>
         {/* ... form inputs remain the same ... */}
        <div>
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="city">City:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="state">State:</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default SettingsPage;