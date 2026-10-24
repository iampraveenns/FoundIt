import express from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../services/userStore.js';
import { auditRepository } from '../services/auditStore.js';
import { authenticateToken, requireRole, optionalAuth, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate 7-day JWT token
 */
function generateToken(userSafe) {
  return jwt.sign(
    {
      id: userSafe.id,
      email: userSafe.email,
      role: userSafe.role,
      name: userSafe.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /register
 * Register a new user account with role
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'Standard', badgeNumber, stationOrJurisdiction } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const newUser = await userRepository.create({
      name,
      email,
      password,
      role: ['Standard', 'TransitOfficer', 'Admin'].includes(role) ? role : 'Standard',
      badgeNumber,
      stationOrJurisdiction,
    });

    const token = generateToken(newUser);

    await auditRepository.log({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'USER_ROLE_UPDATED',
      notes: `User registered with initial role ${newUser.role}`,
    });

    res.status(201).json({
      success: true,
      user: newUser,
      token,
      message: 'Account registered successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /login
 * Authenticate credentials and issue JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or credentials' });
    }

    const isValid = await userRepository.verifyPassword(user, password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or credentials' });
    }

    const safeUser = userRepository.toSafeJSON(user);
    const token = generateToken(safeUser);

    res.json({
      success: true,
      user: safeUser,
      token,
      message: `Welcome back, ${safeUser.name}!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /me
 * Retrieve current authenticated session
 */
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /switch-role (Enterprise Demo Simulator)
 * Allows seamlessly switching persona between Standard, TransitOfficer, and Admin
 */
router.post('/switch-role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Standard', 'TransitOfficer', 'Admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role specified' });
    }

    const updatedUser = await userRepository.updateRole(req.user.id, role);
    const safeUser = userRepository.toSafeJSON(updatedUser);
    const newToken = generateToken(safeUser);

    await auditRepository.log({
      userId: safeUser.id,
      userName: safeUser.name,
      userRole: role,
      action: 'USER_ROLE_UPDATED',
      notes: `Role transitioned to ${role} via enterprise session switch`,
    });

    res.json({
      success: true,
      user: safeUser,
      token: newToken,
      message: `Role switched to ${role}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /audit-logs
 * Protected audit trail with graceful demo fallback
 */
router.get('/audit-logs', optionalAuth, async (req, res) => {
  try {
    const logs = await auditRepository.getRecent(req.query.limit || 50);
    res.json({
      success: true,
      count: logs.length,
      logs,
      viewerRole: req.user ? req.user.role : 'Public',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
