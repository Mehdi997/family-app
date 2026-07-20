/**
 * Middleware de validation des requêtes
 * Utilise express-validator
 */
const { body, validationResult } = require('express-validator');

/**
 * Vérifie les erreurs de validation et retourne les messages
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Erreur de validation',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Règles de validation : Authentification ───

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis.'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis.'),
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  body('familyName')
    .if((value, { req }) => !req.body.familyCode || req.body.familyCode.trim() === '')
    .trim().notEmpty().withMessage('Le nom de famille est requis si vous ne rejoignez pas avec un Code Famille.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis.'),
];

// ─── Règles de validation : Factures ───

const billRules = [
  body('name').trim().notEmpty().withMessage('Le nom de la facture est requis.'),
  body('amount').isFloat({ min: 0 }).withMessage('Le montant doit être positif.'),
  body('frequency').isIn(['weekly','biweekly','monthly','bimonthly','quarterly','semiannual','annual','custom'])
    .withMessage('Fréquence invalide.'),
  body('startDate').isISO8601().withMessage('Date de début invalide.'),
];

// ─── Règles de validation : Dépenses ───

const expenseRules = [
  body('label').trim().notEmpty().withMessage('Le libellé est requis.'),
  body('amount').isFloat({ min: 0 }).withMessage('Le montant doit être positif.'),
  body('date').isISO8601().withMessage('Date invalide.'),
];

// ─── Règles de validation : Revenus ───

const incomeRules = [
  body('label').trim().notEmpty().withMessage('Le libellé est requis.'),
  body('amount').isFloat({ min: 0 }).withMessage('Le montant doit être positif.'),
  body('date').isISO8601().withMessage('Date invalide.'),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  billRules,
  expenseRules,
  incomeRules,
};
