/**
 * Contrôleur des dépenses - PostgreSQL
 */
const { pool } = require('../config/database');

const getExpenses = async (req, res) => {
  try {
    const familyId = req.user.family_id;
    const { category, startDate, endDate, search, page = 1, limit = 20, sort = 'date', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    let conditions = 'WHERE e.family_id = ?';
    const params = [familyId];

    if (category) { params.push(category); conditions += ' AND e.category_id = ?'; }
    if (startDate) { params.push(startDate); conditions += ' AND e.date >= ?'; }
    if (endDate) { params.push(endDate); conditions += ' AND e.date <= ?'; }
    if (search) { params.push(`%${search}%`); conditions += ' AND e.label ILIKE ?'; }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM expenses e ${conditions}`, params);
    const [sumResult] = await pool.query(`SELECT COALESCE(SUM(e.amount), 0) as total FROM expenses e ${conditions}`, params);

    const allowedSorts = ['date', 'amount', 'label'];
    const sortField = allowedSorts.includes(sort) ? `e.${sort}` : 'e.date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [expenses] = await pool.query(
      `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
              u.first_name, u.last_name
       FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN users u ON e.user_id = u.id
       ${conditions} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ expenses, total: parseFloat(sumResult[0].total),
      pagination: { total: parseInt(countResult[0].total), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countResult[0].total / limit) } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const createExpense = async (req, res) => {
  try {
    const { label, amount, date, categoryId, notes } = req.body;
    const receiptFile = req.file ? `/uploads/receipts/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO expenses (family_id, user_id, category_id, label, amount, date, notes, receipt_file)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [req.user.family_id, req.user.id, categoryId || null, label, amount, date, notes || null, receiptFile]
    );
    res.status(201).json({ message: 'Dépense ajoutée.', id: result[0].id });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const updateExpense = async (req, res) => {
  try {
    const { label, amount, date, categoryId, notes } = req.body;
    const [existing] = await pool.query('SELECT id FROM expenses WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Introuvable.' });
    await pool.query('UPDATE expenses SET label=?, amount=?, date=?, category_id=?, notes=? WHERE id=?',
      [label, amount, date, categoryId || null, notes || null, req.params.id]);
    res.json({ message: 'Mis à jour.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const deleteExpense = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM expenses WHERE id = ? AND family_id = ? RETURNING id', [req.params.id, req.user.family_id]);
    if (result.length === 0) return res.status(404).json({ message: 'Introuvable.' });
    res.json({ message: 'Supprimée.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
