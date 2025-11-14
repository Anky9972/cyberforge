// Vulnerability Routes - Manage security findings
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/vulnerabilities
 * List vulnerabilities (optionally filtered by scan)
 */
router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const { scanId, severity, status, limit = 100, offset = 0 } = req.query;

    // Build where clause
    const where: any = {};
    if (scanId) {
      // Verify user has access to this scan
      const scan = await prisma.scan.findFirst({
        where: { id: scanId as string, userId: req.user.userId }
      });
      if (!scan) {
        throw new AppError('Scan not found', 404);
      }
      where.scanId = scanId;
    } else {
      // Get all vulnerabilities from user's scans
      const userScans = await prisma.scan.findMany({
        where: { userId: req.user.userId },
        select: { id: true }
      });
      where.scanId = { in: userScans.map(s => s.id) };
    }

    if (severity) where.severity = severity;
    if (status) where.status = status;

    const vulnerabilities = await prisma.vulnerability.findMany({
      where,
      orderBy: [
        { severity: 'asc' }, // CRITICAL first
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        scan: {
          select: {
            id: true,
            project: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    const total = await prisma.vulnerability.count({ where });

    res.json({ 
      vulnerabilities, 
      total, 
      limit: parseInt(limit as string), 
      offset: parseInt(offset as string) 
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * POST /api/vulnerabilities
 * Create a new vulnerability finding
 */
router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { 
    scanId, 
    title, 
    description, 
    severity, 
    category, 
    cweId,
    cveId,
    filePath,
    lineNumber,
    vulnerableCode,
    recommendation,
    references,
    status = 'OPEN'
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

    const vulnerability = await prisma.vulnerability.create({
      data: {
        scanId,
        title,
        description,
        severity,
        category,
        cweId,
        cveId,
        filePath,
        lineNumber,
        vulnerableCode,
        recommendation,
        references,
        status,
      }
    });

    // Update scan counts
    const severityField = `${severity.toLowerCase()}Count` as 'criticalCount' | 'highCount' | 'mediumCount' | 'lowCount' | 'infoCount';
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        [severityField]: { increment: 1 }
      }
    });

    res.status(201).json({
      message: 'Vulnerability created successfully',
      vulnerability
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * GET /api/vulnerabilities/:id
 * Get vulnerability details
 */
router.get('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const vulnerability = await prisma.vulnerability.findFirst({
      where: { id: req.params.id },
      include: {
        scan: {
          include: {
            project: true,
            user: {
              select: { id: true, email: true, username: true }
            }
          }
        }
      }
    });

    if (!vulnerability) {
      throw new AppError('Vulnerability not found', 404);
    }

    // Verify user has access
    if (vulnerability.scan.userId !== req.user.userId) {
      throw new AppError('Access denied', 403);
    }

    res.json({ vulnerability });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * PUT /api/vulnerabilities/:id
 * Update vulnerability (change status, mark false positive, etc.)
 */
router.put('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { status, falsePositive, assignedTo, notes } = req.body;

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.vulnerability.findFirst({
      where: { id: req.params.id },
      include: { scan: true }
    });

    if (!existing) {
      throw new AppError('Vulnerability not found', 404);
    }

    if (existing.scan.userId !== req.user.userId) {
      throw new AppError('Access denied', 403);
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (falsePositive !== undefined) updateData.falsePositive = falsePositive;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;

    const vulnerability = await prisma.vulnerability.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      message: 'Vulnerability updated successfully',
      vulnerability
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * DELETE /api/vulnerabilities/:id
 * Delete a vulnerability finding
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.vulnerability.findFirst({
      where: { id: req.params.id },
      include: { scan: true }
    });

    if (!existing) {
      throw new AppError('Vulnerability not found', 404);
    }

    if (existing.scan.userId !== req.user.userId) {
      throw new AppError('Access denied', 403);
    }

    await prisma.vulnerability.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Vulnerability deleted successfully' });
  } finally {
    await prisma.$disconnect();
  }
}));

export default router;
