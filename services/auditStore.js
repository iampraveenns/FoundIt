import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

const INITIAL_AUDIT_LOGS = [
  {
    _id: 'audit_01',
    userId: 'user_officer_01',
    userName: 'Officer David Chen',
    userRole: 'TransitOfficer',
    action: 'CLAIM_VERIFIED',
    itemId: 'seed-item-5',
    itemName: 'Ray-Ban Wayfarer Classic Polarized Sunglasses',
    notes: 'Claimant matched proof of receipt and described original Ray-Ban cleaning cloth accurately.',
    metadata: { handoverStation: 'Grand Central Lost & Found', verifiedIdentity: true },
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: 'audit_02',
    userId: 'user_admin_01',
    userName: 'Chief Inspector Elena Rostova',
    userRole: 'Admin',
    action: 'ITEM_HANDSHAKE_COMPLETED',
    itemId: 'seed-item-5',
    itemName: 'Ray-Ban Wayfarer Classic Polarized Sunglasses',
    notes: 'Official custody transfer sealed and archived in municipal property records.',
    metadata: { archivalCode: 'NY-2026-TR882' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

let inMemoryAuditLogs = [...INITIAL_AUDIT_LOGS];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

export const auditRepository = {
  async log({ userId, userName, userRole, action, itemId = '', itemName = '', notes = '', metadata = {} }) {
    const entry = {
      userId,
      userName,
      userRole,
      action,
      itemId,
      itemName,
      notes,
      metadata,
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const doc = new AuditLog(entry);
        return await doc.save();
      } catch (err) {
        console.warn('Mongo audit log error:', err.message);
      }
    }

    const memoryEntry = {
      _id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...entry,
    };
    inMemoryAuditLogs.unshift(memoryEntry);
    return memoryEntry;
  },

  async getRecent(limit = 50) {
    if (isMongoConnected()) {
      try {
        return await AuditLog.find().sort({ createdAt: -1 }).limit(Number(limit)).lean();
      } catch (err) {
        console.warn('Mongo get audits error:', err.message);
      }
    }
    return inMemoryAuditLogs.slice(0, Number(limit));
  },
};
