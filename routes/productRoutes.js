const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// Protect all routes below this line
router.use(protect);

// Add product route - only farmers can add products
router.post('/add', authorizeRoles('farmer'), productController.addProduct);

// Get farmer's products - only farmers can view their products
router.get('/my-products', authorizeRoles('farmer'), productController.getMyProducts);
router.put('/edit/:id', protect, authorizeRoles('farmer'), productController.editProduct);

// Search farmer's products with optional keyword, category, and isActive filter
router.get('/search-my-products', authorizeRoles('farmer'), productController.searchMyProducts);
router.get('/all', productController.getAllProducts);


module.exports = router;
