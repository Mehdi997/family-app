const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getSettings);
router.put('/', ctrl.updateSettings);
router.post('/test-email', ctrl.testEmail);
router.post('/categories', ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

module.exports = router;