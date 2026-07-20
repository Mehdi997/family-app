const { pool } = require('../config/database');

const getSavings = async (req, res) => {
  try {
    const [savings] = await pool.query('SELECT * FROM savings WHERE family_id = ? ORDER BY name', [req.user.family_id]);
    const enriched = savings.map(s => {
      const remaining = Math.max(0, s.target_amount - s.current_amount);
      const progress = s.target_amount > 0 ? Math.min(100, (s.current_amount / s.target_amount) * 100) : 0;
      let monthlyNeeded = 0;
      if (s.deadline && remaining > 0) {
        const now = new Date();
        const deadline = new Date(s.deadline);
        const monthsLeft = Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()));
        monthlyNeeded = Math.ceil(remaining / monthsLeft);
      }
      return { ...s, remaining, progress: Math.round(progress * 100) / 100, monthlyNeeded };
    });
    res.json({ savings: enriched });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const createSaving = async (req, res) => {
  try {
    const { name, icon, color, targetAmount, deadline, notes } = req.body;
    const [result] = await pool.query('INSERT INTO savings (family_id, name, icon, color, target_amount, deadline, notes) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id', [req.user.family_id, name, icon || 'Savings', color || '#4CAF50', targetAmount || 0, deadline || null, notes || null]);
    res.status(201).json({ message: 'Enveloppe créée.', id: result[0].id });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const updateSaving = async (req, res) => {
  try {
    const { name, icon, color, targetAmount, deadline, notes } = req.body;
    await pool.query('UPDATE savings SET name = ?, icon = ?, color = ?, target_amount = ?, deadline = ?, notes = ? WHERE id = ? AND family_id = ?', [name, icon, color, targetAmount, deadline || null, notes || null, req.params.id, req.user.family_id]);
    res.json({ message: 'Enveloppe mise à jour.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const deleteSaving = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM savings WHERE id = ? AND family_id = ? RETURNING id', [req.params.id, req.user.family_id]);
    if (result.length === 0) return res.status(404).json({ message: 'Enveloppe introuvable.' });
    res.json({ message: 'Enveloppe supprimée.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const addTransaction = async (req, res) => {
  try {
    const { amount, type, date, notes } = req.body;
    const [savings] = await pool.query('SELECT * FROM savings WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    if (savings.length === 0) return res.status(404).json({ message: 'Enveloppe introuvable.' });
    await pool.query('INSERT INTO saving_transactions (saving_id, amount, type, date, notes) VALUES (?, ?, ?, ?, ?)', [req.params.id, amount, type || 'deposit', date, notes || null]);
    const operator = (type === 'withdrawal') ? '-' : '+';
    await pool.query(`UPDATE savings SET current_amount = current_amount ${operator} ? WHERE id = ?`, [amount, req.params.id]);
    res.status(201).json({ message: 'Transaction enregistrée.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const getTransactions = async (req, res) => {
  try {
    const [transactions] = await pool.query('SELECT * FROM saving_transactions WHERE saving_id = ? ORDER BY date DESC', [req.params.id]);
    res.json({ transactions });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getSavings, createSaving, updateSaving, deleteSaving, addTransaction, getTransactions };