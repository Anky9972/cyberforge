// Authentication Service
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService.js';
const prisma = new PrismaClient();
export class AuthService {
    jwtSecret;
    jwtRefreshSecret;
    jwtExpiry;
    jwtRefreshExpiry;
    bcryptRounds;
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
        this.jwtExpiry = process.env.JWT_EXPIRY || '24h';
        this.jwtRefreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
        this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    }
    /**
     * Register a new user
     */
    async register(email, username, password, firstName, lastName) {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }
        // Validate password strength
        this.validatePassword(password);
        // Hash password
        const hashedPassword = await bcrypt.hash(password, this.bcryptRounds);
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                firstName,
                lastName,
                verificationToken,
                isVerified: process.env.ENABLE_EMAIL_VERIFICATION !== 'true', // Auto-verify if email verification is disabled
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
                createdAt: true,
            }
        });
        // Send welcome/verification email
        try {
            const userName = firstName || username;
            if (process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
                await emailService.sendVerificationEmail(email, verificationToken);
            }
            else {
                await emailService.sendWelcomeEmail(email, userName);
            }
        }
        catch (error) {
            console.error('Failed to send email:', error);
            // Don't fail registration if email fails
        }
        return user;
    }
    /**
     * Login user
     */
    async login(emailOrUsername, password, ipAddress, userAgent) {
        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailOrUsername },
                    { username: emailOrUsername }
                ]
            }
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is disabled');
        }
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        // Generate tokens
        const tokens = await this.generateTokens(user, ipAddress, userAgent);
        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Return user info without password
        const { password: _, ...userWithoutPassword } = user;
        return {
            ...tokens,
            user: userWithoutPassword
        };
    }
    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, this.jwtRefreshSecret);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
        // Check if session exists and is valid
        const session = await prisma.session.findFirst({
            where: {
                refreshToken,
                userId: decoded.userId,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: true
            }
        });
        if (!session) {
            throw new Error('Invalid or expired session');
        }
        if (!session.user.isActive) {
            throw new Error('Account is disabled');
        }
        // Generate new tokens
        const tokens = await this.generateTokens(session.user);
        // Delete old session
        await prisma.session.delete({
            where: { id: session.id }
        });
        return tokens;
    }
    /**
     * Logout user
     */
    async logout(refreshToken) {
        await prisma.session.deleteMany({
            where: { refreshToken }
        });
    }
    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }
        // Validate new password
        this.validatePassword(newPassword);
        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        // Invalidate all sessions
        await prisma.session.deleteMany({
            where: { userId }
        });
    }
    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            // Don't reveal if user exists
            return 'If the email exists, a reset link will be sent';
        }
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetExpires
            }
        });
        // Send reset email
        try {
            const { emailService } = await import('./emailService.js');
            await emailService.sendPasswordResetEmail(user.email, user.name || 'User', resetToken);
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            // Continue even if email fails - token is saved
        }
        return resetToken; // In production, don't return this - send via email
    }
    /**
     * Reset password
     */
    async resetPassword(token, newPassword) {
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date()
                }
            }
        });
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }
        // Validate new password
        this.validatePassword(newPassword);
        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });
        // Invalidate all sessions
        await prisma.session.deleteMany({
            where: { userId: user.id }
        });
    }
    /**
     * Verify email
     */
    async verifyEmail(token) {
        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });
        if (!user) {
            throw new Error('Invalid verification token');
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null
            }
        });
    }
    /**
     * Generate JWT tokens and create session
     */
    async generateTokens(user, ipAddress, userAgent) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };
        const accessToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiry
        });
        const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
            expiresIn: this.jwtRefreshExpiry
        });
        // Calculate refresh token expiration
        const expiresAt = new Date();
        const days = parseInt(this.jwtRefreshExpiry.replace('d', ''));
        expiresAt.setDate(expiresAt.getDate() + days);
        // Store refresh token in database
        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken,
                expiresAt,
                ipAddress,
                userAgent
            }
        });
        return { accessToken, refreshToken };
    }
    /**
     * Validate password strength
     */
    validatePassword(password) {
        const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');
        const requireSpecial = process.env.PASSWORD_REQUIRE_SPECIAL === 'true';
        const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS === 'true';
        if (password.length < minLength) {
            throw new Error(`Password must be at least ${minLength} characters long`);
        }
        if (requireNumbers && !/\d/.test(password)) {
            throw new Error('Password must contain at least one number');
        }
        if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            throw new Error('Password must contain at least one special character');
        }
    }
    /**
     * Create API key
     */
    async createApiKey(userId, name, permissions, expiresAt) {
        // Generate API key
        const apiKey = `cfk_${crypto.randomBytes(32).toString('hex')}`;
        const hashedKey = await bcrypt.hash(apiKey, this.bcryptRounds);
        const key = await prisma.apiKey.create({
            data: {
                userId,
                name,
                key: hashedKey,
                permissions,
                expiresAt
            }
        });
        return {
            id: key.id,
            key: apiKey // Return unhashed key only once
        };
    }
    /**
     * Verify API key
     */
    async verifyApiKey(apiKey) {
        const keys = await prisma.apiKey.findMany({
            where: {
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: {
                user: true
            }
        });
        for (const key of keys) {
            const isValid = await bcrypt.compare(apiKey, key.key);
            if (isValid) {
                // Update last used
                await prisma.apiKey.update({
                    where: { id: key.id },
                    data: { lastUsedAt: new Date() }
                });
                return {
                    userId: key.userId,
                    permissions: key.permissions,
                    user: key.user
                };
            }
        }
        throw new Error('Invalid API key');
    }
}
export const authService = new AuthService();
//# sourceMappingURL=authService.js.map