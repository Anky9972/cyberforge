interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private jwtSecret;
    private jwtRefreshSecret;
    private jwtExpiry;
    private jwtRefreshExpiry;
    private bcryptRounds;
    constructor();
    /**
     * Register a new user
     */
    register(email: string, username: string, password: string, firstName?: string, lastName?: string): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        role: import(".prisma/client").$Enums.Role;
        isVerified: boolean;
        createdAt: Date;
    }>;
    /**
     * Login user
     */
    login(emailOrUsername: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens & {
        user: any;
    }>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    /**
     * Logout user
     */
    logout(refreshToken: string): Promise<void>;
    /**
     * Verify access token
     */
    verifyAccessToken(token: string): TokenPayload;
    /**
     * Change password
     */
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Request password reset
     */
    requestPasswordReset(email: string): Promise<string>;
    /**
     * Reset password
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
    /**
     * Verify email
     */
    verifyEmail(token: string): Promise<void>;
    /**
     * Generate JWT tokens and create session
     */
    private generateTokens;
    /**
     * Validate password strength
     */
    private validatePassword;
    /**
     * Create API key
     */
    createApiKey(userId: string, name: string, permissions: string[], expiresAt?: Date): Promise<{
        id: string;
        key: string;
    }>;
    /**
     * Verify API key
     */
    verifyApiKey(apiKey: string): Promise<any>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=authService.d.ts.map