/**
 * Contrôleur des revenus - PostgreSQL
 */
const { pool } = require('../config/database');

const getIncomes = async (req, res) => {
  try {
    const familyId = req.user.family_id;
    const { userId, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = 'WHERE i.family_id = ?';
    let params = [familyId];

    if (userId) { params.push(userId); conditions += ' AND i.user_id = ?'; }
    if (type) { params.push(type); conditions += ' AND i.type = ?'; }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM incomes i ${conditions}`, params);

    const [incomes] = await pool.query(
      `SELECT i.*, u.first_name, u.last_name FROM incomes i
       LEFT JOIN users u ON i.user_id = u.id ${conditions}
       ORDER BY i.date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const now = new Date();
    const [monthlyTotal] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM incomes
       WHERE family_id = ? AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?`,
      [familyId, now.getMonth() + 1, now.getFullYear()]
    );

    const [yearlyTotal] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM incomes
       WHERE family_id = ? AND EXTRACT(YEAR FROM date) = ?`,
      [familyId, now.getFullYear()]
    );

    const [byMember] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, COALESCE(SUM(i.amount), 0) as total
       FROM users u LEFT JOIN incomes i ON u.id = i.user_id
       AND EXTRACT(MONTH FROM i.date) = ? AND EXTRACT(YEAR FROM i.date) = ?
       WHERE u.family_id = ? GROUP BY u.id, u.first_name, u.last_name`,
      [now.getMonth() + 1, now.getFullYear(), familyId]
    );

    res.json({
      incomes, monthlyTotal: parseFloat(monthlyTotal[0].total),
      yearlyTotal: parseFloat(yearlyTotal[0].total), byMember,
      pagination: { total: parseInt(countResult[0].total), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countResult[0].total / limit) },
    });
  } catch (error) {
    console.error('Erreur revenus:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const createIncome = async (req, res) => {
  try {
    const { userId, type, label, amount, frequency, date, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO incomes (family_id, user_id, type, label, amount, frequency, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [req.user.family_id, userId || req.user.id, type || 'salary', label, amount, frequency || 'monthly', date, notes || null]
    );
    res.status(201).json({ message: 'Revenu ajouté.', id: result[0].id });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const updateIncome = async (req, res) => {
  try {
    const { userId, type, label, amount, frequency, date, notes } = req.body;
    const [existing] = await pool.query('SELECT id FROM incomes WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Introuvable.' });
    await pool.query(
      'UPDATE incomes SET user_id=?, type=?, label=?, amount=?, frequency=?, date=?, notes=? WHERE id=?',
      [userId || req.user.id, type, label, amount, frequency, date, notes || null, req.params.id]
    );
    res.json({ message: 'Mis à jour.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const deleteIncome = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM incomes WHERE id = ? AND family_id = ? RETURNING id', [req.params.id, req.user.family_id]);
    if (result.length === 0) return res.status(404).json({ message: 'Introuvable.' });
    res.json({ message: 'Supprimé.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome };
