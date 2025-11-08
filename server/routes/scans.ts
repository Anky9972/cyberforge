// Scan Routes - Manage vulnerability scans
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { auditLog } from '../middleware/logger.js';

const router = express.Router();

/**
 * GET /api/scans
 * List user's scans
 */
router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const { projectId, status, limit = 50, offset = 0 } = req.query;

    const where: any = { userId: req.user.userId };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const scans = await prisma.scan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    const total = await prisma.scan.count({ where });

    res.json({ scans, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * POST /api/scans
 * Create a new scan
 */
router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { projectId, scanType } = req.body;

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user.userId
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const scan = await prisma.scan.create({
      data: {
        projectId,
        scanType: scanType || 'FULL',
        status: 'QUEUED',
        userId: req.user.userId,
      }
    });

    await auditLog('SCAN_CREATE', 'scan', scan.id, req.user.userId, { projectId, scanType }, req);

    res.status(201).json({
      message: 'Scan created successfully',
      scan
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * GET /api/scans/:id
 * Get scan details with results
 */
router.get('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const scan = await prisma.scan.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        vulnerabilities: true
      }
    });

    if (!scan) {
      throw new AppError('Scan not found', 404);
    }

    res.json({ scan });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * PUT /api/scans/:id
 * Update scan status or results
 */
router.put('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { status, results, vulnerabilities } = req.body;
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const existingScan = await prisma.scan.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!existingScan) {
      throw new AppError('Scan not found', 404);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (results) updateData.results = results;
    if (status === 'completed') updateData.completedAt = new Date();

    const scan = await prisma.scan.update({
      where: { id: req.params.id },
      data: updateData
    });

    await auditLog('SCAN_UPDATE', 'scan', scan.id, req.user.userId, { status }, req);

    res.json({
      message: 'Scan updated successfully',
      scan
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * DELETE /api/scans/:id
 * Delete scan
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const scan = await prisma.scan.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!scan) {
      throw new AppError('Scan not found', 404);
    }

    await prisma.scan.delete({
      where: { id: req.params.id }
    });

    await auditLog('SCAN_DELETE', 'scan', req.params.id, req.user.userId, null, req);

    res.json({ message: 'Scan deleted successfully' });
  } finally {
    await prisma.$disconnect();
  }
}));

export default router;
