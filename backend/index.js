const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./config/db');
const verifyToken = require('./middleware/authMiddleware');
const authRoutes = require('./routes/auth'); // ✅ Only declared once

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Auth routes
app.use('/api/auth', authRoutes); // 👈 All auth routes like /signup, /login

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.name}, this is protected data.` });
});

const projectRoutes = require('./routes/projects');
app.use('/api/projects', projectRoutes);

app.use('/api/projects', require('./routes/projects'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Load routes
const resourceRoutes = require('./routes/resources');

// Routes mounted correctly
app.use('/api/resources', resourceRoutes); // for POST and /resources/:prefix
app.use('/api', resourceRoutes); // ✅ this covers /api/:projectPrefix/:resourceName

