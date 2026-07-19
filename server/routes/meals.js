const router = require('express').Router();
const ctrl = require('../controllers/mealsController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getMealPlan);
router.post('/', ctrl.createMeal);
router.put('/:id', ctrl.updateMeal);
router.delete('/:id', ctrl.deleteMeal);
router.post('/generate-grocery', ctrl.generateGroceryList);

module.exports = router;
