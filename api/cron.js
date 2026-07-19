const { generateNotifications } = require('../server/controllers/notificationsController');

module.exports = async (req, res) => {
  try {
    await generateNotifications();
    res.status(200).json({ success: true, message: 'Notifications générées.' });
  } catch (error) {
    console.error('Erreur cron Vercel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
