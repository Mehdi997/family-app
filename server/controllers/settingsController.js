const { pool } = require('../config/database');
const { sendEmail } = require('../utils/email');

const getSettings = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings WHERE family_id = ?', [req.user.family_id]);
    const [categories] = await pool.query('SELECT * FROM categories WHERE family_id = ? ORDER BY type, name', [req.user.family_id]);
    const [members] = await pool.query('SELECT id, first_name, last_name, email, phone, avatar, role FROM users WHERE family_id = ?', [req.user.family_id]);
    const [family] = await pool.query('SELECT * FROM families WHERE id = ?', [req.user.family_id]);
    res.json({ settings: settings[0] || {}, categories, members, family: family[0] });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const updateSettings = async (req, res) => {
  try {
    const { currency, language, theme, notificationsEnabled, weeklyBudget, monthlyBudget } = req.body;
    await pool.query(`UPDATE settings SET currency = ?, language = ?, theme = ?, notifications_enabled = ?, weekly_budget = ?, monthly_budget = ? WHERE family_id = ?`, [currency || 'DA', language || 'fr', theme || 'auto', notificationsEnabled !== false, weeklyBudget || null, monthlyBudget || null, req.user.family_id]);
    res.json({ message: 'Paramètres mis à jour.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const testEmail = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT email, first_name FROM users WHERE id = ?', [req.user.id]);
    const userEmail = users[0]?.email;
    if (!userEmail) return res.status(400).json({ message: 'Email introuvable.' });

    const success = await sendEmail({
      to: userEmail,
      subject: '🚀 Test réussi ! Vos notifications FamilyApp fonctionnent',
      text: `Bonjour ${users[0]?.first_name || ''} !\n\nFélicitations, la connexion entre votre serveur Vercel et Gmail est parfaitement configurée !\n\nVous recevrez désormais vos rappels automatiques d'échéances de factures et de salaires sur cette adresse email.\n\nÀ très vite sur FamilyApp !`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px; margin: 0 auto; background-color: #f8fafc;">
          <h2 style="color: #4f46e5; text-align: center;">🚀 Configuration Gmail réussie !</h2>
          <p style="font-size: 16px; color: #334155;">Bonjour <strong>${users[0]?.first_name || ''}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">Votre serveur Vercel est maintenant connecté en direct à votre compte Gmail.</p>
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #86efac;">
            <strong style="color: #166534; font-size: 16px;">✅ Envoi des alertes opérationnel</strong>
          </div>
          <p style="color: #64748b; font-size: 13px;">Vous recevrez automatiquement vos rappels de factures (à 7j, 3j, 1j) et vos alertes de salaires mensuels.</p>
        </div>
      `
    });

    if (success) {
      res.json({ message: `Email de test expédié avec succès à ${userEmail} ! Vérifiez votre boîte de réception (et les spams).` });
    } else {
      res.status(500).json({ message: "Échec de l'envoi. Vérifiez que GMAIL_USER et GMAIL_APP_PASSWORD sont bien configurés sur Vercel." });
    }
  } catch (error) { res.status(500).json({ message: 'Erreur lors du test email.' }); }
};

const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    const [result] = await pool.query('INSERT INTO categories (family_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?) RETURNING id', [req.user.family_id, name, type, icon || null, color || null]);
    res.status(201).json({ message: 'Catégorie créée.', id: result[0].id });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const updateCategory = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    await pool.query('UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ? AND family_id = ?', [name, icon, color, req.params.id, req.user.family_id]);
    res.json({ message: 'Catégorie mise à jour.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const deleteCategory = async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ? AND family_id = ? AND is_default = FALSE', [req.params.id, req.user.family_id]);
    res.json({ message: 'Catégorie supprimée.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { getSettings, updateSettings, testEmail, createCategory, updateCategory, deleteCategory };