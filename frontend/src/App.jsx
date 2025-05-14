import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
// Import your page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import AddBookPage from './pages/AddBookPage';
// Import the ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';
// Import the useAuth hook
import { useAuth } from './context/AuthContext';

import TradePage from './pages/TradePage'; 


function App() {
  // Get auth state and logout function from context
  const { isAuthenticated, logout, user } = useAuth();

  // Handle logout using the context function
  const handleLogout = () => {
    logout(); // Call the logout function from context
    // Context logout also clears localStorage and sets user to null
    // The ProtectedRoute component will handle redirection on protected routes
    // You might want a programmatic navigate here if you want to land on a specific page
    // navigate('/login'); // Requires useNavigate hook from react-router-dom
  };


  return (
    <>
      {/* Basic Navigation */}
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          {/* Conditionally render links based on isAuthenticated from context */}
          {!isAuthenticated ? (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          ) : (
            <>
              {/* Display username or name */}
               {user && <li>Hello, {user.username || user.fullName}!</li>}
              <li><Link to="/settings">Settings</Link></li>
              <li><Link to="/add-book">Add Book</Link></li>
              <li><Link to="/trades">Trades</Link></li> {/* Link for Trades page (create later) */}
              <li><button onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</button></li>
            </>
          )}
        </ul>
      </nav>

      {/* Define your routes */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        {/* Only show Login/Register if not authenticated? Optional. */}
        {!isAuthenticated && <Route path="/login" element={<LoginPage />} />}
        {!isAuthenticated && <Route path="/register" element={<RegisterPage />} />}


        {/* Protected Routes - Wrap the element with ProtectedRoute */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-book"
          element={
            <ProtectedRoute>
              <AddBookPage />
            </ProtectedRoute>
          }
        />
         {/* Protected Trade Route (create TradePage later) */}
         <Route
           path="/trades"
           element={
             <ProtectedRoute>
               <TradePage /> {/* Need to create TradePage */}
             </ProtectedRoute>
           }
         />


        {/* Add a catch-all for 404 later */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>

      <footer>{/* Your footer here */}</footer>
    </>
  );
}

export default App;

// Create a placeholder TradePage.jsx in frontend/src/pages
// function TradePage() { return <div><h2>Trade Requests</h2><p>Trade UI here</p></div>; }
// export default TradePage;