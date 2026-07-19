const router = require('express').Router();
const ctrl = require('../controllers/savingsController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getSavings);
router.post('/', ctrl.createSaving);
router.put('/:id', ctrl.updateSaving);
router.delete('/:id', ctrl.deleteSaving);
router.post('/:id/transaction', ctrl.addTransaction);
router.get('/:id/transactions', ctrl.getTransactions);

module.exports = router;
