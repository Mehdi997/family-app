const { pool } = require('../config/database');

const getLists = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM grocery_lists WHERE family_id = ?';
    const params = [req.user.family_id];
    if (status === 'active') query += ' AND is_completed = FALSE';
    if (status === 'completed') query += ' AND is_completed = TRUE';
    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [lists] = await pool.query(query, params);
    for (const list of lists) {
      const [items] = await pool.query(`SELECT COUNT(*) as total_items, SUM(CASE WHEN is_checked THEN 1 ELSE 0 END) as checked_items, COALESCE(SUM(estimated_price * quantity), 0) as estimated_total, COALESCE(SUM(CASE WHEN is_checked THEN actual_price * quantity ELSE 0 END), 0) as actual_total FROM grocery_items WHERE list_id = ?`, [list.id]);
      list.stats = items[0];
    }
    res.json({ lists });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const getList = async (req, res) => {
  try {
    const [lists] = await pool.query('SELECT * FROM grocery_lists WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    if (lists.length === 0) return res.status(404).json({ message: 'Liste introuvable.' });
    const [items] = await pool.query('SELECT * FROM grocery_items WHERE list_id = ? ORDER BY id ASC', [req.params.id]);
    res.json({ list: lists[0], items });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const createList = async (req, res) => {
  try {
    const { name, type, budget, store, date, notes } = req.body;
    const [result] = await pool.query('INSERT INTO grocery_lists (family_id, name, type, budget, store, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id', [req.user.family_id, name, type || 'weekly', budget || null, store || null, date || null, notes || null]);
    res.status(201).json({ message: 'Liste créée.', id: result[0].id });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const duplicateList = async (req, res) => {
  try {
    const [originalLists] = await pool.query('SELECT * FROM grocery_lists WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    if (originalLists.length === 0) return res.status(404).json({ message: 'Liste introuvable.' });
    const orig = originalLists[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const [listResult] = await pool.query(
      'INSERT INTO grocery_lists (family_id, name, type, budget, store, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [req.user.family_id, `${orig.name} (copie)`, orig.type, orig.budget, orig.store, todayStr, orig.notes]
    );
    const newListId = listResult[0].id;
    const [items] = await pool.query('SELECT * FROM grocery_items WHERE list_id = ?', [req.params.id]);
    for (const item of items) {
      await pool.query(
        'INSERT INTO grocery_items (list_id, name, quantity, unit, estimated_price, category, is_checked) VALUES (?, ?, ?, ?, ?, ?, FALSE)',
        [newListId, item.name, item.quantity || 1, item.unit || null, item.estimated_price || null, item.category || null]
      );
    }
    res.status(201).json({ message: 'Liste dupliquée avec succès !', id: newListId });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const addItem = async (req, res) => {
  try {
    const { name, quantity, unit, estimatedPrice, category } = req.body;
    const [result] = await pool.query('INSERT INTO grocery_items (list_id, name, quantity, unit, estimated_price, category) VALUES (?, ?, ?, ?, ?, ?) RETURNING id', [req.params.id, name, quantity || 1, unit || null, estimatedPrice || null, category || null]);
    res.status(201).json({ message: 'Article ajouté.', id: result[0].id });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const updateItem = async (req, res) => {
  try {
    const { name, quantity, unit, estimatedPrice, actualPrice, category, isChecked } = req.body;
    await pool.query(`UPDATE grocery_items SET name = ?, quantity = ?, unit = ?, estimated_price = ?, actual_price = ?, category = ?, is_checked = ? WHERE id = ?`, [name, quantity || 1, unit || null, estimatedPrice || 0, actualPrice || null, category || null, isChecked || false, req.params.itemId]);
    res.json({ message: 'Article mis à jour.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const toggleItem = async (req, res) => {
  try {
    const { actualPrice } = req.body;
    await pool.query('UPDATE grocery_items SET is_checked = NOT is_checked, actual_price = ? WHERE id = ?', [actualPrice || null, req.params.itemId]);
    res.json({ message: 'Article coché/décoché.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const deleteList = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM grocery_lists WHERE id = ? AND family_id = ? RETURNING id', [req.params.id, req.user.family_id]);
    if (result.length === 0) return res.status(404).json({ message: 'Liste introuvable.' });
    res.json({ message: 'Liste supprimée.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const deleteItem = async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_items WHERE id = ?', [req.params.itemId]);
    res.json({ message: 'Article supprimé.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getLists, getList, createList, duplicateList, addItem, updateItem, toggleItem, deleteList, deleteItem };