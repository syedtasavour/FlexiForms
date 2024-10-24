const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Environment variables loaded:', process.env);

const app = express();

// Update CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Update uploads directory path for production
const uploadsDir = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'uploads')
  : path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flexiforms';
console.log('MONGODB_URI:', MONGODB_URI);

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in the environment variables');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);  // Exit if can't connect to database
});

// Add this before your routes
if (process.env.NODE_ENV === 'production') {
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
}

// Routes
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);

// Add this near your other routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// No rate limiting implementation

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Add after your existing imports
// const path = require('path');  // Already imported at the top

// Add after your API routes
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

app.use(helmet());
