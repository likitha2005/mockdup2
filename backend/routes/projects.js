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
  const userId = req.user?.id;

  console.log('>> DELETE request for project ID:', id);
  console.log('>> Authenticated user ID:', userId);

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Step 1: Delete fields belonging to resources of this project
  const deleteFields = `
    DELETE f FROM fields f
    JOIN resources r ON f.resource_id = r.id
    WHERE r.project_id = ?
  `;

  db.query(deleteFields, [id], (err) => {
    if (err) {
      console.error('>> Error deleting fields:', err);
      return res.status(500).json({ error: 'Failed to delete fields' });
    }

    // Step 2: Delete resources of the project
    const deleteResources = 'DELETE FROM resources WHERE project_id = ?';
    db.query(deleteResources, [id], (err) => {
      if (err) {
        console.error('>> Error deleting resources:', err);
        return res.status(500).json({ error: 'Failed to delete resources' });
      }

      // Step 3: Delete the project
      const deleteProject = 'DELETE FROM projects WHERE id = ? AND user_id = ?';
      db.query(deleteProject, [id, userId], (err, result) => {
        if (err) {
          console.error('>> Error deleting project:', err);
          return res.status(500).json({ error: 'DB error' });
        }

        if (result.affectedRows === 0) {
          console.warn('>> Project not found or not owned by user');
          return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        res.json({ message: 'Project deleted successfully' });
      });
    });
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
