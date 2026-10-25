import LostReport from '../models/LostReport.js';
import mongoose from 'mongoose';
import { evaluateItemMatch } from './matching-service/engine.js';
import { itemRepository } from './itemStore.js';
import { auditRepository } from './auditStore.js';

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

const INITIAL_LOST_REPORTS = [
  {
    _id: 'lost_rep_101',
    reportNumber: 'LOST-2026-9041',
    reporterId: 'user_std_01',
    reporterName: 'Sarah Connor',
    reporterEmail: 'sarah@citizen.org',
    reporterPhone: '+1 (555) 234-5678',
    itemName: 'White Apple AirPods Pro 2 Charging Case',
    category: 'Electronics',
    primaryColor: 'White',
    brandOrManufacturer: 'Apple',
    serialNumberOrIMEI: 'Ending in 8X92',
    identifyingMarks: 'Blue silicone carabiner strap attached to loop, tiny scratch on back hinge',
    detailedDescription: 'Lost my AirPods Pro 2 case while jogging in Central Park near Strawberry fields. Has a sky blue silicone carabiner strap.',
    searchTags: ['airpods', 'apple', 'headphones', 'earbuds', 'white', 'strap', 'carabiner'],
    lastSeenLocationName: 'Central Park West & 72nd St, Strawberry Fields',
    lastSeenCoordinates: { type: 'Point', coordinates: [-73.9745, 40.7758] },
    searchRadiusKm: 15,
    lostDate: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'MATCH_PENDING',
    rewardAmount: 50,
    potentialMatches: [
      {
        itemId: 'seed-item-1',
        itemName: 'Apple AirPods Pro (2nd Gen) in MagSafe Case',
        score: 0.96,
        matchRationale: 'Identical category: Electronics • Strong vocabulary correlation (94%) • Color profile matches (White) • Found only 0.2 km from reported loss location',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        claimInitiated: true,
      },
    ],
    notificationPreferences: { emailAlerts: true, smsAlerts: true, pushAlerts: true },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    _id: 'lost_rep_102',
    reportNumber: 'LOST-2026-9042',
    reporterId: 'user_std_02',
    reporterName: 'Marcus Vance',
    reporterEmail: 'marcus.v@columbia.edu',
    reporterPhone: '+1 (555) 912-3344',
    itemName: 'Distressed Brown Leather Wallet',
    category: 'Bags & Wallets',
    primaryColor: 'Brown',
    brandOrManufacturer: 'Fossil / Full Grain',
    serialNumberOrIMEI: '',
    identifyingMarks: 'Columbia University student ID card in front thumb window',
    detailedDescription: 'Dark brown leather bifold with student ID and transit cards. Dropped during morning commute at Grand Central.',
    searchTags: ['wallet', 'leather', 'brown', 'columbia', 'id', 'cards', 'bifold'],
    lastSeenLocationName: 'Grand Central Terminal Main Concourse',
    lastSeenCoordinates: { type: 'Point', coordinates: [-73.9772, 40.7527] },
    searchRadiusKm: 20,
    lostDate: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: 'MATCH_PENDING',
    rewardAmount: 100,
    potentialMatches: [
      {
        itemId: 'seed-item-2',
        itemName: 'Vintage Brown Leather Bifold Wallet',
        score: 0.95,
        matchRationale: 'Identical category: Bags & Wallets • Strong vocabulary correlation (92%) • Color profile matches (Dark Brown) • Found only 0.1 km from reported loss location',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
        claimInitiated: true,
      },
    ],
    notificationPreferences: { emailAlerts: true, smsAlerts: false, pushAlerts: true },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    _id: 'lost_rep_103',
    reportNumber: 'LOST-2026-9043',
    reporterId: 'user_std_04',
    reporterName: 'Chloe Bennett',
    reporterEmail: 'chloe.b@nyu.edu',
    reporterPhone: '+1 (555) 432-8765',
    itemName: 'Ray-Ban Wayfarer Classic Sunglasses with Black Snap Case',
    category: 'Eyewear',
    primaryColor: 'Tortoise Shell',
    brandOrManufacturer: 'Ray-Ban',
    identifyingMarks: 'Green G-15 crystal lenses with polarized engraving',
    detailedDescription: 'Left on a bench while walking on the High Line. Tortoiseshell frame.',
    searchTags: ['sunglasses', 'rayban', 'wayfarer', 'tortoise', 'glasses', 'shades'],
    lastSeenLocationName: 'The High Line at 23rd St',
    lastSeenCoordinates: { type: 'Point', coordinates: [-74.0048, 40.748] },
    searchRadiusKm: 10,
    lostDate: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    status: 'ACTIVE',
    rewardAmount: 25,
    potentialMatches: [
      {
        itemId: 'seed-item-5',
        itemName: 'Ray-Ban Wayfarer Classic Polarized Sunglasses',
        score: 0.94,
        matchRationale: 'Identical category: Eyewear • Strong vocabulary correlation (91%) • Color profile matches (Tortoise Shell) • Found only 0.1 km from reported loss location',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        claimInitiated: false,
      },
    ],
    notificationPreferences: { emailAlerts: true, smsAlerts: true, pushAlerts: true },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];

let inMemoryLostReports = [...INITIAL_LOST_REPORTS];

export const lostReportRepository = {
  async getAll(filter = {}) {
    if (isMongoConnected()) {
      try {
        return await LostReport.find(filter).sort({ createdAt: -1 }).lean();
      } catch (e) {
        console.warn('Mongo getAll lost reports error:', e.message);
      }
    }
    return inMemoryLostReports.filter((r) => {
      if (filter.status && r.status !== filter.status) return false;
      if (filter.reporterId && r.reporterId !== filter.reporterId) return false;
      if (filter.category && r.category !== filter.category) return false;
      return true;
    });
  },

  async findById(id) {
    if (isMongoConnected()) {
      try {
        return await LostReport.findById(id);
      } catch (e) {
        // Fallback
      }
    }
    return inMemoryLostReports.find((r) => r._id === id || r.id === id) || null;
  },

  async create(reportData) {
    const reportNumber = `LOST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullData = {
      reportNumber,
      status: 'ACTIVE',
      potentialMatches: [],
      ...reportData,
      createdAt: new Date().toISOString(),
    };

    let saved = null;
    if (isMongoConnected()) {
      try {
        const doc = new LostReport(fullData);
        saved = await doc.save();
      } catch (e) {
        console.warn('Mongo create lost report error:', e.message);
      }
    }

    if (!saved) {
      saved = {
        _id: 'lost_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        ...fullData,
      };
      inMemoryLostReports.unshift(saved);
    }

    // Immediately run auto-matching against the found item repository!
    await this.runAutoMatch(saved);

    // Audit log
    await auditRepository.log({
      userId: reportData.reporterId || 'anon_reporter',
      userName: reportData.reporterName || 'Citizen',
      userRole: 'Standard',
      action: 'CLAIM_REQUESTED',
      notes: `Citizen filed lost property notice #${reportNumber}: "${reportData.itemName}"`,
      metadata: { reportNumber, category: reportData.category },
    });

    return saved;
  },

  /**
   * Run multi-factor matching between this lost report and all active found items
   */
  async runAutoMatch(lostReport) {
    const foundItems = await itemRepository.getAll();
    const matches = [];

    for (const item of foundItems) {
      const evaluation = evaluateItemMatch(lostReport, item);
      if (evaluation.overallScore >= 0.55) {
        matches.push({
          itemId: item._id || item.id,
          itemName: item.itemName,
          score: evaluation.overallScore,
          matchRationale: evaluation.rationale,
          breakdown: evaluation.breakdown,
          detectedAt: new Date().toISOString(),
          claimInitiated: false,
        });
      }
    }

    // Sort by highest score first
    matches.sort((a, b) => b.score - a.score);

    lostReport.potentialMatches = matches;
    if (matches.length > 0 && matches[0].score >= 0.72) {
      lostReport.status = 'MATCH_PENDING';
    }

    return matches;
  },

  /**
   * Cross-match newly ingested found item against all active lost reports
   * Used as hook when items are reported via POST /found
   */
  async matchIncomingFoundItem(foundItem) {
    const allReports = await this.getAll({ status: 'ACTIVE' });
    const notificationsToSend = [];

    for (const report of allReports) {
      const evaluation = evaluateItemMatch(report, foundItem);
      if (evaluation.isConfidentMatch) {
        if (!report.potentialMatches) report.potentialMatches = [];
        report.potentialMatches.unshift({
          itemId: foundItem._id || foundItem.id,
          itemName: foundItem.itemName,
          score: evaluation.overallScore,
          matchRationale: evaluation.rationale,
          detectedAt: new Date().toISOString(),
          claimInitiated: false,
        });
        report.status = 'MATCH_PENDING';

        notificationsToSend.push({
          reportNumber: report.reportNumber,
          reporterEmail: report.reporterEmail,
          reporterName: report.reporterName,
          itemName: report.itemName,
          foundItemId: foundItem._id || foundItem.id,
          foundItemName: foundItem.itemName,
          confidenceScore: evaluation.overallScore,
        });
      }
    }

    return notificationsToSend;
  },
};
