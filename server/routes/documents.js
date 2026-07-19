const router = require('express').Router();
const ctrl = require('../controllers/documentsController');
const { authenticate, hasFamily } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getDocuments);
router.post('/', uploadDocument.single('file'), ctrl.uploadDocument);
router.delete('/:id', ctrl.deleteDocument);

module.exports = router;
