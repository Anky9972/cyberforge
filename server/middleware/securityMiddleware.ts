/**
 * Enhanced Security Middleware
 * Comprehensive security layer with Helmet, rate limiting, CORS, and input validation
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

/**
 * Configure Helmet for security headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

/**
 * General rate limiter for API endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(15 * 60) // seconds
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Your account has been temporarily locked. Please try again in 15 minutes.',
      retryAfter: 900
    });
  }
});

/**
 * Rate limiter for scanning endpoints
 */
export const scanRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 scans per hour
  message: 'Too many scan requests, please try again later',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Scan quota exceeded',
      message: 'You have reached your hourly scan limit. Please upgrade for more scans.',
      retryAfter: 3600
    });
  }
});

/**
 * CORS configuration
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || ''
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 86400 // 24 hours
});

/**
 * Request sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential XSS from request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate Content-Type middleware
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type');

    if (!contentType) {
      if (req.method === 'GET' || req.method === 'DELETE') {
        return next();
      }
      return res.status(400).json({
        error: 'Missing Content-Type header'
      });
    }

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Request logger middleware (sanitized)
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Don't log sensitive information
    if (req.path.includes('/auth') || req.path.includes('/password')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    } else {
      console.log(`[${new Date().toISOString()}]`, log);
    }
  });

  next();
};

/**
 * API key validation middleware
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key');

  if (!apiKey) {
    return res.status(401).json({
      error: 'Missing API key',
      message: 'Please provide an API key in the X-API-Key header'
    });
  }

  // In production, validate against database
  // For now, basic validation
  if (apiKey.length < 32) {
    return res.status(401).json({
      error: 'Invalid API key format'
    });
  }

  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: 'Payload too large',
          message: `Request size exceeds ${maxSize}`
        });
      }
    }

    next();
  };
};

/**
 * Parse size string to bytes
 */
function parseSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)?$/i);
  if (!match) return 10485760; // Default 10MB

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();

  const multipliers: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  return value * (multipliers[unit] || 1);
}

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Combine all security middleware
 */
export const securityMiddleware = [
  helmetMiddleware,
  corsMiddleware,
  securityHeaders,
  sanitizeInput,
  requestLogger
];

export default {
  helmetMiddleware,
  generalRateLimiter,
  authRateLimiter,
  scanRateLimiter,
  corsMiddleware,
  sanitizeInput,
  validateContentType,
  requestLogger,
  validateApiKey,
  requestSizeLimiter,
  securityHeaders,
  securityMiddleware
};
