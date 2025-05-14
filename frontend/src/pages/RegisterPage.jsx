import React, { useState } from 'react'; // Make sure useState is imported
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Make sure Link is imported

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

function RegisterPage() {
  // --- State Management ---
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '', // Optional initially
    city: '',     // Optional initially
    state: '',    // Optional initially
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // --- End of State Management ---

  // --- Hooks ---
  const navigate = useNavigate(); // Make sure useNavigate is called --- End of Hooks ---

  // --- Event Handlers ---
  const handleChange = (e) => {
    // Correctly updates the state based on input name and value
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }; // --- End of Event Handlers ---


  // --- Form Submission Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission

    console.log('Attempting registration...'); // Log 1
    setLoading(true); // Disable button, show loading
    setError(null); // Clear any previous errors

    try {
      console.log('Sending registration data:', formData); // Log 2
      // Make the POST request to your backend registration endpoint
      // Axios automatically serializes formData to JSON
      const response = await axios.post(`${API_URL}/auth/register`, formData);

      console.log('Registration successful:', response.data); // Log 3

      // Redirect to login page after successful registration
      console.log('Navigating to /login...'); // Log 4
      navigate('/login'); // Navigate using react-router-dom
      // console.log('Navigation call completed.'); // Log 5 - This log might not always fire reliably after navigation

    } catch (err) {
      // Handle errors from the backend (e.g., username already exists, validation)
      console.error('Registration error caught:', err.response ? err.response.data : err.message); // Log 6
      // Set the error state to display a message to the user
      setError(err.response ? err.response.data.message : 'An error occurred during registration.');
    } finally {
      // This block runs regardless of try or catch outcome
      console.log('Finishing registration process.'); // Log 7
      setLoading(false); // Re-enable button
    }
  }; // --- End of Form Submission Logic ---

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {/* --- Form Inputs --- */}
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username" // Associate label and input
            name="username" // Match state key
            value={formData.username} // Bind value to state
            onChange={handleChange} // Update state on change
            required // HTML5 validation
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password" // Associate label and input
            name="password" // Match state key
            value={formData.password} // Bind value to state
            onChange={handleChange} // Update state on change
            required // HTML5 validation
            minLength="6" // Match backend validation
          />
        </div>
         {/* Optional fields (make sure their 'name' attributes match your state keys) */}
         <div>
          <label htmlFor="fullName">Full Name (Optional):</label>
          <input
            type="text"
            id="fullName"
            name="fullName" // Match state key
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="city">City (Optional):</label>
          <input
            type="text"
            id="city"
            name="city" // Match state key
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="state">State (Optional):</label>
          <input
            type="text"
            id="state"
            name="state" // Match state key
            value={formData.state}
            onChange={handleChange}
          />
        </div>
        {/* --- End of Form Inputs --- */}

        {/* --- Submit Button --- */}
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        {/* --- End of Submit Button --- */}
      </form>

      {/* --- Error Display --- */}
      {/* Display error message if the error state is not null */}
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {/* --- End of Error Display --- */}

      {/* --- Link to Login --- */}
      <p style={{ marginTop: '15px' }}>Already have an account? <Link to="/login">Login here</Link></p>
       {/* --- End of Link --- */}

    </div>
  );
}

export default RegisterPage;