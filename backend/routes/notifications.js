const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/notifications — notifications du user connecté
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort('-createdAt');

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications/unread-count — nombre de notifications non lues du user connecté
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications/:userId — notifications d’un utilisateur (admin uniquement)
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const notifications = await Notification.find({ userId })
      .sort('-createdAt');

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification non trouvée' });
    if (notification.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/notifications/read/:id — marquer une notification comme lue
router.put('/read/:id', protect, markNotificationRead);
router.put('/:id/read', protect, markNotificationRead);

module.exports = router;