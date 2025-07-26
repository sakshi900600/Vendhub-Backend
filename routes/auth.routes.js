const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);



router.get('/me', auth, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});



module.exports = router;
