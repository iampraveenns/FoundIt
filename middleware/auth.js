import jwt from 'jsonwebtoken';
import { userRepository } from '../services/userStore.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'foundit_enterprise_jwt_secret_key_2026';

/**
 * Authentication Middleware
 * Validates Bearer JWT from Authorization header and sets req.user
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Bearer token.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or session revoked.',
      });
    }

    req.user = userRepository.toSafeJSON(user);
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * RBAC Role Authorization Middleware
 * Usage: requireRole('TransitOfficer', 'Admin')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required prior to role authorization.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Optional Authentication Middleware
 * If token is present, sets req.user, but does not block unauthenticated requests
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      if (user) {
        req.user = userRepository.toSafeJSON(user);
      }
    } catch (e) {
      // Ignore invalid token on optional auth
    }
  }
  next();
}
