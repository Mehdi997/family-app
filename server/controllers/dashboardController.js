/**
 * Contrôleur du tableau de bord - PostgreSQL (Supabase)
 */
const { pool } = require('../config/database');

const getDashboard = async (req, res) => {
  try {
    const familyId = req.user.family_id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Dépenses du mois
    const [monthlyExp] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE family_id = ? AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?`,
      [familyId, currentMonth, currentYear]
    );

    const [monthlyBillPay] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM bill_payments
       WHERE family_id = ? AND EXTRACT(MONTH FROM COALESCE(paid_date, due_date)) = ?
       AND EXTRACT(YEAR FROM COALESCE(paid_date, due_date)) = ? AND status = 'paid'`,
      [familyId, currentMonth, currentYear]
    );

    // Dépenses de l'année
    const [yearlyExp] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE family_id = ? AND EXTRACT(YEAR FROM date) = ?`,
      [familyId, currentYear]
    );

    const [yearlyBillPay] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM bill_payments
       WHERE family_id = ? AND EXTRACT(YEAR FROM COALESCE(paid_date, due_date)) = ? AND status = 'paid'`,
      [familyId, currentYear]
    );

    // Revenus
    const [monthlyInc] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM incomes
       WHERE family_id = ? AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?`,
      [familyId, currentMonth, currentYear]
    );

    const [yearlyInc] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM incomes
       WHERE family_id = ? AND EXTRACT(YEAR FROM date) = ?`,
      [familyId, currentYear]
    );

    // Économies
    const [totalSav] = await pool.query(
      `SELECT COALESCE(SUM(current_amount), 0) as total, COALESCE(SUM(target_amount), 0) as target
       FROM savings WHERE family_id = ?`,
      [familyId]
    );

    // Prochaines factures
    const [upcomingBills] = await pool.query(
      `SELECT bp.*, b.name, b.organism FROM bill_payments bp
       JOIN bills b ON bp.bill_id = b.id
       WHERE bp.family_id = ? AND bp.status = 'pending' AND bp.due_date >= CURRENT_DATE
       ORDER BY bp.due_date ASC LIMIT 5`,
      [familyId]
    );

    // Factures en retard
    const [overdueBills] = await pool.query(
      `SELECT bp.*, b.name, b.organism FROM bill_payments bp
       JOIN bills b ON bp.bill_id = b.id
       WHERE bp.family_id = ? AND bp.status IN ('pending', 'overdue') AND bp.due_date < CURRENT_DATE
       ORDER BY bp.due_date ASC`,
      [familyId]
    );

    // Assurances
    const [upcomingInsurance] = await pool.query(
      `SELECT vi.*, v.brand, v.model, v.plate FROM vehicle_insurance vi
       JOIN vehicles v ON vi.vehicle_id = v.id
       WHERE v.family_id = ? AND vi.end_date >= CURRENT_DATE
       ORDER BY vi.end_date ASC LIMIT 5`,
      [familyId]
    );

    // Véhicules + vidanges
    const [vehiclesData] = await pool.query(
      `SELECT v.*,
        (SELECT oc.mileage FROM oil_changes oc WHERE oc.vehicle_id = v.id ORDER BY oc.date DESC LIMIT 1) as last_oil_mileage,
        (SELECT oc.date FROM oil_changes oc WHERE oc.vehicle_id = v.id ORDER BY oc.date DESC LIMIT 1) as last_oil_date
       FROM vehicles v WHERE v.family_id = ?`,
      [familyId]
    );

    const upcomingOilChanges = vehiclesData.map(v => {
      const lastMileage = v.last_oil_mileage || 0;
      const nextMileage = lastMileage + v.oil_change_interval;
      const remaining = nextMileage - v.current_mileage;
      return {
        vehicleId: v.id, brand: v.brand, model: v.model, plate: v.plate,
        currentMileage: v.current_mileage, nextOilChangeMileage: nextMileage,
        remainingKm: remaining, lastOilDate: v.last_oil_date, urgent: remaining <= 1000,
      };
    }).filter(v => v.remainingKm <= 2000);

    // Dépenses par catégorie
    const [expensesByCategory] = await pool.query(
      `SELECT c.name, c.color, COALESCE(SUM(e.amount), 0) as total
       FROM expenses e LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.family_id = ? AND EXTRACT(MONTH FROM e.date) = ? AND EXTRACT(YEAR FROM e.date) = ?
       GROUP BY c.id, c.name, c.color ORDER BY total DESC`,
      [familyId, currentMonth, currentYear]
    );

    // Évolution mensuelle
    const [monthlyEvolution] = await pool.query(
      `SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total
       FROM expenses WHERE family_id = ? AND date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month ASC`,
      [familyId]
    );

    const [monthlyIncomeEvolution] = await pool.query(
      `SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(amount) as total
       FROM incomes WHERE family_id = ? AND date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month ASC`,
      [familyId]
    );

    // Enveloppes
    const [savingsEnvelopes] = await pool.query(
      'SELECT * FROM savings WHERE family_id = ? ORDER BY name', [familyId]
    );

    // Courses
    const [upcomingGroceries] = await pool.query(
      `SELECT * FROM grocery_lists WHERE family_id = ? AND is_completed = FALSE
       ORDER BY date ASC LIMIT 3`, [familyId]
    );

    const totalMonthlyExpenses = parseFloat(monthlyExp[0].total) + parseFloat(monthlyBillPay[0].total);
    const totalYearlyExpenses = parseFloat(yearlyExp[0].total) + parseFloat(yearlyBillPay[0].total);
    const monthlyIncomeTotal = parseFloat(monthlyInc[0].total);

    res.json({
      summary: {
        monthlyExpenses: totalMonthlyExpenses,
        yearlyExpenses: totalYearlyExpenses,
        monthlyIncome: monthlyIncomeTotal,
        yearlyIncome: parseFloat(yearlyInc[0].total),
        totalSavings: parseFloat(totalSav[0].total),
        targetSavings: parseFloat(totalSav[0].target),
        available: monthlyIncomeTotal - totalMonthlyExpenses,
      },
      upcomingBills, overdueBills, upcomingInsurance, upcomingOilChanges,
      expensesByCategory, monthlyEvolution, monthlyIncomeEvolution,
      savingsEnvelopes, upcomingGroceries,
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ message: 'Erreur lors du chargement du tableau de bord.' });
  }
};

module.exports = { getDashboard };
