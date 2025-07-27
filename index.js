// D:\Hackathon\TutedudeHackathon\Backend\Backend\index.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config(); // Load environment variables from .env file

const authRoutes = require('./routes/authroutes');
const productRoutes = require('./routes/productRoutes');
const requirementRoutes = require('./routes/requirementRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes'); // IMPORT NEW ADMIN ROUTES

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173', // Your local frontend dev server (Vite default)
    'http://localhost:3000', // Common React dev server port (if you use CRA)
    'https://vendhub-frontend.vercel.app', // **IMPORTANT: Frontend deployed URL WITHOUT trailing slash**
    'https://vendhub-frontend.vercel.app/', // **IMPORTANT: Frontend deployed URL WITH trailing slash**
    // Make sure to add your *exact* deployed frontend URL here.
    // If your frontend is deployed under a different URL (e.g., a custom domain), add that too.
];

app.use(cors({
  origin: function (origin, callback) {
    // This log is crucial for debugging. Check your Vercel backend logs for the exact 'origin' string.
    console.log('CORS Request Origin:', origin); 

    // Allow requests with no origin (like mobile apps, curl, or if it's a same-origin request from Vercel's internal routing)
    // and requests from the allowedOrigins list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS Blocked: Origin not in allowed list:', origin);
      callback(new Error(`Not allowed by CORS: ${origin}`)); // Add origin to error message for clarity
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Ensure all necessary methods are allowed
  allowedHeaders: ['Content-Type', 'Authorization'], // Ensure all necessary headers are allowed
  credentials: true, // Allow cookies, authorization headers, etc.
}));


app.use(express.json({ extended: false }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // In production, consider exiting the process if DB connection fails
        // process.exit(1); 
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes); // USE NEW ADMIN ROUTES

// Basic root route
app.get('/', (req, res) => res.send('VendHub Backend API is running!'));

// Start the server
// This conditional app.listen is for Vercel deployment where Express app is exported
// and local development where it listens on a port.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

module.exports = app;