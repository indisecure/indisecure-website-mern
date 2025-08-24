const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
const router = express.Router()
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 3);
  try {
    const user = new User({ email, passwordHash });
    await user.save();
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: 'User already exists or error occurred' });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Unauthorized' });
  const token = jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token });
});
module.exports = router



