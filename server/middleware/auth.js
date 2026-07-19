/**
 * Middleware d'authentification JWT
 * Vérifie le token et attache l'utilisateur à la requête
 */
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

/**
 * Vérifie que l'utilisateur est authentifié
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur
    const [users] = await pool.query(
      'SELECT id, family_id, first_name, last_name, email, phone, avatar, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    if (!users[0].is_active) {
      return res.status(403).json({ message: 'Compte désactivé.' });
    }

    // Attacher l'utilisateur à la requête
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.', expired: true });
    }
    return res.status(401).json({ message: 'Token invalide.' });
  }
};

/**
 * Vérifie que l'utilisateur est le chef de famille
 */
const isChef = (req, res, next) => {
  if (req.user.role !== 'chef') {
    return res.status(403).json({ message: 'Accès réservé au chef de famille.' });
  }
  next();
};

/**
 * Vérifie que l'utilisateur appartient à une famille
 */
const hasFamily = (req, res, next) => {
  if (!req.user.family_id) {
    return res.status(403).json({ message: 'Vous devez appartenir à une famille.' });
  }
  next();
};

module.exports = { authenticate, isChef, hasFamily };
