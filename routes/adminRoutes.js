// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes should be protected and only accessible by 'admin' role
router.use(protect);
router.use(authorizeRoles('admin'));

// Get dashboard statistics
router.get('/dashboard-stats', adminController.getDashboardStats);

// Get all transactions (orders)
router.get('/all-transactions', adminController.getAllTransactions);

// Get all users
router.get('/all-users', adminController.getAllUsers);

// Update user status (approve, activate, deactivate)
router.put('/users/:id/status', adminController.updateUserStatus);

module.exports = router;