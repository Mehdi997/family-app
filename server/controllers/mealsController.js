const { pool } = require('../config/database');

const getMealPlan = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM meal_plans WHERE family_id = ?';
    const params = [req.user.family_id];
    if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND date <= ?'; params.push(endDate); }
    query += " ORDER BY date, CASE meal_type WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 WHEN 'snack' THEN 4 ELSE 5 END";
    const [meals] = await pool.query(query, params);
    res.json({ meals });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const createMeal = async (req, res) => {
  try {
    const { date, mealType, name, ingredients, notes } = req.body;
    const [result] = await pool.query('INSERT INTO meal_plans (family_id, date, meal_type, name, ingredients, notes) VALUES (?, ?, ?, ?, ?, ?) RETURNING id', [req.user.family_id, date, mealType, name, ingredients ? JSON.stringify(ingredients) : null, notes || null]);
    res.status(201).json({ message: 'Repas ajouté.', id: result[0].id });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const updateMeal = async (req, res) => {
  try {
    const { date, mealType, name, ingredients, notes } = req.body;
    await pool.query('UPDATE meal_plans SET date = ?, meal_type = ?, name = ?, ingredients = ?, notes = ? WHERE id = ? AND family_id = ?', [date, mealType, name, ingredients ? JSON.stringify(ingredients) : null, notes || null, req.params.id, req.user.family_id]);
    res.json({ message: 'Repas mis à jour.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const deleteMeal = async (req, res) => {
  try {
    await pool.query('DELETE FROM meal_plans WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    res.json({ message: 'Repas supprimé.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const generateGroceryList = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const [meals] = await pool.query('SELECT * FROM meal_plans WHERE family_id = ? AND date BETWEEN ? AND ? AND ingredients IS NOT NULL', [req.user.family_id, startDate, endDate]);
    const ingredientsMap = {};
    for (const meal of meals) {
      try {
        const ingredients = JSON.parse(meal.ingredients);
        if (Array.isArray(ingredients)) {
          for (const ing of ingredients) {
            const key = ing.name?.toLowerCase();
            if (key) {
              if (ingredientsMap[key]) ingredientsMap[key].quantity += (ing.quantity || 1);
              else ingredientsMap[key] = { ...ing };
            }
          }
        }
      } catch (e) {}
    }
    const [listResult] = await pool.query('INSERT INTO grocery_lists (family_id, name, type, date) VALUES (?, ?, ?, ?) RETURNING id', [req.user.family_id, `Courses du ${startDate} au ${endDate}`, 'weekly', startDate]);
    const listId = listResult[0].id;
    const items = Object.values(ingredientsMap);
    for (const item of items) {
      await pool.query('INSERT INTO grocery_items (list_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?)', [listId, item.name, item.quantity || 1, item.unit || null, item.category || null]);
    }
    res.status(201).json({ message: 'Liste de courses générée.', listId, itemsCount: items.length });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getMealPlan, createMeal, updateMeal, deleteMeal, generateGroceryList };