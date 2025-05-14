import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// This component checks for authentication and renders children or redirects
function ProtectedRoute({ children }) {
  // Check if the token exists in localStorage
  
  const isAuthenticated = localStorage.getItem('token');

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page
    
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes or the element

  return children ? children : <Outlet />;
}

export default ProtectedRoute;