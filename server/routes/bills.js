const router = require('express').Router();
const ctrl = require('../controllers/billsController');
const { authenticate, hasFamily } = require('../middleware/auth');
const { billRules, handleValidation } = require('../middleware/validate');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getBills);
router.get('/:id', ctrl.getBill);
router.post('/', billRules, handleValidation, ctrl.createBill);
router.put('/:id', ctrl.updateBill);
router.delete('/:id', ctrl.deleteBill);
router.put('/:id/toggle', ctrl.toggleBill);
router.post('/:id/pay', ctrl.payBill);

module.exports = router;
