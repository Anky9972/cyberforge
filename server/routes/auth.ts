// Authentication Routes
import express from 'express';
import { authService } from '../../services/authService.js';
import { authenticateToken, authenticate } from '../middleware/auth.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { auditLog } from '../middleware/logger.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authRateLimiter, asyncHandler(async (req: any, res: any) => {
  if (process.env.ENABLE_USER_REGISTRATION !== 'true') {
    throw new AppError('User registration is disabled', 403);
  }

  const { email, username, password, firstName, lastName } = req.body;

  if (!email || !username || !password) {
    throw new AppError('Email, username, and password are required', 400);
  }

  const user = await authService.register(email, username, password, firstName, lastName);

  await auditLog('USER_REGISTER', 'user', user.id, user.id, { email, username }, req);

  res.status(201).json({
    message: 'User registered successfully',
    user
  });
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authRateLimiter, asyncHandler(async (req: any, res: any) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    throw new AppError('Email/username and password are required', 400);
  }

  const result = await authService.login(
    emailOrUsername,
    password,
    req.ip,
    req.get('user-agent')
  );

  await auditLog('USER_LOGIN', 'user', result.user.id, result.user.id, null, req);

  res.json({
    message: 'Login successful',
    ...result
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req: any, res: any) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const tokens = await authService.refreshToken(refreshToken);

  res.json({
    message: 'Token refreshed successfully',
    ...tokens
  });
}));

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  await auditLog('USER_LOGOUT', 'user', req.user.userId, req.user.userId, null, req);

  res.json({ message: 'Logout successful' });
}));

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post('/change-password', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  await authService.changePassword(req.user.userId, currentPassword, newPassword);

  await auditLog('USER_CHANGE_PASSWORD', 'user', req.user.userId, req.user.userId, null, req);

  res.json({ message: 'Password changed successfully' });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', passwordResetRateLimiter, asyncHandler(async (req: any, res: any) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  await authService.requestPasswordReset(email);

  // Always return success to prevent email enumeration
  res.json({ message: 'If the email exists, a reset link will be sent' });
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', asyncHandler(async (req: any, res: any) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }

  await authService.resetPassword(token, newPassword);

  res.json({ message: 'Password reset successfully' });
}));

/**
 * GET /api/auth/verify-email/:token
 * Verify email address
 */
router.get('/verify-email/:token', asyncHandler(async (req: any, res: any) => {
  const { token } = req.params;

  await authService.verifyEmail(token);

  res.json({ message: 'Email verified successfully' });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      lastLoginAt: true,
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
}));

/**
 * POST /api/auth/api-keys
 * Create API key
 */
router.post('/api-keys', authenticateToken, asyncHandler(async (req: any, res: any) => {
  if (process.env.ENABLE_API_KEYS !== 'true') {
    throw new AppError('API keys are disabled', 403);
  }

  const { name, permissions, expiresAt } = req.body;

  if (!name) {
    throw new AppError('API key name is required', 400);
  }

  const result = await authService.createApiKey(
    req.user.userId,
    name,
    permissions || ['read'],
    expiresAt ? new Date(expiresAt) : undefined
  );

  await auditLog('API_KEY_CREATE', 'api_key', result.id, req.user.userId, { name }, req);

  res.status(201).json({
    message: 'API key created successfully',
    ...result,
    warning: 'Save this key securely. It will not be shown again.'
  });
}));

/**
 * GET /api/auth/api-keys
 * List user's API keys
 */
router.get('/api-keys', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: req.user.userId },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
      permissions: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ apiKeys });
}));

/**
 * DELETE /api/auth/api-keys/:id
 * Delete API key
 */
router.delete('/api-keys/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: req.params.id,
      userId: req.user.userId
    }
  });

  if (!apiKey) {
    throw new AppError('API key not found', 404);
  }

  await prisma.apiKey.delete({
    where: { id: req.params.id }
  });

  await auditLog('API_KEY_DELETE', 'api_key', req.params.id, req.user.userId, null, req);

  res.json({ message: 'API key deleted successfully' });
}));

export default router;
