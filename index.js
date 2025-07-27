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
    'http://localhost:5173', // Your local frontend dev server
    'https://vendhub-frontend.vercel.app/', // <--- REPLACE THIS with your actual deployed frontend URL!
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));


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
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//     console.log(`App is listening at port ${PORT}`)
// );


if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => console.log(`Listening on ${PORT}`))
}


module.exports = app  