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
app.use(cors()); // Make sure this is configured correctly for your frontend origin
app.use(express.json({ extended: false }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes); // USE NEW ADMIN ROUTES

// Basic root route
app.get('/', (req, res) => res.send('VendHub Backend API is running!'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`App is listening at port ${PORT}`)
);