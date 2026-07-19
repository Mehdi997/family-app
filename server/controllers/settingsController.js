/**
 * Contrôleur des paramètres
 * Gère les paramètres famille, catégories, budgets
 */
const { pool } = require('../config/database');

/** GET /api/settings */
const getSettings = async (req, res) => {
  try {
    const [settings] = await pool.query(
      'SELECT * FROM settings WHERE family_id = ?',
      [req.user.family_id]
    );

    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE family_id = ? ORDER BY type, name',
      [req.user.family_id]
    );

    const [members] = await pool.query(
      'SELECT id, first_name, last_name, email, phone, avatar, role FROM users WHERE family_id = ?',
      [req.user.family_id]
    );

    const [family] = await pool.query(
      'SELECT * FROM families WHERE id = ?',
      [req.user.family_id]
    );

    res.json({
      settings: settings[0] || {},
      categories,
      members,
      family: family[0],
    });
  } catch (error) {
    console.error('Erreur paramètres:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** PUT /api/settings */
const updateSettings = async (req, res) => {
  try {
    const { currency, language, theme, notificationsEnabled, weeklyBudget, monthlyBudget } = req.body;

    await pool.query(
      `UPDATE settings SET currency = ?, language = ?, theme = ?, notifications_enabled = ?,
       weekly_budget = ?, monthly_budget = ? WHERE family_id = ?`,
      [currency || 'DA', language || 'fr', theme || 'auto',
       notificationsEnabled !== false, weeklyBudget || null, monthlyBudget || null,
       req.user.family_id]
    );

    res.json({ message: 'Paramètres mis à jour.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** POST /api/settings/categories */
const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;

    const [result] = await pool.query(
      'INSERT INTO categories (family_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.family_id, name, type, icon || null, color || null]
    );

    res.status(201).json({ message: 'Catégorie créée.', id: result.insertId });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** PUT /api/settings/categories/:id */
const updateCategory = async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    await pool.query(
      'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ? AND family_id = ?',
      [name, icon, color, req.params.id, req.user.family_id]
    );

    res.json({ message: 'Catégorie mise à jour.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** DELETE /api/settings/categories/:id */
const deleteCategory = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM categories WHERE id = ? AND family_id = ? AND is_default = FALSE',
      [req.params.id, req.user.family_id]
    );
    res.json({ message: 'Catégorie supprimée.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

module.exports = { getSettings, updateSettings, createCategory, updateCategory, deleteCategory };
