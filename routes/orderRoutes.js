const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getVendorOrders,
  updateOrderStatus,
  getOrdersForMyProducts
} = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');


// Vendor: Place order
router.post('/place', protect, placeOrder);

// Vendor: Get my orders
router.get('/my', protect, getVendorOrders);

// Farmer: Update order status (must be owner of the product)
router.put('/:orderId/status', protect, updateOrderStatus);


// Farmer: view all orders made on their products
router.get('/farmer-orders', protect, authorizeRoles('farmer'), getOrdersForMyProducts);

module.exports = router;
