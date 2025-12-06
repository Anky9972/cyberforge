/**
 * JWT Token Blacklist Service
 * Implements Redis-based token revocation to prevent replay attacks
 */
declare class TokenBlacklistService {
    private redis;
    private readonly PREFIX;
    constructor();
    /**
     * Initialize Redis connection
     */
    connect(): Promise<void>;
    /**
     * Revoke a JWT token by adding it to the blacklist
     * @param token - JWT token to revoke
     * @returns Promise<void>
     */
    revokeToken(token: string): Promise<void>;
    /**
     * Check if a token is blacklisted
     * @param token - JWT token to check
     * @returns Promise<boolean> - true if blacklisted
     */
    isTokenBlacklisted(token: string): Promise<boolean>;
    /**
     * Revoke all tokens for a specific user (useful for logout all sessions)
     * @param userId - User ID
     */
    revokeAllUserTokens(userId: string): Promise<void>;
    /**
     * Check if user has revoked all tokens
     * @param userId - User ID
     * @param tokenIssuedAt - Token issued timestamp
     */
    isUserTokensRevoked(userId: string, tokenIssuedAt: number): Promise<boolean>;
    /**
     * Get blacklist statistics
     */
    getStats(): Promise<{
        totalBlacklisted: number;
    }>;
    /**
     * Close Redis connection
     */
    disconnect(): Promise<void>;
}
export declare const tokenBlacklistService: TokenBlacklistService;
export default tokenBlacklistService;
//# sourceMappingURL=tokenBlacklistService.d.ts.map