const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.get('/', authenticate, hasFamily, getDashboard);

module.exports = router;
