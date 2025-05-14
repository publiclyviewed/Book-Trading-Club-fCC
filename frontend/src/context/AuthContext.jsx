import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the Context
const AuthContext = createContext();

// Get the backend URL from the environment variable
const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000/api';

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null initially
  const [loading, setLoading] = useState(true); // true while checking token on load

  // Check for token and fetch user on initial load
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          // Use the /api/auth/user route you might have added or /api/users/me
           const response = await axios.get(`${API_URL}/users/me`, config); // Using /users/me

          setUser(response.data); // Set user data if token is valid
        } catch (error) {
          console.error('Failed to fetch user with token:', error);
          // If token is invalid or expired, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo'); // Clear cached info too
          setUser(null);
        }
      }
      setLoading(false); // Loading is complete
    };

    loadUser();
  }, []); // Empty dependency array means this runs only once on mount

  // Login function: saves token and sets user
  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userData)); // Cache user info
    setUser(userData);
    // Optional: Refetch user data from /users/me after login for consistency
    // loadUser();
  };

  // Logout function: clears token and user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo'); // Clear cached info too
    setUser(null);
    // No need to call backend logout endpoint unless you have server-side sessions
  };

   // Value provided to components using this context
  const contextValue = {
    user, // The current user object (or null)
    loading, // Is the initial loading check still in progress?
    isAuthenticated: !!user, // Simple boolean check if user is logged in
    login, // Function to call after successful login
    logout, // Function to call for logging out
  };

  // Render the provider, passing the context value
  return (
    <AuthContext.Provider value={contextValue}>
      {/* Only render children once loading is complete */}
      {!loading && children}
      {/* Optionally, show a loading spinner here while loading */}
      {loading && <div>Loading application...</div>}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the auth context value
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the AuthContext itself (optional, primarily use the hook)
export default AuthContext;