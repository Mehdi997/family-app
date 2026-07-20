const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID: uuidv4 } = require('crypto');
const { pool } = require('../config/database');
const { sendEmail } = require('../utils/email');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, familyId: user.family_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

const generateFamilyCode = () => 'FAM-' + uuidv4().slice(0, 8).toUpperCase();

const register = async (req, res) => {
  let client;
  try {
    client = await pool.getConnection();
    const { firstName, lastName, email, password, phone, familyName, familyCode: inputCode } = req.body;

    const [existing] = await client.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      if (client.release) client.release();
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    await client.beginTransaction();

    let familyId;
    let familyCodeStr;
    let familyNameStr = familyName;
    let role = 'chef';
    let isJoining = false;

    if (inputCode && inputCode.trim() !== '') {
      const codeClean = inputCode.trim().toUpperCase();
      const [existingFamily] = await client.query('SELECT id, code, name FROM families WHERE code = ?', [codeClean]);
      if (existingFamily.length > 0) {
        familyId = existingFamily[0].id;
        familyCodeStr = existingFamily[0].code;
        familyNameStr = existingFamily[0].name;
        role = 'conjoint';
        isJoining = true;
      } else {
        const [inv] = await client.query(
          `SELECT i.family_id, i.role, f.code, f.name FROM invitations i 
           JOIN families f ON i.family_id = f.id WHERE i.token = ? AND i.status = 'pending'`,
          [inputCode.trim()]
        );
        if (inv.length > 0) {
          familyId = inv[0].family_id;
          role = inv[0].role;
          familyCodeStr = inv[0].code;
          familyNameStr = inv[0].name;
          isJoining = true;
          await client.query("UPDATE invitations SET status = 'accepted' WHERE token = ?", [inputCode.trim()]);
        } else {
          if (client.release) client.release();
          return res.status(404).json({ message: "Le Code Famille ou Token d'invitation est invalide ou inexistant." });
        }
      }
    }

    if (!familyId) {
      const familyCode = generateFamilyCode();
      const [familyResult] = await client.query(
        'INSERT INTO families (name, code) VALUES (?, ?) RETURNING id',
        [familyName || 'Famille ' + lastName, familyCode]
      );
      familyId = familyResult[0].id;
      familyCodeStr = familyCode;
      familyNameStr = familyName || 'Famille ' + lastName;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [userResult] = await client.query(
      `INSERT INTO users (family_id, first_name, last_name, email, password, phone, role)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [familyId, firstName, lastName, email, hashedPassword, phone || null, role]
    );
    const userId = userResult[0].id;

    if (!isJoining) {
      await client.query('INSERT INTO settings (family_id) VALUES (?)', [familyId]);
      await client.query(
        `INSERT INTO categories (family_id, name, type, icon, color, is_default)
         SELECT ?, name, type, icon, color, TRUE FROM categories WHERE family_id IS NULL`,
        [familyId]
      );
      await createAlgerianBills(client, familyId, userId);
      await createDefaultSavings(client, familyId);
    }

    await client.commit();
    if (client.release) client.release();

    const token = generateToken({ id: userId, email, family_id: familyId });
    res.status(201).json({
      message: isJoining ? `Vous avez rejoint le foyer ${familyNameStr} !` : 'Compte créé avec succès !',
      token,
      user: { id: userId, firstName, lastName, email, role, familyId, familyCode: familyCodeStr, familyName: familyNameStr },
    });
  } catch (error) {
    if (client) {
      try { await client.rollback(); } catch (e) {}
      if (client.release) client.release();
    }
    console.error('Erreur inscription:', error);
    let customMsg = `Erreur lors de l'inscription : ${error.message}`;
    if (error.code === '42P01') {
      customMsg = "❌ Erreur SQL : Les tables n'ont pas encore été créées sur Supabase via schema-supabase.sql.";
    } else if (error.code === '28P01' || error.message?.includes('password authentication failed')) {
      customMsg = "❌ Erreur de mot de passe Supabase dans DATABASE_URL.";
    }
    res.status(500).json({ message: customMsg, errorDetail: error.message, errorCode: error.code });
  }
};

const createAlgerianBills = async (client, familyId, userId) => {
  const bills = [
    { name: 'Sonelgaz - Électricité & Gaz', organism: 'Sonelgaz', frequency: 'quarterly' },
    { name: 'SEAAL - Eau', organism: 'SEAAL', frequency: 'quarterly' },
    { name: 'Algérie Télécom - Internet Fibre', organism: 'Algérie Télécom', frequency: 'monthly' },
    { name: 'Algérie Télécom - Téléphone fixe', organism: 'Algérie Télécom', frequency: 'monthly' },
    { name: 'Djezzy - Mobile', organism: 'Djezzy', frequency: 'monthly' },
    { name: 'Mobilis - Mobile', organism: 'Mobilis', frequency: 'monthly' },
    { name: 'Ooredoo - Mobile', organism: 'Ooredoo', frequency: 'monthly' },
  ];
  const today = new Date().toISOString().split('T')[0];
  for (const bill of bills) {
    await client.query(
      `INSERT INTO bills (family_id, created_by, name, organism, amount, frequency, start_date, is_active)
       VALUES (?, ?, ?, ?, 0, ?, ?, FALSE)`,
      [familyId, userId, bill.name, bill.organism, bill.frequency, today]
    );
  }
};

const createDefaultSavings = async (client, familyId) => {
  const envelopes = [
    { name: 'Vacances', icon: 'BeachAccess', color: '#FF9800' },
    { name: 'Santé', icon: 'Healing', color: '#F44336' },
    { name: 'Maison', icon: 'Home', color: '#795548' },
    { name: 'Voiture', icon: 'DirectionsCar', color: '#2196F3' },
    { name: 'Urgence', icon: 'Warning', color: '#FF5722' },
    { name: 'Divers', icon: 'Savings', color: '#9E9E9E' },
  ];
  for (const env of envelopes) {
    await client.query('INSERT INTO savings (family_id, name, icon, color, target_amount) VALUES (?, ?, ?, ?, 0)', [familyId, env.name, env.icon, env.color]);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query(
      `SELECT u.*, f.name as family_name, f.code as family_code
       FROM users u LEFT JOIN families f ON u.family_id = f.id WHERE u.email = ?`, [email]
    );
    if (users.length === 0) return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    const user = users[0];
    if (!user.is_active) return res.status(403).json({ message: 'Votre compte est désactivé.' });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    const token = generateToken(user);
    res.json({
      message: 'Connexion réussie !',
      token,
      user: {
        id: user.id, firstName: user.first_name, lastName: user.last_name,
        email: user.email, phone: user.phone, avatar: user.avatar, role: user.role,
        familyId: user.family_id, familyCode: user.family_code, familyName: user.family_name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erreur lors de la connexion.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.role, u.created_at,
              f.id as family_id, f.name as family_name, f.code as family_code
       FROM users u LEFT JOIN families f ON u.family_id = f.id WHERE u.id = ?`, [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    const user = users[0];
    let members = [];
    if (user.family_id) {
      const [m] = await pool.query('SELECT id, first_name, last_name, email, phone, avatar, role FROM users WHERE family_id = ? AND id != ?', [user.family_id, user.id]);
      members = m;
    }
    res.json({
      user: {
        id: user.id, firstName: user.first_name, lastName: user.last_name,
        email: user.email, phone: user.phone, avatar: user.avatar, role: user.role,
        createdAt: user.created_at, familyId: user.family_id, familyName: user.family_name, familyCode: user.family_code,
      },
      members,
    });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;
    if (avatar) {
      await pool.query('UPDATE users SET first_name = ?, last_name = ?, phone = ?, avatar = ? WHERE id = ?', [firstName, lastName, phone || null, avatar, req.user.id]);
    } else {
      await pool.query('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?', [firstName, lastName, phone || null, req.user.id]);
    }
    res.json({ message: 'Profil mis à jour.', avatar });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Mot de passe modifié.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [resetToken, expires, users[0].id]);
    res.json({ message: 'Si cet email existe, un lien a été envoyé.', ...(process.env.NODE_ENV === 'development' && { resetToken }) });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const [users] = await pool.query('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]);
    if (users.length === 0) return res.status(400).json({ message: 'Token invalide ou expiré.' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashed, users[0].id]);
    res.json({ message: 'Mot de passe réinitialisé.' });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND family_id = ?', [email, req.user.family_id]);
    if (existing.length > 0) return res.status(409).json({ message: 'Déjà membre.' });

    const token = uuidv4();
    const expires = new Date(Date.now() + 7 * 24 * 3600000);
    await pool.query(
      'INSERT INTO invitations (family_id, invited_by, email, token, role, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.family_id, req.user.id, email, token, role || 'conjoint', expires]
    );

    const [familyData] = await pool.query('SELECT name, code FROM families WHERE id = ?', [req.user.family_id]);
    const familyName = familyData[0]?.name || 'Famille';
    const familyCode = familyData[0]?.code || '';

    await sendEmail({
      to: email,
      subject: `🎉 Vous êtes invité(e) à rejoindre le foyer ${familyName} sur FamilyApp`,
      text: `Bonjour !\n\nVous avez été invité(e) à rejoindre l'espace financier "${familyName}" en tant que ${role || 'conjoint'}.\n\nSaisissez le Code Famille ci-dessous lors de l'inscription sur FamilyApp :\n\nCode Famille : ${familyCode}\n\nÀ très vite !`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px; margin: 0 auto; background-color: #f8fafc;">
          <h2 style="color: #4f46e5; text-align: center;">🎉 Invitation FamilyApp</h2>
          <p style="font-size: 16px; color: #334155;">Vous êtes invité(e) à rejoindre le foyer <strong>${familyName}</strong> en tant que <strong>${role || 'conjoint'}</strong>.</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #4f46e5;">
            <span style="font-size: 14px; color: #64748b;">Code Famille à saisir lors de l'inscription :</span><br/>
            <strong style="font-size: 24px; color: #1e293b; letter-spacing: 2px;">${familyCode}</strong>
          </div>
          <p style="color: #64748b; font-size: 13px;">Vous aurez accès instantanément à l'ensemble du budget de la famille !</p>
        </div>
      `
    });

    res.status(201).json({ message: 'Invitation envoyée (et email expédié si Gmail configuré sur Vercel) !', inviteToken: token, familyCode });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

const joinFamily = async (req, res) => {
  try {
    const { inviteToken } = req.body;
    const [invitations] = await pool.query(
      `SELECT i.*, f.name as family_name FROM invitations i
       JOIN families f ON i.family_id = f.id WHERE i.token = ? AND i.status = 'pending' AND i.expires_at > NOW()`, [inviteToken]
    );
    if (invitations.length === 0) return res.status(400).json({ message: 'Invitation invalide.' });
    const inv = invitations[0];
    await pool.query('UPDATE users SET family_id = ?, role = ? WHERE id = ?', [inv.family_id, inv.role, req.user.id]);
    await pool.query("UPDATE invitations SET status = 'accepted' WHERE id = ?", [inv.id]);
    res.json({ message: `Famille ${inv.family_name} rejointe !`, familyId: inv.family_id, familyName: inv.family_name });
  } catch (error) { res.status(500).json({ message: 'Erreur.' }); }
};

module.exports = { register, login, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, inviteMember, joinFamily };