import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema for FoundIt RBAC
 * Roles: 'Standard', 'TransitOfficer', 'Admin'
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['Standard', 'TransitOfficer', 'Admin'],
      default: 'Standard',
      index: true,
    },
    badgeNumber: {
      type: String,
      default: '',
      trim: true,
    },
    stationOrJurisdiction: {
      type: String,
      default: '',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe JSON without password
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    badgeNumber: this.badgeNumber,
    stationOrJurisdiction: this.stationOrJurisdiction,
    avatarUrl: this.avatarUrl,
    createdAt: this.createdAt,
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
