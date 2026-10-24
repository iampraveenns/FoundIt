import express from 'express';
import { pushNotificationService } from '../services/pushNotification.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get dispatched notification alert stream
 */
router.get('/', (req, res) => {
  const history = pushNotificationService.getHistory(30);
  res.json({
    success: true,
    count: history.length,
    notifications: history,
  });
});

/**
 * GET /api/notifications/subscriptions
 * View active geospatial watch subscriptions
 */
router.get('/subscriptions', optionalAuth, async (req, res) => {
  try {
    const subs = await pushNotificationService.getSubscriptions();
    res.json({
      success: true,
      count: subs.length,
      subscriptions: subs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/subscribe
 * Register or update device push watch zone
 */
router.post('/subscribe', optionalAuth, async (req, res) => {
  try {
    const { coordinates, radiusKm, categories, endpoint, deviceType } = req.body;

    const userId = req.user ? req.user.id : 'user_citizen_' + Date.now();
    const userName = req.user ? req.user.name : 'Citizen User';

    const sub = await pushNotificationService.registerSubscription({
      userId,
      userName,
      endpoint,
      deviceType: deviceType || 'web',
      coordinates: coordinates || [-73.9855, 40.7580],
      radiusKm: Number(radiusKm) || 25,
      categories: categories || ['All'],
    });

    res.status(201).json({
      success: true,
      message: `Geospatial watch zone registered: ${sub.watchRadiusKm}km radius around [${sub.watchCoordinates.join(', ')}]`,
      subscription: sub,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/test
 * Manually trigger simulated radius push alert
 */
router.post('/test', (req, res) => {
  const io = req.app.get('io');
  const alert = {
    notificationId: `notif_test_${Date.now()}`,
    title: '🚨 Test Geospatial Radius Alert',
    body: 'A test lost item was registered within 2.4 km of Grand Central Concourse.',
    distanceKm: 2.4,
    itemName: 'Test Recovery Broadcast',
    category: 'Electronics',
    timestamp: new Date().toISOString(),
  };

  if (io) {
    io.emit('push:alert', alert);
  }

  res.json({
    success: true,
    message: 'Test alert emitted over WebSocket push bridge',
    alert,
  });
});

export default router;
