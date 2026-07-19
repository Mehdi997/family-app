/**
 * Contrôleur des documents - PostgreSQL
 */
const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

const getDocuments = async (req, res) => {
  try {
    const { type, search, tags, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = 'WHERE d.family_id = ?';
    const params = [req.user.family_id];

    if (type) { params.push(type); conditions += ' AND d.type = ?'; }
    if (search) { const s = `%${search}%`; params.push(s, s); conditions += ' AND (d.name ILIKE ? OR d.tags ILIKE ?)'; }
    if (tags) { params.push(`%${tags}%`); conditions += ' AND d.tags ILIKE ?'; }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM documents d ${conditions}`, params);
    const [documents] = await pool.query(
      `SELECT d.*, u.first_name, u.last_name FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id ${conditions}
       ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ documents,
      pagination: { total: parseInt(countResult[0].total), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countResult[0].total / limit) } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier.' });
    const { name, type, tags, notes } = req.body;
    const filePath = `/uploads/documents/${req.file.filename}`;
    const [result] = await pool.query(
      `INSERT INTO documents (family_id, uploaded_by, name, type, file_path, file_size, mime_type, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [req.user.family_id, req.user.id, name || req.file.originalname, type || 'other',
       filePath, req.file.size, req.file.mimetype, tags || null, notes || null]
    );
    res.status(201).json({ message: 'Uploadé.', id: result[0].id });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const deleteDocument = async (req, res) => {
  try {
    const [docs] = await pool.query('SELECT file_path FROM documents WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    if (docs.length === 0) return res.status(404).json({ message: 'Introuvable.' });
    const filePath = path.join(__dirname, '..', docs[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supprimé.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getDocuments, uploadDocument, deleteDocument };
