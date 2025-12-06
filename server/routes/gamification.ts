// Gamification Routes
import express from 'express';
import { gamificationService } from '../../services/gamificationService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/gamification/achievements
 * @desc    Get user achievements summary
 * @access  Private
 */
router.get('/achievements', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const summary = await gamificationService.getAchievementsSummary(userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/gamification/progress
 * @desc    Get user progress and stats
 * @access  Private
 */
router.get('/progress', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const progress = await gamificationService.getUserProgress(userId);
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Get global leaderboard
 * @access  Private
 */
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const leaderboard = await gamificationService.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/gamification/stats
 * @desc    Update user statistics
 * @access  Private
 */
router.post('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const stats = req.body;
    
    await gamificationService.updateStats(userId, stats);
    const progress = await gamificationService.getUserProgress(userId);
    const newAchievements = await gamificationService.checkAchievements(progress);
    
    res.json({
      success: true,
      newAchievements: newAchievements.length,
      achievements: newAchievements
    });
  } catch (error) {
    next(error);
  }
});

export default router;
