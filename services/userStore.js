import User from '../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const DEMO_USERS = [
  {
    _id: 'user_std_01',
    name: 'Sarah Connor (Citizen)',
    email: 'sarah@citizen.org',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'Standard',
    badgeNumber: '',
    stationOrJurisdiction: 'SoHo Resident',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'user_officer_01',
    name: 'Officer David Chen',
    email: 'officer.chen@transit.gov',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'TransitOfficer',
    badgeNumber: 'TR-8942',
    stationOrJurisdiction: 'Grand Central Lost & Found Hub',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'user_admin_01',
    name: 'Chief Inspector Elena Rostova',
    email: 'admin@foundit.org',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'Admin',
    badgeNumber: 'ADM-001',
    stationOrJurisdiction: 'Metropolitan Central Command',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    createdAt: new Date().toISOString(),
  },
];

let inMemoryUsers = [...DEMO_USERS];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

export const userRepository = {
  async findByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongoConnected()) {
      try {
        return await User.findOne({ email: cleanEmail });
      } catch (err) {
        console.warn('Mongo findByEmail error, falling back:', err.message);
      }
    }
    return inMemoryUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findById(id) {
    if (isMongoConnected()) {
      try {
        return await User.findById(id);
      } catch (err) {
        console.warn('Mongo findById error, falling back:', err.message);
      }
    }
    return inMemoryUsers.find((u) => u._id === id || u.id === id) || null;
  },

  async create({ name, email, password, role = 'Standard', badgeNumber = '', stationOrJurisdiction = '', avatarUrl = '' }) {
    if (isMongoConnected()) {
      try {
        const user = new User({
          name,
          email,
          password,
          role,
          badgeNumber,
          stationOrJurisdiction,
          avatarUrl,
        });
        await user.save();
        return user.toSafeJSON();
      } catch (err) {
        console.warn('Mongo create user error, fallback to memory:', err.message);
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newUser = {
      _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      badgeNumber,
      stationOrJurisdiction,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      createdAt: new Date().toISOString(),
    };
    inMemoryUsers.push(newUser);
    return {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      badgeNumber: newUser.badgeNumber,
      stationOrJurisdiction: newUser.stationOrJurisdiction,
      avatarUrl: newUser.avatarUrl,
      createdAt: newUser.createdAt,
    };
  },

  async verifyPassword(user, candidatePassword) {
    if (user.comparePassword && typeof user.comparePassword === 'function') {
      return await user.comparePassword(candidatePassword);
    }
    if (user.passwordHash) {
      return bcrypt.compareSync(candidatePassword, user.passwordHash);
    }
    return false;
  },

  async updateRole(userId, newRole) {
    if (isMongoConnected()) {
      try {
        return await User.findByIdAndUpdate(userId, { role: newRole }, { new: true });
      } catch (err) {
        // Fallback
      }
    }
    const u = inMemoryUsers.find((user) => user._id === userId || user.id === userId);
    if (u) {
      u.role = newRole;
      return u;
    }
    return null;
  },

  toSafeJSON(user) {
    if (user.toSafeJSON) return user.toSafeJSON();
    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      badgeNumber: user.badgeNumber || '',
      stationOrJurisdiction: user.stationOrJurisdiction || '',
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt,
    };
  },
};
