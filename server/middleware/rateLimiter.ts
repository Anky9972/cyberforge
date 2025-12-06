// Rate Limiting Middleware with Redis
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

/**
 * Custom rate limit store using Redis
 */
class RedisStore {
  private redis: Redis;
  private prefix: string;

  constructor(redis: Redis, prefix = 'rl:') {
    this.redis = redis;
    this.prefix = prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    const fullKey = this.prefix + key;
    const ttl = 900; // 15 minutes in seconds

    const hits = await this.redis.incr(fullKey);
    
    if (hits === 1) {
      await this.redis.expire(fullKey, ttl);
    }

    const ttlRemaining = await this.redis.ttl(fullKey);
    const resetTime = ttlRemaining > 0 
      ? new Date(Date.now() + ttlRemaining * 1000)
      : undefined;

    return {
      totalHits: hits,
      resetTime
    };
  }

  async decrement(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await this.redis.decr(fullKey);
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await this.redis.del(fullKey);
  }
}

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore(redis, 'rl:api:') as any : undefined,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * Strict rate limiter for analysis endpoints
 */
export const analysisRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_ANALYSIS_WINDOW_MS || '3600000'), // 1 hour
  max: parseInt(process.env.RATE_LIMIT_ANALYSIS_MAX_REQUESTS || '10'),
  message: 'Analysis rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore(redis, 'rl:analysis:') as any : undefined,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user?.role === 'ADMIN';
  },
});

/**
 * Rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore(redis, 'rl:auth:') as any : undefined,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for password reset
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore(redis, 'rl:reset:') as any : undefined,
});

export { redis };
