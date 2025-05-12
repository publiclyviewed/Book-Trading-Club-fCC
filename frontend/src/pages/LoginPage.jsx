import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Optional: Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If token exists, redirect to home page or a dashboard
      navigate('/'); // Or a protected route like '/dashboard'
    }
  }, [navigate]); // Depend on navigate to avoid lint warnings

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Make the POST request to your backend login endpoint
      const response = await axios.post(`${API_URL}/auth/login`, formData);

      // Assuming login is successful, response.data contains user info and token
      console.log('Login successful:', response.data);

      // *** Crucially: Store the JWT ***
      // localStorage is a simple way to store the token in the browser
      // Note: localStorage is vulnerable to XSS attacks. For production, consider
      // more secure methods like HttpOnly cookies if appropriate for your architecture.
      localStorage.setItem('token', response.data.token);
      // You might also store basic user info (like username, id) if needed frequently
       localStorage.setItem('userInfo', JSON.stringify(response.data));


      // Redirect to home page or a protected route after login
      navigate('/'); // Or navigate('/settings') etc.

    } catch (err) {
      // Handle errors (e.g., invalid credentials)
      console.error('Login error:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging In...' : 'Login'}
        </button>
      </form>

       {error && <p style={{ color: 'red' }}>{error}</p>}

       {/* Link to registration page */}
       <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

export default LoginPage;