const router = require('express').Router();
const { getCalendarEvents } = require('../controllers/calendarController');
const { authenticate, hasFamily } = require('../middleware/auth');

router.get('/', authenticate, hasFamily, getCalendarEvents);

module.exports = router;
