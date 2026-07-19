const router = require('express').Router();
const ctrl = require('../controllers/vehiclesController');
const { authenticate, hasFamily } = require('../middleware/auth');
const { uploadVehicle, uploadInsurance } = require('../middleware/upload');

router.use(authenticate, hasFamily);

router.get('/', ctrl.getVehicles);
router.post('/', uploadVehicle.single('photo'), ctrl.createVehicle);
router.put('/:id', ctrl.updateVehicle);
router.delete('/:id', ctrl.deleteVehicle);

// Vidanges
router.get('/:id/oil-changes', ctrl.getOilChanges);
router.post('/:id/oil-change', ctrl.addOilChange);

// Assurances
router.get('/:id/insurance', ctrl.getInsurance);
router.post('/:id/insurance', uploadInsurance.single('document'), ctrl.addInsurance);

module.exports = router;
