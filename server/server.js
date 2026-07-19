/**
 * ╔══════════════════════════════════════════════════╗
 * ║  FamilyApp - Serveur Express.js                  ║
 * ║  Application de gestion familiale algérienne     ║
 * ╚══════════════════════════════════════════════════╝
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { generateNotifications } = require('./controllers/notificationsController');

const app = express();

// ─── Rate Limiting (protection brute force) ─────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes.' },
});

// ─── Middlewares globaux ────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Fichiers statiques (uploads) ───────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Appliquer les limiteurs ─────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Routes API ─────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/incomes', require('./routes/incomes'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/groceries', require('./routes/groceries'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/settings', require('./routes/settings'));

// ─── Route de santé ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Gestion des erreurs ────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Fichier trop volumineux.' });
  }

  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── 404 ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// ─── Cron : Notifications automatiques (chaque jour à 8h) ──
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Génération des notifications...');
  generateNotifications();
});

// ─── Démarrage ──────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📡 API : http://localhost:${PORT}/api`);
    console.log(`🏥 Santé : http://localhost:${PORT}/api/health\n`);
  });
};

start();

module.exports = app;
