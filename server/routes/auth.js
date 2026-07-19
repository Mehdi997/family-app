const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate, isChef } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { registerRules, loginRules, handleValidation } = require('../middleware/validate');

router.post('/register', registerRules, handleValidation, ctrl.register);
router.post('/login', loginRules, handleValidation, ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

// Routes protégées
router.get('/me', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, uploadAvatar.single('avatar'), ctrl.updateProfile);
router.put('/password', authenticate, ctrl.changePassword);
router.post('/invite', authenticate, isChef, ctrl.inviteMember);
router.post('/join', authenticate, ctrl.joinFamily);

module.exports = router;
