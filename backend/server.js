const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();



const app = express();

// Middleware
app.use(cors()); // Use cors middleware
app.use(express.json()); // Body parser for JSON data

// Define a simple root route (for testing)
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// Mount API routes here later
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/books', require('./routes/bookRoutes'));
// app.use('/api/trades', require('./routes/tradeRoutes'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});