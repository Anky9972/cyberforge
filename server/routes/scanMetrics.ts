// Scan Metrics Routes - Performance and analysis metrics
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/scan-metrics
 * Create scan metrics
 */
router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { 
    scanId, 
    analysisTime,
    aiCallsCount,
    aiTokensUsed,
    totalFunctions,
    totalClasses,
    totalFiles,
    cyclomaticComplexity,
    codeCoverage,
    testCoverage
  } = req.body;

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Verify scan ownership
    const scan = await prisma.scan.findFirst({
      where: { id: scanId, userId: req.user.userId }
    });

    if (!scan) {
      throw new AppError('Scan not found or access denied', 404);
    }

    const metrics = await prisma.scanMetrics.create({
      data: {
        scanId,
        analysisTime: analysisTime || 0,
        aiCallsCount: aiCallsCount || 0,
        aiTokensUsed: aiTokensUsed || 0,
        totalFunctions: totalFunctions || 0,
        totalClasses: totalClasses || 0,
        totalFiles: totalFiles || 0,
        cyclomaticComplexity,
        codeCoverage,
        testCoverage,
      }
    });

    res.status(201).json({
      message: 'Scan metrics created successfully',
      metrics
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * GET /api/scan-metrics/:scanId
 * Get metrics for a specific scan
 */
router.get('/:scanId', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Verify scan ownership
    const scan = await prisma.scan.findFirst({
      where: { id: req.params.scanId, userId: req.user.userId }
    });

    if (!scan) {
      throw new AppError('Scan not found or access denied', 404);
    }

    const metrics = await prisma.scanMetrics.findUnique({
      where: { scanId: req.params.scanId },
      include: {
        scan: {
          select: {
            id: true,
            status: true,
            completedAt: true,
            project: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!metrics) {
      throw new AppError('Metrics not found for this scan', 404);
    }

    res.json({ metrics });
  } finally {
    await prisma.$disconnect();
  }
}));

export default router;
