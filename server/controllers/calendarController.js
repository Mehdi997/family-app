/**
 * Contrôleur du calendrier - PostgreSQL
 */
const { pool } = require('../config/database');

const getCalendarEvents = async (req, res) => {
  try {
    const familyId = req.user.family_id;
    const { month, year, startDate, endDate } = req.query;

    let start, end;
    if (startDate && endDate) { start = startDate; end = endDate; }
    else {
      const m = parseInt(month) || (new Date().getMonth() + 1);
      const y = parseInt(year) || new Date().getFullYear();
      start = `${y}-${String(m).padStart(2, '0')}-01`;
      end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
    }

    const events = [];

    const [bills] = await pool.query(
      `SELECT bp.id, bp.due_date as date, bp.amount, bp.status, b.name as title, 'bill' as type
       FROM bill_payments bp JOIN bills b ON bp.bill_id = b.id
       WHERE bp.family_id = ? AND bp.due_date BETWEEN ? AND ? ORDER BY bp.due_date`,
      [familyId, start, end]
    );
    events.push(...bills);

    const [insurance] = await pool.query(
      `SELECT vi.id, vi.end_date as date, vi.annual_amount as amount,
              v.brand || ' ' || v.model || ' - Assurance' as title, 'insurance' as type
       FROM vehicle_insurance vi JOIN vehicles v ON vi.vehicle_id = v.id
       WHERE v.family_id = ? AND (vi.start_date BETWEEN ? AND ? OR vi.end_date BETWEEN ? AND ?)`,
      [familyId, start, end, start, end]
    );
    events.push(...insurance);

    const [groceries] = await pool.query(
      `SELECT id, date, budget as amount, name as title, 'grocery' as type
       FROM grocery_lists WHERE family_id = ? AND date BETWEEN ? AND ?`,
      [familyId, start, end]
    );
    events.push(...groceries);

    const [meals] = await pool.query(
      `SELECT id, date, name as title, meal_type, 'meal' as type
       FROM meal_plans WHERE family_id = ? AND date BETWEEN ? AND ?`,
      [familyId, start, end]
    );
    events.push(...meals);

    const [rent] = await pool.query(
      `SELECT id, due_date as date, amount, label as title, 'rent' as type
       FROM rent WHERE family_id = ? AND due_date BETWEEN ? AND ?`,
      [familyId, start, end]
    );
    events.push(...rent);

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ events });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getCalendarEvents };
