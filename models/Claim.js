import mongoose from 'mongoose';

/**
 * Claim State Machine Lifecycle
 * DRAFT -> SUBMITTED -> AI_EVALUATING -> (AI_APPROVED | AI_FLAGGED) -> OFFICER_REVIEW -> SCHEDULED_PICKUP -> HANDSHAKE_COMPLETED -> ARCHIVED
 * or -> REJECTED
 */
export const CLAIM_STATES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  AI_EVALUATING: 'AI_EVALUATING',
  AI_APPROVED: 'AI_APPROVED',
  AI_FLAGGED: 'AI_FLAGGED',
  OFFICER_REVIEW: 'OFFICER_REVIEW',
  SCHEDULED_PICKUP: 'SCHEDULED_PICKUP',
  HANDSHAKE_COMPLETED: 'HANDSHAKE_COMPLETED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
};

const claimSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: [true, 'Item ID is required'],
      index: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    claimantId: {
      type: String,
      required: true,
      index: true,
    },
    claimantName: {
      type: String,
      required: true,
    },
    claimantEmail: {
      type: String,
      required: true,
    },
    claimantPhone: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      enum: Object.values(CLAIM_STATES),
      default: CLAIM_STATES.SUBMITTED,
      index: true,
    },
    // User-submitted proof
    ownershipProof: {
      challengeAnswer: { type: String, required: true },
      purchaseReceiptUrl: { type: String, default: '' },
      serialNumberOrEngraving: { type: String, default: '' },
      identifyingMarks: { type: String, default: '' },
      lossDate: { type: String, default: '' },
      lossLocationDescription: { type: String, default: '' },
    },
    // Secondary Gemini AI Verification Pipeline Assessment
    aiVerification: {
      confidenceScore: { type: Number, default: 0 }, // 0.0 to 1.0
      matchAssessment: { type: String, default: '' },
      recommendation: {
        type: String,
        enum: ['APPROVE', 'FLAG_FOR_OFFICER', 'REJECT', 'PENDING'],
        default: 'PENDING',
      },
      verifiedAttributes: [{ type: String }],
      discrepancies: [{ type: String }],
      reasoning: { type: String, default: '' },
      evaluatedAt: { type: Date },
    },
    // Officer Review & Station Assignment
    officerReview: {
      reviewedByOfficerId: { type: String, default: '' },
      officerName: { type: String, default: '' },
      officerBadgeNumber: { type: String, default: '' },
      officerDecision: { type: String, enum: ['APPROVED', 'REJECTED', 'PENDING'], default: 'PENDING' },
      officerNotes: { type: String, default: '' },
      reviewedAt: { type: Date },
    },
    // Physical Handshake & Handover Schedule
    handshakeSchedule: {
      assignedHubId: { type: String, default: '' },
      assignedHubName: { type: String, default: '' },
      pickupLockerBin: { type: String, default: '' },
      scheduledDateTime: { type: Date },
      governmentIdTypeVerified: { type: String, default: '' },
      completedAt: { type: Date },
      handshakePhotoUrl: { type: String, default: '' },
    },
    stateHistory: [
      {
        fromState: { type: String },
        toState: { type: String },
        changedBy: { type: String },
        reason: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

claimSchema.index({ itemId: 1, claimantId: 1 });
claimSchema.index({ createdAt: -1 });

const Claim = mongoose.models.Claim || mongoose.model('Claim', claimSchema);

export default Claim;
