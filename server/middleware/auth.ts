// Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import { authService } from '../../services/authService.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        role: string;
        isAdmin?: boolean;
      };
    }
  }
}

/**
 * Middleware to verify JWT token
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);
    req.user = {
      ...decoded,
      id: decoded.userId
    };

    next();
  } catch (error: any) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to verify API key
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'No API key provided' });
    }

    const result = await authService.verifyApiKey(apiKey);
    req.user = {
      id: result.userId,
      userId: result.userId,
      email: result.user.email,
      role: result.user.role
    };

    next();
  } catch (error: any) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
};

/**
 * Middleware to allow either JWT token or API key
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Try JWT first
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, next);
  }

  // Try API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }

  return res.status(401).json({ error: 'Authentication required' });
};

/**
 * Middleware to check user role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyAccessToken(token);
      req.user = {
        ...decoded,
        id: decoded.userId
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
