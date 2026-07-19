/**
 * Contrôleur des factures - PostgreSQL
 */
const { pool } = require('../config/database');

const getBills = async (req, res) => {
  try {
    const familyId = req.user.family_id;
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let params = [familyId];
    let conditions = 'WHERE b.family_id = ?';
    let paramIdx = 1;

    if (status === 'active') { conditions += ' AND b.is_active = TRUE'; }
    else if (status === 'suspended') { conditions += ' AND b.is_active = FALSE'; }

    if (category) { params.push(category); conditions += ` AND b.category_id = ?`; }
    if (search) {
      const s = `%${search}%`;
      params.push(s, s, s);
      conditions += ` AND (b.name ILIKE ? OR b.organism ILIKE ? OR b.holder ILIKE ?)`;
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM bills b ${conditions}`, params
    );

    const queryParams = [...params, parseInt(limit), parseInt(offset)];
    const [bills] = await pool.query(
      `SELECT b.*, c.name as category_name, c.color as category_color,
              u.first_name as creator_first_name, u.last_name as creator_last_name
       FROM bills b LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN users u ON b.created_by = u.id
       ${conditions} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      queryParams
    );

    res.json({
      bills,
      pagination: { total: parseInt(countResult[0].total), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(countResult[0].total / limit) },
    });
  } catch (error) {
    console.error('Erreur factures:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const getBill = async (req, res) => {
  try {
    const [bills] = await pool.query(
      `SELECT b.*, c.name as category_name, c.color as category_color
       FROM bills b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ? AND b.family_id = ?`, [req.params.id, req.user.family_id]
    );
    if (bills.length === 0) return res.status(404).json({ message: 'Introuvable.' });

    const [payments] = await pool.query(
      'SELECT * FROM bill_payments WHERE bill_id = ? ORDER BY due_date DESC', [req.params.id]
    );
    res.json({ bill: bills[0], payments });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const createBill = async (req, res) => {
  try {
    const { name, categoryId, organism, holder, clientNumber, amount, frequency,
      customDays, startDate, endDate, notify30=true, notify15=true, notify7=true,
      notify3=true, notify1=true, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO bills (family_id, created_by, name, category_id, organism, holder,
       client_number, amount, frequency, custom_days, start_date, end_date,
       notify_30, notify_15, notify_7, notify_3, notify_1, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [req.user.family_id, req.user.id, name, categoryId || null, organism || null,
       holder || null, clientNumber || null, amount, frequency, customDays || null,
       startDate, endDate || null, notify30, notify15, notify7, notify3, notify1, notes || null]
    );

    await generatePayments(result[0].id, req.user.family_id, { amount, frequency, customDays, startDate, endDate });
    res.status(201).json({ message: 'Facture créée.', id: result[0].id });
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const updateBill = async (req, res) => {
  try {
    const { name, categoryId, organism, holder, clientNumber, amount, frequency,
      customDays, startDate, endDate, notify30, notify15, notify7, notify3, notify1, notes } = req.body;

    const [existing] = await pool.query('SELECT id FROM bills WHERE id = ? AND family_id = ?',
      [req.params.id, req.user.family_id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Introuvable.' });

    await pool.query(
      `UPDATE bills SET name=?, category_id=?, organism=?, holder=?, client_number=?,
       amount=?, frequency=?, custom_days=?, start_date=?, end_date=?,
       notify_30=?, notify_15=?, notify_7=?, notify_3=?, notify_1=?, notes=? WHERE id=?`,
      [name, categoryId||null, organism||null, holder||null, clientNumber||null,
       amount, frequency, customDays||null, startDate, endDate||null,
       notify30, notify15, notify7, notify3, notify1, notes||null, req.params.id]
    );
    res.json({ message: 'Facture mise à jour.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const deleteBill = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM bills WHERE id = ? AND family_id = ? RETURNING id',
      [req.params.id, req.user.family_id]);
    if (result.length === 0) return res.status(404).json({ message: 'Introuvable.' });
    res.json({ message: 'Facture supprimée.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const toggleBill = async (req, res) => {
  try {
    const [bills] = await pool.query('SELECT is_active FROM bills WHERE id = ? AND family_id = ?',
      [req.params.id, req.user.family_id]);
    if (bills.length === 0) return res.status(404).json({ message: 'Introuvable.' });

    const newStatus = !bills[0].is_active;
    await pool.query('UPDATE bills SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ message: newStatus ? 'Réactivée.' : 'Suspendue.', isActive: newStatus });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const payBill = async (req, res) => {
  try {
    const { paymentId, paidDate, amount, notes } = req.body;
    if (paymentId) {
      await pool.query(`UPDATE bill_payments SET paid_date=?, amount=?, status='paid', notes=? WHERE id=?`,
        [paidDate, amount, notes||null, paymentId]);
    } else {
      await pool.query(
        `INSERT INTO bill_payments (bill_id, family_id, due_date, paid_date, amount, status, notes)
         VALUES (?, ?, ?, ?, ?, 'paid', ?)`,
        [req.params.id, req.user.family_id, paidDate, paidDate, amount, notes||null]
      );
    }
    res.json({ message: 'Paiement enregistré.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

const generatePayments = async (billId, familyId, { amount, frequency, customDays, startDate, endDate }) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 365*24*60*60*1000);
  let current = new Date(start);
  let count = 0;

  while (current <= end && count < 52) {
    await pool.query(
      `INSERT INTO bill_payments (bill_id, family_id, due_date, amount, status) VALUES (?, ?, ?, ?, 'pending')`,
      [billId, familyId, current.toISOString().split('T')[0], amount]
    );
    count++;

    if (frequency === 'monthly') current.setMonth(current.getMonth() + 1);
    else if (frequency === 'bimonthly') current.setMonth(current.getMonth() + 2);
    else if (frequency === 'quarterly') current.setMonth(current.getMonth() + 3);
    else if (frequency === 'semiannual') current.setMonth(current.getMonth() + 6);
    else if (frequency === 'annual') current.setFullYear(current.getFullYear() + 1);
    else if (frequency === 'weekly') current.setDate(current.getDate() + 7);
    else if (frequency === 'biweekly') current.setDate(current.getDate() + 14);
    else current.setDate(current.getDate() + (customDays || 30));
  }
};

module.exports = { getBills, getBill, createBill, updateBill, deleteBill, toggleBill, payBill };
