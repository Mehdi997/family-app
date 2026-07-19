/**
 * Contrôleur des économies (enveloppes)
 * Gère les objectifs d'épargne et les transactions
 */
const { pool } = require('../config/database');

/** GET /api/savings */
const getSavings = async (req, res) => {
  try {
    const [savings] = await pool.query(
      'SELECT * FROM savings WHERE family_id = ? ORDER BY name',
      [req.user.family_id]
    );

    // Ajouter des calculs pour chaque enveloppe
    const enriched = savings.map(s => {
      const remaining = Math.max(0, s.target_amount - s.current_amount);
      const progress = s.target_amount > 0
        ? Math.min(100, (s.current_amount / s.target_amount) * 100)
        : 0;

      // Calcul mensuel si deadline
      let monthlyNeeded = 0;
      if (s.deadline && remaining > 0) {
        const now = new Date();
        const deadline = new Date(s.deadline);
        const monthsLeft = Math.max(1,
          (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth())
        );
        monthlyNeeded = Math.ceil(remaining / monthsLeft);
      }

      return { ...s, remaining, progress: Math.round(progress * 100) / 100, monthlyNeeded };
    });

    res.json({ savings: enriched });
  } catch (error) {
    console.error('Erreur économies:', error);
    res.status(500).json({ message: 'Erreur lors du chargement.' });
  }
};

/** POST /api/savings */
const createSaving = async (req, res) => {
  try {
    const { name, icon, color, targetAmount, deadline, notes } = req.body;

    const [result] = await pool.query(
      'INSERT INTO savings (family_id, name, icon, color, target_amount, deadline, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.family_id, name, icon || 'Savings', color || '#4CAF50', targetAmount || 0, deadline || null, notes || null]
    );

    res.status(201).json({ message: 'Enveloppe créée.', id: result.insertId });
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(500).json({ message: 'Erreur lors de la création.' });
  }
};

/** PUT /api/savings/:id */
const updateSaving = async (req, res) => {
  try {
    const { name, icon, color, targetAmount, deadline, notes } = req.body;

    await pool.query(
      'UPDATE savings SET name = ?, icon = ?, color = ?, target_amount = ?, deadline = ?, notes = ? WHERE id = ? AND family_id = ?',
      [name, icon, color, targetAmount, deadline || null, notes || null, req.params.id, req.user.family_id]
    );

    res.json({ message: 'Enveloppe mise à jour.' });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
};

/** DELETE /api/savings/:id */
const deleteSaving = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM savings WHERE id = ? AND family_id = ?',
      [req.params.id, req.user.family_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Enveloppe introuvable.' });
    res.json({ message: 'Enveloppe supprimée.' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};

/** POST /api/savings/:id/transaction */
const addTransaction = async (req, res) => {
  try {
    const { amount, type, date, notes } = req.body;

    // Vérifier l'enveloppe
    const [savings] = await pool.query(
      'SELECT * FROM savings WHERE id = ? AND family_id = ?',
      [req.params.id, req.user.family_id]
    );
    if (savings.length === 0) return res.status(404).json({ message: 'Enveloppe introuvable.' });

    // Ajouter la transaction
    await pool.query(
      'INSERT INTO saving_transactions (saving_id, amount, type, date, notes) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, amount, type || 'deposit', date, notes || null]
    );

    // Mettre à jour le montant courant
    const operator = (type === 'withdrawal') ? '-' : '+';
    await pool.query(
      `UPDATE savings SET current_amount = current_amount ${operator} ? WHERE id = ?`,
      [amount, req.params.id]
    );

    res.status(201).json({ message: 'Transaction enregistrée.' });
  } catch (error) {
    console.error('Erreur transaction:', error);
    res.status(500).json({ message: 'Erreur lors de la transaction.' });
  }
};

/** GET /api/savings/:id/transactions */
const getTransactions = async (req, res) => {
  try {
    const [transactions] = await pool.query(
      'SELECT * FROM saving_transactions WHERE saving_id = ? ORDER BY date DESC',
      [req.params.id]
    );
    res.json({ transactions });
  } catch (error) {
    console.error('Erreur transactions:', error);
    res.status(500).json({ message: 'Erreur lors du chargement.' });
  }
};

module.exports = { getSavings, createSaving, updateSaving, deleteSaving, addTransaction, getTransactions };
