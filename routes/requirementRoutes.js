// routes/requirementRoutes.js
const express = require('express');
const router = express.Router();
const { postRequirement } = require('../controllers/requirementController');
const { protect } = require('../middleware/authMiddleware');

router.post('/post', protect, postRequirement);

module.exports = router;
