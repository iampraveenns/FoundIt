import mongoose from 'mongoose';

/**
 * Lost Report Model
 * Enables citizens to register missing items, triggering dual-direction
 * vector similarity matching against incoming found items.
 */
const lostReportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reporterId: {
      type: String,
      required: true,
      index: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterEmail: {
      type: String,
      required: true,
    },
    reporterPhone: {
      type: String,
      default: '',
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    primaryColor: {
      type: String,
      default: 'Unspecified',
    },
    brandOrManufacturer: {
      type: String,
      default: '',
    },
    serialNumberOrIMEI: {
      type: String,
      default: '',
    },
    identifyingMarks: {
      type: String,
      default: '',
    },
    detailedDescription: {
      type: String,
      required: true,
    },
    searchTags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    lastSeenLocationName: {
      type: String,
      required: true,
    },
    lastSeenCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    searchRadiusKm: {
      type: Number,
      default: 15,
    },
    lostDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MATCH_PENDING', 'REUNITED', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
    potentialMatches: [
      {
        itemId: { type: String, required: true },
        itemName: { type: String, required: true },
        score: { type: Number, required: true },
        matchRationale: { type: String },
        detectedAt: { type: Date, default: Date.now },
        claimInitiated: { type: Boolean, default: false },
      },
    ],
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      pushAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

lostReportSchema.index({ lastSeenCoordinates: '2dsphere' });
lostReportSchema.index({ category: 1, status: 1 });
lostReportSchema.index({ createdAt: -1 });

const LostReport = mongoose.models.LostReport || mongoose.model('LostReport', lostReportSchema);

export default LostReport;
