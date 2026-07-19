const router = require('express').Router();
const ctrl = require('../controllers/expensesController');
const { authenticate, hasFamily } = require('../middleware/auth');
const { uploadReceipt } = require('../middleware/upload');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getExpenses);
router.post('/', uploadReceipt.single('receipt'), ctrl.createExpense);
router.put('/:id', ctrl.updateExpense);
router.delete('/:id', ctrl.deleteExpense);

module.exports = router;
