const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Create a project
router.post('/', verifyToken, (req, res) => {
  const { name, prefix } = req.body;
  const userId = req.user.id;

  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const finalPrefix = prefix || name.toLowerCase();

  db.query(
    'INSERT INTO projects (user_id, name, prefix) VALUES (?, ?, ?)',
    [userId, name, finalPrefix],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ message: 'Project created', projectId: result.insertId });
    }
  );
});

router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;            // comes from verifyToken middleware

  // Make sure user can delete only their own project
  const sql = 'DELETE FROM projects WHERE id = ? AND user_id = ?';
  db.query(sql, [id, userId], (err, result) => {
    if (err)   return res.status(500).json({ error: 'DB error' });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Project not found' });

    res.json({ message: 'Project deleted' });
  });
});


// Get all projects for user
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    'SELECT * FROM projects WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch projects' });
      res.json(results);
    }
  );
});

module.exports = router;
