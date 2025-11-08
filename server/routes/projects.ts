// Project Routes - Manage analysis projects
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { auditLog } from '../middleware/logger.js';

const router = express.Router();

/**
 * GET /api/projects
 * List user's projects
 */
router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { scans: true }
        }
      }
    });

    res.json({ projects });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { name, description, repoUrl, language, framework } = req.body;

  if (!name) {
    throw new AppError('Project name is required', 400);
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        repoUrl,
        language,
        framework,
        userId: req.user.userId,
      }
    });

    await auditLog('PROJECT_CREATE', 'project', project.id, req.user.userId, { name }, req);

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * GET /api/projects/:id
 * Get project details
 */
router.get('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.json({ project });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { name, description, repoUrl, language, framework } = req.body;
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name || existingProject.name,
        description,
        repoUrl,
        language,
        framework,
      }
    });

    await auditLog('PROJECT_UPDATE', 'project', project.id, req.user.userId, { name }, req);

    res.json({
      message: 'Project updated successfully',
      project
    });
  } finally {
    await prisma.$disconnect();
  }
}));

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await prisma.project.delete({
      where: { id: req.params.id }
    });

    await auditLog('PROJECT_DELETE', 'project', req.params.id, req.user.userId, null, req);

    res.json({ message: 'Project deleted successfully' });
  } finally {
    await prisma.$disconnect();
  }
}));

export default router;
