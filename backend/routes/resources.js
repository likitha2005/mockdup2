const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const { faker } = require('@faker-js/faker');

// --------------------
// Create a resource
// --------------------
router.post('/', verifyToken, (req, res) => {
  const { projectId, name, fields, count } = req.body;

  if (!name || !Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ error: 'Invalid resource data' });
  }

  db.query(
    'INSERT INTO resources (project_id, name, count) VALUES (?, ?, ?)',
    [projectId, name, count || 10],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Resource creation failed' });

      const resourceId = result.insertId;
      const fieldValues = fields.map(f => [resourceId, f.name, f.type]);

      db.query('INSERT INTO fields (resource_id, name, type) VALUES ?', [fieldValues], (err2) => {
        if (err2) return res.status(500).json({ error: 'Field insert failed' });

        res.status(201).json({ message: 'Resource created' });
      });
    }
  );
});

// Get all resources for a project by prefix
// Fetch all resources for a project prefix
// Fetch all resources under a given project prefix
router.get('/:prefix', verifyToken, (req, res) => {
  const { prefix } = req.params;

  db.query(
    `SELECT r.id, r.name, r.count 
     FROM projects p 
     JOIN resources r ON p.id = r.project_id 
     WHERE p.prefix = ?`,
    [prefix],
    (err, resources) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (resources.length === 0) return res.json([]);

      const resourceIds = resources.map(r => r.id);
      db.query(
        `SELECT resource_id, name, type FROM fields WHERE resource_id IN (?)`,
        [resourceIds],
        (fErr, fields) => {
          if (fErr) return res.status(500).json({ error: 'Fields error' });

          const enriched = resources.map(r => ({
            id: r.id,
            name: r.name,
            count: r.count,
            fields: fields.filter(f => f.resource_id === r.id).map(f => ({
              name: f.name,
              type: f.type
            }))
          }));

          res.json(enriched);
        }
      );
    }
  );
});


// --------------------
// Get generated resource data
// --------------------
router.get('/:projectPrefix/:resourceName', (req, res) => {
  const { projectPrefix, resourceName } = req.params;

  db.query(
    `SELECT r.id as resourceId, r.count
     FROM projects p
     JOIN resources r ON p.id = r.project_id
     WHERE p.prefix = ? AND r.name = ?`,
    [projectPrefix, resourceName],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      const resourceId = results[0].resourceId;
      const count = results[0].count;

      db.query(
        'SELECT name, type FROM fields WHERE resource_id = ?',
        [resourceId],
        (err2, fields) => {
          if (err2 || fields.length === 0) {
            return res.status(500).json({ error: 'Fields not found' });
          }

          const data = [];

          for (let i = 0; i < count; i++) {
            const obj = {};
            fields.forEach(field => {
              switch (field.type) {
                case 'name':
                  obj[field.name] = faker.person.fullName();
                  break;
                case 'email':
                  obj[field.name] = faker.internet.email();
                  break;
                case 'phone':
                  obj[field.name] = faker.phone.number('+91-##########');
                  break;
                case 'number':
                  obj[field.name] = faker.number.int({ min: 18, max: 99 });
                  break;
                case 'boolean':
                  obj[field.name] = faker.datatype.boolean();
                  break;
                case 'date':
                  obj[field.name] = faker.date.past().toISOString();
                  break;
                case 'country':
                  obj[field.name] = faker.location.country();
                  break;
                default:
                  obj[field.name] = faker.word.sample();
              }
            });
            data.push(obj);
          }

          res.json(data);
        }
      );
    }
  );
});

module.exports = router;
