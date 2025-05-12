import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

function SettingsPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    city: '',
    state: '',
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null); // State for success message
  const [loading, setLoading] = useState(true); // Start loading true as we fetch data
  const [saving, setSaving] = useState(false); // State for save button loading

  const navigate = useNavigate();

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUserSettings = async () => {
      const token = localStorage.getItem('token');

      // If no token, redirect to login
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Make GET request to fetch user data, including the Bearer token
        const config = {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in headers
          },
        };
        const response = await axios.get(`${API_URL}/users/me`, config);

        // Populate the form with fetched data
        setFormData(response.data);
        setLoading(false); // Stop loading
      } catch (err) {
        console.error('Error fetching user settings:', err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : 'Failed to fetch settings');
        setLoading(false); // Stop loading even on error
        // If the token is invalid/expired, backend might return 401, redirect to login
        if (err.response && err.response.status === 401) {
             localStorage.removeItem('token'); // Clear invalid token
             localStorage.removeItem('userInfo'); // Clear cached user info
             navigate('/login'); // Redirect to login
        }
      }
    };

    fetchUserSettings();
  }, [navigate]); // Rerun effect if navigate changes (though it typically won't)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true); // Set saving to true
    setError(null); // Clear previous errors
    setSuccessMessage(null); // Clear previous success messages

    const token = localStorage.getItem('token');
     if (!token) {
        navigate('/login'); // Should be caught by useEffect, but double check
        return;
     }


    try {
      // Make PUT request to update user data, including the Bearer token
      const config = {
        headers: {
          'Content-Type': 'application/json', // Specify content type
          Authorization: `Bearer ${token}`, // Include the token in headers
        },
      };
      const response = await axios.put(`${API_URL}/users/me`, formData, config);

      console.log('Settings updated successfully:', response.data);
      setSuccessMessage('Settings saved successfully!'); // Set success message
      // Optionally update cached user info in localStorage if needed
      localStorage.setItem('userInfo', JSON.stringify(response.data));


    } catch (err) {
      console.error('Error saving settings:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'Failed to save settings'); // Set error message
       if (err.response && err.response.status === 401) {
             localStorage.removeItem('token'); // Clear invalid token
              localStorage.removeItem('userInfo'); // Clear cached user info
             navigate('/login'); // Redirect to login
        }
    } finally {
      setSaving(false); // Set saving to false
    }
  };

  // Show loading indicator while fetching initial data
  if (loading) {
    return <div>Loading settings...</div>;
  }


  return (
    <div>
      <h2>User Settings</h2>
      <form onSubmit={handleSubmit}>
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