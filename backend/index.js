const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors'); // ✅ only once
const db = require('./config/db');
const verifyToken = require('./middleware/authMiddleware');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const resourceRoutes = require('./routes/resources');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:3000",               // local dev
  "https://mockdup2-a.onrender.com"      // deployed frontend
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ Parse JSON
app.use(express.json());

// ✅ Serve static frontend (if needed)
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ✅ API routes
app.use('/api/auth', authRoutes); 
app.use('/api/projects', projectRoutes);
app.use('/api/resources', resourceRoutes);

// ✅ Example protected route
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.name}, this is protected data.` });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
