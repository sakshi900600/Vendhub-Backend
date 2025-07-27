// controllers/requirementController.js
const Requirement = require('../models/Requirement');

exports.postRequirement = async (req, res) => {
  try {
    const { productName, quantity } = req.body;

    if (!productName || !quantity) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const newRequirement = new Requirement({
      productName,
      quantity,
      user: req.user._id // from middleware
    });

    const saved = await newRequirement.save();

    res.status(201).json(saved);
  } catch (error) {
    console.error('Post requirement error:', error);
    res.status(500).json({ msg: 'Server Error' });
  }
};
