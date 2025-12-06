// Analysis History Routes
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/analyses
 * @desc    Get user's analysis history
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Get all scans with their vulnerabilities
    const scans = await prisma.scan.findMany({
      where: {
        project: {
          userId
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        vulnerabilities: {
          select: {
            id: true,
            severity: true
          }
        },
        scanMetrics: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 analyses
    });

    // Transform to match frontend interface
    const analyses = scans.map(scan => ({
      id: scan.id,
      filename: scan.project.name,
      timestamp: scan.createdAt.toISOString(),
      severity: getSeverityLevel(scan.vulnerabilities),
      vulnerabilitiesFound: scan.vulnerabilities.length,
      analysesRun: [scan.scanType],
      duration: scan.scanMetrics?.analysisTime || 0,
      status: scan.status as 'completed' | 'failed' | 'in-progress'
    }));

    res.json(analyses);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analyses/:id
 * @desc    Get specific analysis details
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const scan = await prisma.scan.findFirst({
      where: {
        id,
        project: {
          userId
        }
      },
      include: {
        project: true,
        vulnerabilities: true,
        scanMetrics: true
      }
    });

    if (!scan) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(scan);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/analyses/:id
 * @desc    Delete an analysis
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    // Verify ownership
    const scan = await prisma.scan.findFirst({
      where: {
        id,
        project: {
          userId
        }
      }
    });

    if (!scan) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Delete scan and related data (cascading)
    await prisma.scan.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Analysis deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to determine severity level from vulnerabilities
 */
function getSeverityLevel(vulnerabilities: Array<{ severity: string }>): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (vulnerabilities.some(v => v.severity === 'CRITICAL')) return 'Critical';
  if (vulnerabilities.some(v => v.severity === 'HIGH')) return 'High';
  if (vulnerabilities.some(v => v.severity === 'MEDIUM')) return 'Medium';
  return 'Low';
}

export default router;
