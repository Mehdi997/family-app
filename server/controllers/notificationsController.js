/**
 * Contrôleur des notifications - PostgreSQL
 */
const { pool } = require('../config/database');

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

    const [unread] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE family_id = ? AND is_read = FALSE',
      [req.user.family_id]
    );

    res.json({ notifications, unreadCount: parseInt(unread[0].count) });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const markAsRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    res.json({ message: 'Lu.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE family_id = ?', [req.user.family_id]);
    res.json({ message: 'Toutes lues.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const deleteNotification = async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ? AND family_id = ?', [req.params.id, req.user.family_id]);
    res.json({ message: 'Supprimée.' });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Erreur.' }); }
};

const generateNotifications = async () => {
  try {
    const dayOffsets = [30, 15, 7, 3, 1];
    for (const days of dayOffsets) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      const [dueBills] = await pool.query(
        `SELECT bp.*, b.name, b.family_id FROM bill_payments bp
         JOIN bills b ON bp.bill_id = b.id
         WHERE bp.due_date = ? AND bp.status = 'pending' AND b.is_active = TRUE AND b.notify_${days} = TRUE`,
        [dateStr]
      );

      for (const bill of dueBills) {
        const [existing] = await pool.query(
          `SELECT id FROM notifications WHERE reference_type = 'bill_payment' AND reference_id = ?
           AND type = 'bill_due' AND DATE(created_at) = CURRENT_DATE`, [bill.id]
        );
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO notifications (family_id, type, title, message, reference_type, reference_id)
             VALUES (?, 'bill_due', ?, ?, 'bill_payment', ?)`,
            [bill.family_id, `Facture ${bill.name}`,
             `La facture "${bill.name}" est due dans ${days} jour(s) - ${bill.amount} DA`, bill.id]
          );
        }
      }
    }

    // Factures en retard
    await pool.query(
      `UPDATE bill_payments SET status = 'overdue'
       WHERE due_date < CURRENT_DATE AND status = 'pending'
       AND bill_id IN (SELECT id FROM bills WHERE is_active = TRUE)`
    );

    console.log('✅ Notifications générées');
  } catch (error) {
    console.error('❌ Erreur notifications:', error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, generateNotifications };
