import mongoose from 'mongoose';

/**
 * Audit Log Schema for Item Claim Handshakes & Officer Actions
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ['Standard', 'TransitOfficer', 'Admin'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'ITEM_REPORTED',
        'CLAIM_REQUESTED',
        'CLAIM_VERIFIED',
        'ITEM_HANDSHAKE_COMPLETED',
        'STATUS_OVERRIDE',
        'USER_ROLE_UPDATED',
        'OFFICER_DISPATCHED',
      ],
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      index: true,
      default: '',
    },
    itemName: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
