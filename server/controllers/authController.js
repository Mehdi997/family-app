/**
 * Contrôleur d'authentification
 * Compatible PostgreSQL (Supabase)
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, familyId: user.family_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

const generateFamilyCode = () => 'FAM-' + uuidv4().slice(0, 8).toUpperCase();

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const client = await pool.getConnection();
  try {
    const { firstName, lastName, email, password, phone, familyName } = req.body;

    const [existing] = await client.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    await client.beginTransaction();

    // Créer la famille
    const familyCode = generateFamilyCode();
    const [familyResult] = await client.query(
      'INSERT INTO families (name, code) VALUES (?, ?) RETURNING id',
      [familyName, familyCode]
    );
    const familyId = familyResult[0].id;

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur (chef de famille)
    const [userResult] = await client.query(
      `INSERT INTO users (family_id, first_name, last_name, email, password, phone, role)
       VALUES (?, ?, ?, ?, ?, ?, 'chef') RETURNING id`,
      [familyId, firstName, lastName, email, hashedPassword, phone || null]
    );
    const userId = userResult[0].id;

    // Paramètres par défaut
    await client.query('INSERT INTO settings (family_id) VALUES (?)', [familyId]);

    // Copier les catégories par défaut
    await client.query(
      `INSERT INTO categories (family_id, name, type, icon, color, is_default)
       SELECT ?, name, type, icon, color, TRUE FROM categories WHERE family_id IS NULL`,
      [familyId]
    );

    // Factures algériennes préconfigurées
    await createAlgerianBills(client, familyId, userId);

    // Enveloppes d'économies par défaut
    await createDefaultSavings(client, familyId);

    await client.commit();

    const token = generateToken({ id: userId, email, family_id: familyId });

    res.status(201).json({
      message: 'Compte créé avec succès !',
      token,
      user: { id: userId, firstName, lastName, email, role: 'chef', familyId, familyCode, familyName },
    });
  } catch (error) {
    await client.rollback();
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
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
    await client.query(
      'INSERT INTO savings (family_id, name, icon, color, target_amount) VALUES (?, ?, ?, ?, 0)',
      [familyId, env.name, env.icon, env.color]
    );
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      `SELECT u.*, f.name as family_name, f.code as family_code
       FROM users u LEFT JOIN families f ON u.family_id = f.id
       WHERE u.email = ?`,
      [email]
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
    console.error('Erreur connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};

/** GET /api/auth/me */
const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.role, u.created_at,
              f.id as family_id, f.name as family_name, f.code as family_code
       FROM users u LEFT JOIN families f ON u.family_id = f.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const user = users[0];
    let members = [];
    if (user.family_id) {
      const [m] = await pool.query(
        'SELECT id, first_name, last_name, email, phone, avatar, role FROM users WHERE family_id = ? AND id != ?',
        [user.family_id, user.id]
      );
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
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil.' });
  }
};

/** PUT /api/auth/profile */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    if (avatar) {
      await pool.query('UPDATE users SET first_name = ?, last_name = ?, phone = ?, avatar = ? WHERE id = ?',
        [firstName, lastName, phone || null, avatar, req.user.id]);
    } else {
      await pool.query('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
        [firstName, lastName, phone || null, req.user.id]);
    }
    res.json({ message: 'Profil mis à jour.', avatar });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** PUT /api/auth/password */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValid) return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Mot de passe modifié.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** POST /api/auth/forgot-password */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });

    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, expires, users[0].id]);

    res.json({
      message: 'Si cet email existe, un lien a été envoyé.',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** POST /api/auth/reset-password */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const [users] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]);
    if (users.length === 0) return res.status(400).json({ message: 'Token invalide ou expiré.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashed, users[0].id]);
    res.json({ message: 'Mot de passe réinitialisé.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** POST /api/auth/invite */
const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND family_id = ?',
      [email, req.user.family_id]);
    if (existing.length > 0) return res.status(409).json({ message: 'Déjà membre.' });

    const token = uuidv4();
    const expires = new Date(Date.now() + 7 * 24 * 3600000);
    await pool.query(
      'INSERT INTO invitations (family_id, invited_by, email, token, role, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.family_id, req.user.id, email, token, role || 'autre', expires]
    );
    res.status(201).json({ message: 'Invitation envoyée.', inviteToken: token });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

/** POST /api/auth/join */
const joinFamily = async (req, res) => {
  try {
    const { inviteToken } = req.body;
    const [invitations] = await pool.query(
      `SELECT i.*, f.name as family_name FROM invitations i
       JOIN families f ON i.family_id = f.id
       WHERE i.token = ? AND i.status = 'pending' AND i.expires_at > NOW()`,
      [inviteToken]
    );
    if (invitations.length === 0) return res.status(400).json({ message: 'Invitation invalide.' });

    const inv = invitations[0];
    await pool.query('UPDATE users SET family_id = ?, role = ? WHERE id = ?',
      [inv.family_id, inv.role, req.user.id]);
    await pool.query("UPDATE invitations SET status = 'accepted' WHERE id = ?", [inv.id]);

    res.json({ message: `Famille ${inv.family_name} rejointe !`, familyId: inv.family_id, familyName: inv.family_name });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur.' });
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, inviteMember, joinFamily };
