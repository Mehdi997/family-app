const router = require('express').Router();
const ctrl = require('../controllers/notificationsController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getNotifications);
router.put('/:id/read', ctrl.markAsRead);
router.put('/read-all', ctrl.markAllAsRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
