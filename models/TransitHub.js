import mongoose from 'mongoose';

/**
 * Transit Hub & Multi-Agency Station Model
 * Provides multi-tenancy zoning and terminal custody transfer tracking.
 */

const transferManifestSchema = new mongoose.Schema(
  {
    manifestId: {
      type: String,
      required: true,
      unique: true,
    },
    itemIds: [{ type: String, required: true }],
    originHubId: { type: String, required: true },
    originHubName: { type: String, required: true },
    destinationHubId: { type: String, required: true },
    destinationHubName: { type: String, required: true },
    dispatchedByOfficerName: { type: String, required: true },
    dispatchedByBadge: { type: String, required: true },
    receivedByOfficerName: { type: String, default: '' },
    receivedByBadge: { type: String, default: '' },
    status: {
      type: String,
      enum: ['DISPATCHED', 'IN_TRANSIT', 'RECEIVED', 'SECURITY_HOLD'],
      default: 'DISPATCHED',
    },
    courierVehicleId: { type: String, default: 'VAN-METRO-402' },
    tamperEvidentSealNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    dispatchedAt: { type: Date, default: Date.now },
    receivedAt: { type: Date },
  },
  { timestamps: true }
);

const transitHubSchema = new mongoose.Schema(
  {
    hubCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    agency: {
      type: String,
      enum: [
        'MTA NYC Transit',
        'Port Authority of NY & NJ',
        'Amtrak Northeast Corridor',
        'JFK & LGA Airport Security',
        'Metro-North Railroad',
        'New Jersey Transit',
      ],
      required: true,
      index: true,
    },
    jurisdiction: {
      type: String,
      required: true,
    },
    location: {
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
    address: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    operatingHours: {
      type: String,
      default: '24/7 Custody Counter',
    },
    // Multi-tenancy storage zones within hub
    storageZones: [
      {
        zoneCode: { type: String, required: true }, // e.g. 'VAULT-SEC-01', 'LOCKER-CONCOURSE-A'
        name: { type: String, required: true },
        securityLevel: {
          type: String,
          enum: ['STANDARD', 'HIGH_SECURITY', 'HAZARDOUS', 'CLIMATE_CONTROLLED'],
          default: 'STANDARD',
        },
        capacity: { type: Number, default: 50 },
        occupiedCount: { type: Number, default: 0 },
        accessRoles: [{ type: String, default: 'TransitOfficer' }],
      },
    ],
    activeOfficersCount: {
      type: Number,
      default: 4,
    },
    totalItemsStored: {
      type: Number,
      default: 0,
    },
    transferManifests: [transferManifestSchema],
  },
  {
    timestamps: true,
  }
);

transitHubSchema.index({ location: '2dsphere' });
transitHubSchema.index({ agency: 1, hubCode: 1 });

const TransitHub = mongoose.models.TransitHub || mongoose.model('TransitHub', transitHubSchema);

export default TransitHub;
