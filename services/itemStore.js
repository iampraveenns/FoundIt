import Item from '../models/Item.js';
import mongoose from 'mongoose';

/**
 * Initial seed items for immediate out-of-the-box demonstration
 * Coordinates centered around standard urban metro areas (e.g. NYC Manhattan)
 */
export const INITIAL_SEED_ITEMS = [
  {
    _id: 'seed-item-1',
    itemName: 'Apple AirPods Pro (2nd Gen) in MagSafe Case',
    category: 'Electronics',
    color: 'White',
    locationName: 'Central Park West & 72nd St, Bench near Strawberry Fields',
    location: {
      type: 'Point',
      coordinates: [-73.9745, 40.7758], // [lng, lat]
    },
    searchTags: ['airpods', 'apple', 'headphones', 'earbuds', 'case', 'wireless', 'bluetooth'],
    description: 'White AirPods Pro 2 charging case with a small scratch on the back hinge and a blue silicone carabiner strap attached.',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
    status: 'found',
    aiConfidence: 0.98,
    claimQuestion: 'What color or accessory was attached to the silicone strap clip?',
    reportedBy: 'Park Ranger Dave',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
  },
  {
    _id: 'seed-item-2',
    itemName: 'Vintage Brown Leather Bifold Wallet',
    category: 'Bags & Wallets',
    color: 'Dark Brown',
    locationName: 'Grand Central Terminal, Main Concourse near Information Booth',
    location: {
      type: 'Point',
      coordinates: [-73.9772, 40.7527],
    },
    searchTags: ['wallet', 'leather', 'bifold', 'brown', 'cards', 'cash', 'money', 'fossil'],
    description: 'Distressed brown full-grain leather wallet with cream contrast stitching. Contains student transit card visible in thumb slot.',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    status: 'found',
    aiConfidence: 0.96,
    claimQuestion: 'What university or institution is printed on the transit/student card inside?',
    reportedBy: 'Transit Staff Maria',
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1.2 hours ago
  },
  {
    _id: 'seed-item-3',
    itemName: 'Patagonia Black Hole Pack 25L (Navy Blue)',
    category: 'Bags & Wallets',
    color: 'Navy Blue & Teal',
    locationName: 'Bryant Park Reading Room, Outdoor Tables',
    location: {
      type: 'Point',
      coordinates: [-73.9832, 40.7536],
    },
    searchTags: ['backpack', 'patagonia', 'navy', 'blue', 'bag', 'travel', 'commuter', 'laptop'],
    description: 'Glossy weather-resistant navy blue backpack with teal Patagonia typography. Side mesh pocket holds a stainless steel water bottle.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    status: 'found',
    aiConfidence: 0.94,
    claimQuestion: 'What brand or sticker is on the stainless steel water bottle in the side pocket?',
    reportedBy: 'Alex K.',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
  },
  {
    _id: 'seed-item-4',
    itemName: 'Toyota Smart Car Key Fob with Swiss Army Knife',
    category: 'Keys & Badges',
    color: 'Black & Silver with Red Knife',
    locationName: 'SoHo Broadway & Prince St, Outdoor Cafe Patio',
    location: {
      type: 'Point',
      coordinates: [-73.9983, 40.7248],
    },
    searchTags: ['keys', 'keychain', 'toyota', 'fob', 'car key', 'victorinox', 'swiss army knife'],
    description: 'Toyota 3-button key fob on a titanium split ring attached to a classic red Victorinox Swiss pocket knife and an office badge.',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    status: 'found',
    aiConfidence: 0.97,
    claimQuestion: 'What company or access code is printed on the attached plastic keycard?',
    reportedBy: 'Cafe Barista Jordan',
    createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
  {
    _id: 'seed-item-5',
    itemName: 'Ray-Ban Wayfarer Classic Polarized Sunglasses',
    category: 'Eyewear',
    color: 'Tortoise Shell',
    locationName: 'High Line at 23rd Street Overlook',
    location: {
      type: 'Point',
      coordinates: [-74.0048, 40.7480],
    },
    searchTags: ['sunglasses', 'ray-ban', 'tortoise', 'shades', 'glasses', 'wayfarer', 'polarized'],
    description: 'Tortoiseshell frame with green G-15 crystal lenses in a black protective Ray-Ban snap case.',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    status: 'claimed',
    aiConfidence: 0.93,
    claimQuestion: 'Is the cleaning cloth inside patterned or plain?',
    reportedBy: 'High Line Security',
    createdAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
  },
];

// In-memory collection fallback if MongoDB is not connected
let inMemoryItems = [...INITIAL_SEED_ITEMS];

/**
 * Calculate distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Check if Mongoose connection is ready
 */
export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Universal Item Repository providing Mongoose / fallback operations
 */
export const itemRepository = {
  async create(data) {
    if (isMongoConnected()) {
      try {
        const item = new Item(data);
        return await item.save();
      } catch (err) {
        console.warn('Mongoose save failed, saving to in-memory store:', err.message);
      }
    }
    const newItem = {
      _id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'found',
      ...data,
    };
    inMemoryItems.unshift(newItem);
    return newItem;
  },

  async findAll({ category, status, search, limit = 50, skip = 0 }) {
    if (isMongoConnected()) {
      try {
        const filter = {};
        if (category && category !== 'All') filter.category = category;
        if (status && status !== 'All') filter.status = status;
        if (search) {
          filter.$or = [
            { itemName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { searchTags: { $in: [new RegExp(search, 'i')] } },
          ];
        }
        return await Item.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean();
      } catch (err) {
        console.warn('Mongoose query failed, using in-memory store:', err.message);
      }
    }

    let results = [...inMemoryItems];
    if (category && category !== 'All') {
      results = results.filter((i) => i.category === category);
    }
    if (status && status !== 'All') {
      results = results.filter((i) => i.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.searchTags && i.searchTags.some((t) => t.toLowerCase().includes(q))) ||
          i.color.toLowerCase().includes(q)
      );
    }
    return results.slice(Number(skip), Number(skip) + Number(limit));
  },

  async findById(id) {
    if (isMongoConnected()) {
      try {
        const item = await Item.findById(id).lean();
        if (item) return item;
      } catch (err) {
        // Fallback to in-memory
      }
    }
    return inMemoryItems.find((i) => i._id === id || i.id === id) || null;
  },

  async updateStatus(id, newStatus, claimNote = '') {
    if (isMongoConnected()) {
      try {
        const updated = await Item.findByIdAndUpdate(
          id,
          { status: newStatus, $set: { updatedAt: new Date(), lastClaimNote: claimNote } },
          { new: true }
        ).lean();
        if (updated) return updated;
      } catch (err) {
        console.warn('Mongoose update failed:', err.message);
      }
    }

    const item = inMemoryItems.find((i) => i._id === id || i.id === id);
    if (item) {
      item.status = newStatus;
      item.updatedAt = new Date().toISOString();
      if (claimNote) item.lastClaimNote = claimNote;
      return item;
    }
    return null;
  },

  async getNearCoordinates(lng, lat, maxDistanceKm = 50) {
    if (isMongoConnected()) {
      try {
        // MongoDB 2dsphere $near query with maxDistance in meters
        return await Item.find({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat],
              },
              $maxDistance: maxDistanceKm * 1000,
            },
          },
        }).limit(30).lean();
      } catch (err) {
        console.warn('Mongoose $near failed, falling back to Haversine calculation:', err.message);
      }
    }

    // Haversine fallback calculation
    return inMemoryItems
      .map((item) => {
        const [iLng, iLat] = item.location?.coordinates || [0, 0];
        const distKm = calculateDistanceKm(lat, lng, iLat, iLng);
        return { ...item, distanceKm: distKm };
      })
      .filter((item) => item.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  async getStats() {
    const all = await this.findAll({ limit: 500 });
    const totalFound = all.length;
    const claimed = all.filter((i) => i.status === 'claimed' || i.status === 'returned').length;
    const active = all.filter((i) => i.status === 'found').length;
    return {
      totalFound,
      claimed,
      active,
      successRate: totalFound > 0 ? Math.round((claimed / totalFound) * 100) : 0,
    };
  },
};
