/**
 * Utilitaires de formatage
 */

/** Formate un montant en DA */
export const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '0 DA';
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' DA';
};

/** Formate une date */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

/** Formate une date courte */
export const formatShortDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

/** Traduit la fréquence */
export const translateFrequency = (freq) => {
  const map = {
    weekly: 'Hebdomadaire',
    biweekly: 'Bimensuelle',
    monthly: 'Mensuelle',
    bimonthly: 'Bimestrielle',
    quarterly: 'Trimestrielle',
    semiannual: 'Semestrielle',
    annual: 'Annuelle',
    custom: 'Personnalisée',
  };
  return map[freq] || freq;
};

/** Traduit le statut d'un paiement */
export const translateStatus = (status) => {
  const map = {
    paid: 'Payé',
    pending: 'En attente',
    overdue: 'En retard',
  };
  return map[status] || status;
};

/** Couleur du statut */
export const statusColor = (status) => {
  const map = {
    paid: 'success',
    pending: 'warning',
    overdue: 'error',
  };
  return map[status] || 'default';
};

/** Traduit le type de repas */
export const translateMealType = (type) => {
  const map = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack: 'Collation',
  };
  return map[type] || type;
};

/** Noms des mois */
export const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
