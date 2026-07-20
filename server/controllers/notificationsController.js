const { pool } = require('../config/database');
const { sendEmail } = require('../utils/email');

const getNotifications = async (req, res) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = 'WHERE family_id = ?';
    const params = [req.user.family_id];
    if (unreadOnly === 'true') { conditions += ' AND is_read = FALSE'; }
    const [notifications] = await pool.query(
      `SELECT * FROM notifications ${conditions} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [unread] = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE family_id = ? AND is_read = FALSE', [req.user.family_id]);
    res.json({ notifications, unreadCount: parseInt(unread[0].count) });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const markAsRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    res.json({ message: 'Lu.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE family_id = ?', [req.user.family_id]);
    res.json({ message: 'Toutes lues.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const deleteNotification = async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    res.json({ message: 'Supprimée.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const notifyFamilyMembers = async (familyId, subject, message) => {
  try {
    const [members] = await pool.query("SELECT email FROM users WHERE family_id = ? AND is_active = TRUE AND role IN ('chef', 'conjoint')", [familyId]);
    for (const m of members) {
      if (m.email) {
        await sendEmail({
          to: m.email, subject, text: message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px; margin: 0 auto;">
              <h3 style="color: #4f46e5;">🔔 Notification FamilyApp</h3>
              <p style="font-size: 16px; color: #1e293b;"><strong>${subject}</strong></p>
              <p style="color: #475569; font-size: 14px;">${message}</p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">Assistant financier FamilyApp.</p>
            </div>
          `
        });
      }
    }
  } catch (err) { console.error('Erreur email notif:', err.message); }
};

const generateMonthlyIncomes = async () => {
  try {
    const [monthlyIncomes] = await pool.query(`SELECT * FROM incomes WHERE frequency = 'monthly'`);
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (const inc of monthlyIncomes) {
      if (!inc.date) continue;
      const incDate = new Date(inc.date);
      const targetDay = Math.min(incDate.getDate(), lastDayOfMonth);

      if (currentDay === targetDay) {
        const [existing] = await pool.query(
          `SELECT id FROM incomes WHERE family_id = ? AND user_id = ? AND label = ? AND amount = ? 
           AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?`,
          [inc.family_id, inc.user_id, inc.label, inc.amount, currentMonth, currentYear]
        );

        if (existing.length === 0) {
          const newDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
          await pool.query(
            `INSERT INTO incomes (family_id, user_id, type, label, amount, frequency, date, notes)
             VALUES (?, ?, ?, ?, ?, 'monthly', ?, 'Généré automatiquement')`,
            [inc.family_id, inc.user_id, inc.type || 'salary', inc.label, inc.amount, newDateStr]
          );

          const title = `💰 Salaire reçu : ${inc.label}`;
          const msg = `Le revenu mensuel "${inc.label}" (${inc.amount} DA) a été ajouté automatiquement pour ce mois.`;
          await pool.query(`INSERT INTO notifications (family_id, type, title, message, reference_type, reference_id) VALUES (?, 'salary_auto', ?, ?, 'income', 0)`, [inc.family_id, title, msg]);
          await notifyFamilyMembers(inc.family_id, title, msg);
          console.log(`✅ Salaire mensuel généré : ${inc.label} pour famille ${inc.family_id}`);
        }
      }
    }
  } catch (err) { console.error('❌ Erreur génération salaires:', err); }
};

const generateNotifications = async () => {
  try {
    const dayOffsets = [30, 15, 7, 3, 1];
    for (const days of dayOffsets) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      const [dueBills] = await pool.query(
        `SELECT bp.*, b.name, b.family_id FROM bill_payments bp JOIN bills b ON bp.bill_id = b.id
         WHERE bp.due_date = ? AND bp.status = 'pending' AND b.is_active = TRUE AND b.notify_${days} = TRUE`, [dateStr]
      );

      for (const bill of dueBills) {
        const [existing] = await pool.query(
          `SELECT id FROM notifications WHERE reference_type = 'bill_payment' AND reference_id = ? AND type = 'bill_due' AND DATE(created_at) = CURRENT_DATE`, [bill.id]
        );
        if (existing.length === 0) {
          const title = `Facture due : ${bill.name}`;
          const msg = `La facture "${bill.name}" est due dans ${days} jour(s) - ${bill.amount} DA`;
          await pool.query(`INSERT INTO notifications (family_id, type, title, message, reference_type, reference_id) VALUES (?, 'bill_due', ?, ?, 'bill_payment', ?)`, [bill.family_id, title, msg, bill.id]);
          await notifyFamilyMembers(bill.family_id, `⚠️ Rappel : ${title}`, msg);
        }
      }
    }
    await pool.query(`UPDATE bill_payments SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status = 'pending' AND bill_id IN (SELECT id FROM bills WHERE is_active = TRUE)`);
    await generateMonthlyIncomes();
    console.log('✅ Notifications et salaires mensuels générés');
  } catch (error) { console.error('❌ Erreur notifications:', error); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, generateNotifications };