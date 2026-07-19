const router = require('express').Router();
const ctrl = require('../controllers/incomesController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getIncomes);
router.post('/', ctrl.createIncome);
router.put('/:id', ctrl.updateIncome);
router.delete('/:id', ctrl.deleteIncome);

module.exports = router;
