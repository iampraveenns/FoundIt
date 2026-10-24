import mongoose from 'mongoose';

/**
 * Item Schema for FoundIt - Real-Time Lost & Found System
 * Includes GeoJSON Point definition with 2dsphere index for geospatial proximity queries.
 */
const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude] in accordance with GeoJSON standard
      required: true,
      validate: {
        validator: function (coords) {
          return (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 && // longitude
            coords[1] >= -90 &&
            coords[1] <= 90 // latitude
          );
        },
        message: 'Coordinates must be valid [longitude, latitude] numbers.',
      },
    },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [120, 'Item name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics',
        'Bags & Wallets',
        'Keys & Badges',
        'Clothing & Accessories',
        'Documents & Cards',
        'Jewelry & Watches',
        'Eyewear',
        'Pets',
        'Sports & Outdoor',
        'Other',
      ],
      default: 'Other',
    },
    color: {
      type: String,
      required: [true, 'Item color is required'],
      trim: true,
    },
    locationName: {
      type: String,
      required: [true, 'Location name or landmark is required'],
      trim: true,
    },
    location: {
      type: locationSchema,
      required: [true, 'Geospatial coordinates are required'],
    },
    searchTags: {
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Detailed visual description is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Item photo or thumbnail is required'],
    },
    status: {
      type: String,
      enum: ['found', 'claimed', 'returned'],
      default: 'found',
      index: true,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.95,
    },
    claimQuestion: {
      type: String,
      default: '',
    },
    reportedBy: {
      type: String,
      default: 'Good Samaritan',
    },
    contactHint: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2dsphere index for location-based spatial queries ($near, $geoWithin, $geoNear)
itemSchema.index({ location: '2dsphere' });

// Text index for rapid keyword matching
itemSchema.index({ itemName: 'text', description: 'text', searchTags: 'text' });

// Compound index for frequent live queries
itemSchema.index({ status: 1, createdAt: -1 });

// Prevent compiling model multiple times in hot reload environments
const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

export default Item;
