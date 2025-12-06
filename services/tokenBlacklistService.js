/**
 * JWT Token Blacklist Service
 * Implements Redis-based token revocation to prevent replay attacks
 */
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
class TokenBlacklistService {
    redis;
    PREFIX = 'blacklist:';
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            lazyConnect: true
        });
        this.redis.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
        this.redis.on('connect', () => {
            console.log('✅ Redis connected for token blacklist');
        });
    }
    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            await this.redis.connect();
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    /**
     * Revoke a JWT token by adding it to the blacklist
     * @param token - JWT token to revoke
     * @returns Promise<void>
     */
    async revokeToken(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                throw new Error('Invalid token format');
            }
            const now = Math.floor(Date.now() / 1000);
            const ttl = decoded.exp - now;
            if (ttl > 0) {
                await this.redis.setex(`${this.PREFIX}${token}`, ttl, JSON.stringify({
                    userId: decoded.userId,
                    revokedAt: new Date().toISOString()
                }));
            }
        }
        catch (error) {
            console.error('Error revoking token:', error);
            throw error;
        }
    }
    /**
     * Check if a token is blacklisted
     * @param token - JWT token to check
     * @returns Promise<boolean> - true if blacklisted
     */
    async isTokenBlacklisted(token) {
        try {
            const exists = await this.redis.exists(`${this.PREFIX}${token}`);
            return exists === 1;
        }
        catch (error) {
            console.error('Error checking token blacklist:', error);
            // In case of Redis error, allow the token (fail open)
            // You might want to fail closed in production
            return false;
        }
    }
    /**
     * Revoke all tokens for a specific user (useful for logout all sessions)
     * @param userId - User ID
     */
    async revokeAllUserTokens(userId) {
        try {
            await this.redis.sadd(`user:${userId}:revoked`, Date.now().toString());
            await this.redis.expire(`user:${userId}:revoked`, 86400 * 7); // 7 days
        }
        catch (error) {
            console.error('Error revoking all user tokens:', error);
            throw error;
        }
    }
    /**
     * Check if user has revoked all tokens
     * @param userId - User ID
     * @param tokenIssuedAt - Token issued timestamp
     */
    async isUserTokensRevoked(userId, tokenIssuedAt) {
        try {
            const revokedAt = await this.redis.smembers(`user:${userId}:revoked`);
            for (const timestamp of revokedAt) {
                if (parseInt(timestamp) > tokenIssuedAt * 1000) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Error checking user token revocation:', error);
            return false;
        }
    }
    /**
     * Get blacklist statistics
     */
    async getStats() {
        try {
            const keys = await this.redis.keys(`${this.PREFIX}*`);
            return {
                totalBlacklisted: keys.length
            };
        }
        catch (error) {
            console.error('Error getting blacklist stats:', error);
            return { totalBlacklisted: 0 };
        }
    }
    /**
     * Close Redis connection
     */
    async disconnect() {
        await this.redis.quit();
    }
}
export const tokenBlacklistService = new TokenBlacklistService();
export default tokenBlacklistService;
//# sourceMappingURL=tokenBlacklistService.js.map