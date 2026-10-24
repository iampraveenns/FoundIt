import { calculateDistanceKm } from '../utils/geo.js';

/**
 * Native Push Notification Service for FoundIt
 * Manages FCM / Web Push device subscriptions and geospatial radius triggers
 *
 * @typedef {Object} PushSubscriptionRecord
 * @property {string} id
 * @property {string} userId
 * @property {string} userName
 * @property {string} endpoint
 * @property {'ios' | 'android' | 'web'} deviceType
 * @property {[number, number]} watchCoordinates
 * @property {number} watchRadiusKm
 * @property {string[]} categories
 * @property {boolean} active
 * @property {string} createdAt
 */

// Initial active mock subscriptions around New York transit areas
const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub_citizen_01',
    userId: 'user_std_01',
    userName: 'Sarah Connor',
    endpoint: 'fcm://token_device_iphone_sarah_connor_2026',
    deviceType: 'ios',
    watchCoordinates: [-73.9745, 40.7758], // Central Park West
    watchRadiusKm: 15,
    categories: ['Electronics', 'Bags & Wallets', 'Keys & Badges'],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub_citizen_02',
    userId: 'user_std_02',
    userName: 'Marcus Vance',
    endpoint: 'fcm://token_device_android_marcus_vance_2026',
    deviceType: 'android',
    watchCoordinates: [-73.9772, 40.7527], // Grand Central
    watchRadiusKm: 20,
    categories: ['Bags & Wallets', 'Documents & Cards'],
    active: true,
    createdAt: new Date().toISOString(),
  },
];

let inMemorySubscriptions = [...INITIAL_SUBSCRIPTIONS];
let notificationHistory = [];

export const pushNotificationService = {
  /**
   * Register or update push subscription
   * @param {Object} options
   * @param {string} [options.userId]
   * @param {string} [options.userName]
   * @param {string} [options.endpoint]
   * @param {'ios' | 'android' | 'web'} [options.deviceType]
   * @param {[number, number]} [options.coordinates]
   * @param {number} [options.radiusKm]
   * @param {string[]} [options.categories]
   * @returns {Promise<PushSubscriptionRecord>}
   */
  async registerSubscription({
    userId = 'anon_user',
    userName = 'Citizen',
    endpoint,
    deviceType = 'web',
    coordinates = [-73.9855, 40.7580],
    radiusKm = 25,
    categories = [],
  }) {
    const existingIndex = inMemorySubscriptions.findIndex(
      (s) => s.userId === userId || (endpoint && s.endpoint === endpoint)
    );

    const record = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      userName,
      endpoint: endpoint || `fcm://token_simulated_${Date.now()}`,
      deviceType,
      watchCoordinates: coordinates,
      watchRadiusKm: radiusKm,
      categories: categories.length ? categories : ['All'],
      active: true,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      inMemorySubscriptions[existingIndex] = record;
    } else {
      inMemorySubscriptions.push(record);
    }

    return record;
  },

  /**
   * Get all active subscriptions
   * @returns {Promise<PushSubscriptionRecord[]>}
   */
  async getSubscriptions() {
    return inMemorySubscriptions;
  },

  /**
   * Evaluate newly found item against geospatial radius watch zones
   * @param {any} item
   * @param {any} [ioInstance]
   * @returns {Promise<{ matchedCount: number; alertsDispatched: any[] }>}
   */
  async dispatchGeospatialAlerts(item, ioInstance) {
    const [itemLng, itemLat] = item.location?.coordinates || [-73.98, 40.75];
    const alertsDispatched = [];

    for (const sub of inMemorySubscriptions) {
      if (!sub.active) continue;

      const [userLng, userLat] = sub.watchCoordinates;
      const distKm = calculateDistanceKm(userLat, userLng, itemLat, itemLng);

      // Check radius match
      const withinRadius = distKm <= sub.watchRadiusKm;

      // Check category match
      const categoryMatches =
        sub.categories.includes('All') ||
        sub.categories.includes(item.category) ||
        sub.categories.length === 0;

      if (withinRadius && categoryMatches) {
        const payload = {
          notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          recipientUserId: sub.userId,
          recipientName: sub.userName,
          deviceType: sub.deviceType,
          title: `📍 Lost Item Found Nearby: ${item.itemName}`,
          body: `An item matching your watch criteria was found ${distKm.toFixed(1)} km from your location at ${item.locationName}.`,
          distanceKm: distKm,
          itemId: item._id || item.id,
          itemName: item.itemName,
          category: item.category,
          imageUrl: item.imageUrl,
          timestamp: new Date().toISOString(),
        };

        alertsDispatched.push(payload);
        notificationHistory.unshift(payload);

        // Broadcast live push alert to client via Socket.io
        if (ioInstance) {
          ioInstance.emit('push:alert', payload);
        }
      }
    }

    return {
      matchedCount: alertsDispatched.length,
      alertsDispatched,
    };
  },

  /**
   * Get recent dispatched notifications history
   * @param {number} [limit=20]
   */
  getHistory(limit = 20) {
    return notificationHistory.slice(0, limit);
  },
};
