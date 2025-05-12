import React, { useState } from 'react';
import axios from 'axios'; // Import axios
import { useNavigate } from 'react-router-dom'; // To redirect after registration

// Get the backend URL from the environment variable
// Use import.meta.env for Vite
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';


function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    // fullName, city, state are optional initially based on backend schema
    fullName: '',
    city: '',
    state: '',
  });
  const [error, setError] = useState(null); // State for error messages
  const [loading, setLoading] = useState(false); // State for loading indicator

  const navigate = useNavigate(); // Hook to programmatically navigate

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission

    setLoading(true); // Set loading to true
    setError(null); // Clear previous errors

    try {
      // Make the POST request to your backend registration endpoint
      const response = await axios.post(`${API_URL}/auth/register`, formData);

      // Assuming registration is successful, response.data might contain user info and token
      console.log('Registration successful:', response.data);

      // Redirect to login page or home page after successful registration
      navigate('/login'); // Or navigate('/')

    } catch (err) {
      // Handle errors (e.g., username already exists, validation errors)
      console.error('Registration error:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'An error occurred'); // Set error message
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required // HTML5 validation
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
            required // HTML5 validation
            minLength="6" // Match backend validation
          />
        </div>
         {/* Optional fields */}
         <div>
          <label htmlFor="fullName">Full Name (Optional):</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="city">City (Optional):</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="state">State (Optional):</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {/* Display error message if there is one */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Link to login page */}
      <p>Already have an account? <Link to="/login">Login here</Link></p>
    </div>
  );
}

export default RegisterPage;