/**
 * Contrôleur du planning des repas
 * Planning hebdomadaire avec génération de listes de courses
 */
const { pool } = require('../config/database');

/** GET /api/meals?startDate=...&endDate=... */
const getMealPlan = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM meal_plans WHERE family_id = ?';
    const params = [req.user.family_id];

    if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND date <= ?'; params.push(endDate); }

    query += ' ORDER BY date, FIELD(meal_type, "breakfast", "lunch", "dinner", "snack")';

    const [meals] = await pool.query(query, params);
    res.json({ meals });
  } catch (error) {
    console.error('Erreur repas:', error);
    res.status(500).json({ message: 'Erreur lors du chargement.' });
  }
};

/** POST /api/meals */
const createMeal = async (req, res) => {
  try {
    const { date, mealType, name, ingredients, notes } = req.body;

    const [result] = await pool.query(
      'INSERT INTO meal_plans (family_id, date, meal_type, name, ingredients, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.family_id, date, mealType, name, ingredients ? JSON.stringify(ingredients) : null, notes || null]
    );

    res.status(201).json({ message: 'Repas ajouté.', id: result.insertId });
  } catch (error) {
    console.error('Erreur création repas:', error);
    res.status(500).json({ message: 'Erreur lors de la création.' });
  }
};

/** PUT /api/meals/:id */
const updateMeal = async (req, res) => {
  try {
    const { date, mealType, name, ingredients, notes } = req.body;

    await pool.query(
      'UPDATE meal_plans SET date = ?, meal_type = ?, name = ?, ingredients = ?, notes = ? WHERE id = ? AND family_id = ?',
      [date, mealType, name, ingredients ? JSON.stringify(ingredients) : null, notes || null, req.params.id, req.user.family_id]
    );

    res.json({ message: 'Repas mis à jour.' });
  } catch (error) {
    console.error('Erreur mise à jour repas:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
};

/** DELETE /api/meals/:id */
const deleteMeal = async (req, res) => {
  try {
    await pool.query('DELETE FROM meal_plans WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    res.json({ message: 'Repas supprimé.' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** POST /api/meals/generate-grocery */
const generateGroceryList = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Récupérer tous les ingrédients de la période
    const [meals] = await pool.query(
      'SELECT * FROM meal_plans WHERE family_id = ? AND date BETWEEN ? AND ? AND ingredients IS NOT NULL',
      [req.user.family_id, startDate, endDate]
    );

    // Agréger les ingrédients
    const ingredientsMap = {};
    for (const meal of meals) {
      try {
        const ingredients = JSON.parse(meal.ingredients);
        if (Array.isArray(ingredients)) {
          for (const ing of ingredients) {
            const key = ing.name?.toLowerCase();
            if (key) {
              if (ingredientsMap[key]) {
                ingredientsMap[key].quantity += (ing.quantity || 1);
              } else {
                ingredientsMap[key] = { ...ing };
              }
            }
          }
        }
      } catch (e) { /* skip */ }
    }

    // Créer la liste de courses
    const [listResult] = await pool.query(
      'INSERT INTO grocery_lists (family_id, name, type, date) VALUES (?, ?, ?, ?)',
      [req.user.family_id, `Courses du ${startDate} au ${endDate}`, 'weekly', startDate]
    );

    // Ajouter les articles
    const items = Object.values(ingredientsMap);
    for (const item of items) {
      await pool.query(
        'INSERT INTO grocery_items (list_id, name, quantity, unit, category) VALUES (?, ?, ?, ?, ?)',
        [listResult.insertId, item.name, item.quantity || 1, item.unit || null, item.category || null]
      );
    }

    res.status(201).json({
      message: 'Liste de courses générée.',
      listId: listResult.insertId,
      itemsCount: items.length,
    });
  } catch (error) {
    console.error('Erreur génération:', error);
    res.status(500).json({ message: 'Erreur lors de la génération.' });
  }
};

module.exports = { getMealPlan, createMeal, updateMeal, deleteMeal, generateGroceryList };
