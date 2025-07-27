const Product = require('../models/Product'); // Path to your Product model
const User = require('../models/User');     // Path to your User model

// Middleware to authenticate token (assuming you have this from previous steps)
// This should be in your main app.js or a separate auth middleware file
// const authenticateToken = (req, res, next) => { /* ... your JWT authentication logic ... */ };
exports.getMyProducts = async (req, res) => {
    try {
        const farmerId = req.user.id; // or req.user._id depending on JWT setup
        const products = await Product.find({ owner: farmerId });

        res.status(200).json({
            msg: 'Farmer products fetched successfully',
            products
        });
    } catch (err) {
        console.error('Error fetching farmer products:', err);
        res.status(500).json({ msg: 'Server error while fetching products.' });
    }
};

exports.addProduct = async (req, res) => {
    // Ensure the user is authenticated and is a 'farmer'
    // This check should ideally be done by an authentication/authorization middleware
    // For now, we'll assume req.user is populated by your JWT middleware
    if (!req.user || req.user.role !== 'farmer') {
        return res.status(403).json({ msg: 'Access denied. Only farmers can add products.' });
    }

    const { name, stock, unit, price, description, category, imageUrl } = req.body;
    const ownerId = req.user.id; // Get the farmer's ID from the authenticated user

    // Basic validation
    if (!name || !stock || !unit || !price) {
        return res.status(400).json({ msg: 'Please provide product name, stock, unit, and price.' });
    }
    if (stock < 0 || price < 0) {
        return res.status(400).json({ msg: 'Stock and price cannot be negative.' });
    }

    try {
        // Optional: Check if a product with the same name already exists for this farmer
        const existingProduct = await Product.findOne({ name, owner: ownerId });
        if (existingProduct) {
            return res.status(409).json({ msg: 'You already have a product with this name.' });
        }

        const newProduct = new Product({
            name,
            stock,
            unit,
            price,
            owner: ownerId,
            description: description || '',
            category: category || 'Uncategorized',
            imageUrl: imageUrl || null
        });

        await newProduct.save();

        // Optional: Update farmer's totalProducts count (if you want to maintain it on the User model)
        await User.findByIdAndUpdate(ownerId, { $inc: { totalProducts: 1 } });

        res.status(201).json({ msg: 'Product added successfully!', product: newProduct });

    } catch (err) {
        console.error('Error adding product:', err);
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ msg: `Validation Error: ${errors.join(', ')}` });
        }
        res.status(500).json({ msg: 'Server error while adding product.' });
    }
};

// You can add more product-related functions here (e.g., updateProduct, getProductsByFarmer, deleteProduct)

// only farmers can see it. 
exports.searchMyProducts = async (req, res) => {
    try {
        const farmerId = req.user.id;
        const { keyword, category, isActive } = req.query;

        const query = { owner: farmerId };

        if (keyword) {
            query.$text = { $search: keyword };
        }

        if (category) {
            query.category = category;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const products = await Product.find(query);

        res.status(200).json({
            msg: 'Search results fetched successfully',
            results: products
        });
    } catch (err) {
        console.error('Error searching products:', err);
        res.status(500).json({ msg: 'Server error while searching products.' });
    }
};


// ✅ Anyone (like vendors) can use this to see all available products
exports.getAllProducts = async (req, res) => {
    try {
        const { keyword, category, isActive } = req.query;

        const query = {};

        // Optional text search
        if (keyword) {
            query.$text = { $search: keyword };
        }

        // Optional filters
        if (category) {
            query.category = category;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const products = await Product.find(query).populate('owner', 'name email'); // if you want vendor to see who the farmer is

        res.status(200).json({
            msg: 'All products fetched successfully',
            products
        });
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).json({ msg: 'Server error while fetching all products.' });
    }
};



