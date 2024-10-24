const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Registration attempt:', { username, email });

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password
    });

    await user.save();
    console.log('User registered successfully:', email);

    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'An error occurred during registration' 
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Demo protected route
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.header('Authorization');

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

module.exports = router;
