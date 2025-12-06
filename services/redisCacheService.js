/**
 * Redis Cache Service
 * Provides caching layer for analysis results, AST parsing, and frequently accessed data
 */
import Redis from 'ioredis';
import crypto from 'crypto';
class RedisCacheService {
    redis;
    DEFAULT_TTL = 3600; // 1 hour
    PREFIX = 'cache:';
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: 1, // Use different DB than token blacklist
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            lazyConnect: true
        });
        this.redis.on('error', (err) => {
            console.error('Redis cache error:', err);
        });
        this.redis.on('connect', () => {
            console.log('✅ Redis cache connected');
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
            console.error('Failed to connect to Redis cache:', error);
            throw error;
        }
    }
    /**
     * Generate cache key from code content
     */
    generateCodeHash(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }
    /**
     * Cache analysis result
     */
    async cacheAnalysis(codeHash, result, options = {}) {
        try {
            const ttl = options.ttl || this.DEFAULT_TTL;
            const key = `${this.PREFIX}analysis:${codeHash}`;
            await this.redis.setex(key, ttl, JSON.stringify(result));
        }
        catch (error) {
            console.error('Error caching analysis:', error);
            // Don't throw - caching failure shouldn't break the app
        }
    }
    /**
     * Get cached analysis result
     */
    async getCachedAnalysis(codeHash) {
        try {
            const key = `${this.PREFIX}analysis:${codeHash}`;
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error('Error getting cached analysis:', error);
            return null;
        }
    }
    /**
     * Cache AST parsing result
     */
    async cacheAST(codeHash, ast, options = {}) {
        try {
            const ttl = options.ttl || this.DEFAULT_TTL;
            const key = `${this.PREFIX}ast:${codeHash}`;
            await this.redis.setex(key, ttl, JSON.stringify(ast));
        }
        catch (error) {
            console.error('Error caching AST:', error);
        }
    }
    /**
     * Get cached AST
     */
    async getCachedAST(codeHash) {
        try {
            const key = `${this.PREFIX}ast:${codeHash}`;
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error('Error getting cached AST:', error);
            return null;
        }
    }
    /**
     * Cache vulnerability scan result
     */
    async cacheScanResult(scanId, result, ttl = 3600) {
        try {
            const key = `${this.PREFIX}scan:${scanId}`;
            await this.redis.setex(key, ttl, JSON.stringify(result));
        }
        catch (error) {
            console.error('Error caching scan result:', error);
        }
    }
    /**
     * Get cached scan result
     */
    async getCachedScanResult(scanId) {
        try {
            const key = `${this.PREFIX}scan:${scanId}`;
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error('Error getting cached scan result:', error);
            return null;
        }
    }
    /**
     * Cache project data
     */
    async cacheProject(projectId, data, ttl = 1800) {
        try {
            const key = `${this.PREFIX}project:${projectId}`;
            await this.redis.setex(key, ttl, JSON.stringify(data));
        }
        catch (error) {
            console.error('Error caching project:', error);
        }
    }
    /**
     * Get cached project
     */
    async getCachedProject(projectId) {
        try {
            const key = `${this.PREFIX}project:${projectId}`;
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            console.error('Error getting cached project:', error);
            return null;
        }
    }
    /**
     * Invalidate cache for a specific key pattern
     */
    async invalidate(pattern) {
        try {
            const keys = await this.redis.keys(`${this.PREFIX}${pattern}`);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error('Error invalidating cache:', error);
        }
    }
    /**
     * Invalidate all project-related caches
     */
    async invalidateProject(projectId) {
        await this.invalidate(`project:${projectId}*`);
        await this.invalidate(`scan:${projectId}*`);
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const info = await this.redis.info('stats');
            const memory = await this.redis.info('memory');
            const totalKeys = await this.redis.dbsize();
            // Parse memory info
            const memMatch = memory.match(/used_memory_human:(.+)/);
            const memoryUsed = memMatch ? memMatch[1].trim() : 'Unknown';
            // Parse hit rate
            const hitsMatch = info.match(/keyspace_hits:(\d+)/);
            const missesMatch = info.match(/keyspace_misses:(\d+)/);
            const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
            const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
            const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;
            return {
                totalKeys,
                memoryUsed,
                hitRate: Math.round(hitRate * 100) / 100
            };
        }
        catch (error) {
            console.error('Error getting cache stats:', error);
            return {
                totalKeys: 0,
                memoryUsed: 'Unknown',
                hitRate: 0
            };
        }
    }
    /**
     * Clear all cache
     */
    async clearAll() {
        try {
            await this.redis.flushdb();
            console.log('✅ Cache cleared');
        }
        catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }
    /**
     * Close Redis connection
     */
    async disconnect() {
        await this.redis.quit();
    }
}
export const redisCacheService = new RedisCacheService();
export default redisCacheService;
//# sourceMappingURL=redisCacheService.js.map