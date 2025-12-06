// Auto-Fix Generation Routes
import express from 'express';
import { autoFixGeneratorService } from '../../services/autoFixGeneratorService.js';
import { authenticate } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/autofix/generate
 * @desc    Generate auto-fix for a vulnerability
 * @access  Private
 */
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { vulnerabilityId } = req.body;
    
    // Fetch vulnerability details
    const vulnerability = await prisma.vulnerability.findUnique({
      where: { id: vulnerabilityId },
      include: {
        scan: {
          include: {
            project: true
          }
        }
      }
    });

    if (!vulnerability) {
      return res.status(404).json({ error: 'Vulnerability not found' });
    }

    // Check if user owns this project
    if (vulnerability.scan.project.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate fix
    const fix = await autoFixGeneratorService.generateFix(vulnerability as any);
    
    // Save to database
    const savedFix = await prisma.autoFix.create({
      data: {
        vulnerabilityId: vulnerability.id,
        userId: req.user!.id,
        originalCode: fix.originalCode,
        patchedCode: fix.patchedCode,
        explanation: fix.explanation,
        confidence: fix.confidence,
        tests: fix.tests,
        applied: false
      }
    });

    res.json({
      success: true,
      fix: savedFix
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/autofix/:vulnerabilityId
 * @desc    Get existing auto-fix for a vulnerability
 * @access  Private
 */
router.get('/:vulnerabilityId', authenticate, async (req, res, next) => {
  try {
    const { vulnerabilityId } = req.params;
    
    const fixes = await prisma.autoFix.findMany({
      where: { vulnerabilityId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(fixes);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/autofix/:id/apply
 * @desc    Mark auto-fix as applied
 * @access  Private
 */
router.post('/:id/apply', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const fix = await prisma.autoFix.update({
      where: { id },
      data: {
        applied: true,
        appliedAt: new Date()
      }
    });

    res.json({ success: true, fix });
  } catch (error) {
    next(error);
  }
});

export default router;
