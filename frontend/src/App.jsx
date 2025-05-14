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
// import TradePage from './pages/TradePage'; // For later
// import NotFoundPage from './pages/NotFoundPage'; // Good practice


function App() {
  // We'll manage auth state (like isLoggedIn) more dynamically later
  // For now, ProtectedRoute does the localStorage check directly

  // Function to handle logout (clear token and redirect)
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    localStorage.removeItem('userInfo'); // Also remove user info if stored
    // You might want to make a backend call to invalidate the token on the server too
    window.location.href = '/login'; // Simple redirect, or use navigate('/')
  };


  // Determine if user is logged in for conditional navigation links
  const isLoggedIn = localStorage.getItem('token'); // Simple check


  return (
    <>
      {/* Basic Navigation */}
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          {/* Conditionally render links based on login status */}
          {!isLoggedIn ? (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/settings">Settings</Link></li>
              <li><Link to="/add-book">Add Book</Link></li>
              {/* <li><Link to="/trades">Trades</Link></li> */}
              <li><button onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</button></li> {/* Simple button for now */}
            </>
          )}
        </ul>
      </nav>

      {/* Define your routes */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

        {/* Protected Trade Route (for later) */}
        {/* <Route
          path="/trades"
          element={
            <ProtectedRoute>
              <TradePage />
            </ProtectedRoute>
          }
        /> */}


        {/* Add a catch-all for 404 later */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>

      <footer>{/* Your footer here */}</footer>
    </>
  );
}

export default App;