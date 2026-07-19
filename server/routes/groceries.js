const router = require('express').Router();
const ctrl = require('../controllers/groceriesController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getLists);
router.get('/:id', ctrl.getList);
router.post('/', ctrl.createList);
router.post('/:id/items', ctrl.addItem);
router.put('/items/:itemId', ctrl.updateItem);
router.put('/items/:itemId/toggle', ctrl.toggleItem);
router.delete('/:id', ctrl.deleteList);
router.delete('/items/:itemId', ctrl.deleteItem);

module.exports = router;
