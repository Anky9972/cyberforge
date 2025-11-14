// CyberForge Backend API Server (TypeScript)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// Import middleware
import { httpLogger, logger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import scanRoutes from './routes/scans.js';
import vulnerabilityRoutes from './routes/vulnerabilities.js';
import scanMetricsRoutes from './routes/scanMetrics.js';

// Import services
import { aiService } from '../services/aiProviderService.js';

// Load environment variables from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const prisma = new PrismaClient();

// ===== MIDDLEWARE =====

// Security
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://shashwat-srivastav.github.io'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.github.io')) {
      callback(null, true);
    } else {
      logger.warn('Blocked CORS request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(httpLogger);

// Rate limiting (global)
if (process.env.RATE_LIMIT_ENABLED !== 'false') {
  app.use('/api/', apiRateLimiter);
}

// ===== ROUTES =====

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: prisma ? 'connected' : 'disconnected',
    aiProviders: aiService.getAvailableProviders(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: process.env.APP_NAME || 'CyberForge API',
    version: process.env.APP_VERSION || '2.0.0',
    status: 'running',
    documentation: process.env.ENABLE_SWAGGER === 'true' ? '/api-docs' : undefined,
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      analyze: '/api/analyze',
      projects: '/api/projects (authenticated)',
      scans: '/api/scans (authenticated)',
      vulnerabilities: '/api/vulnerabilities (authenticated)',
      scanMetrics: '/api/scan-metrics (authenticated)',
    }
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Project routes (requires authentication)
app.use('/api/projects', projectRoutes);

// Scan routes (requires authentication)
app.use('/api/scans', scanRoutes);

// Vulnerability routes (requires authentication)
app.use('/api/vulnerabilities', vulnerabilityRoutes);

// Scan metrics routes (requires authentication)
app.use('/api/scan-metrics', scanMetricsRoutes);

// Legacy analysis endpoint (backward compatible)
app.post('/api/analyze', async (req, res) => {
  try {
    const { systemPrompt, userPrompt, responseFormat, provider } = req.body;

    // If a specific provider is requested, validate it's available to avoid runtime errors
    if (provider) {
      const available = aiService.getAvailableProviders();
      if (!available.includes(provider)) {
        return res.status(400).json({ error: `Requested AI provider '${provider}' is not configured. Available providers: ${available.join(', ') || 'none'}` });
      }
    }

    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'systemPrompt and userPrompt are required' });
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const config = {
      provider,
      responseFormat: responseFormat === 'json' ? 'json' as const : 'text' as const,
    };

    const response = await aiService.chat(messages, config);

    res.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
      usage: response.usage
    });
  } catch (error: any) {
    logger.error('Analysis endpoint error', { error: error.message });
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait a moment and try again.' 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Analysis failed' 
    });
  }
});

// ===== ERROR HANDLING =====

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===== DATABASE CONNECTION =====

async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error: any) {
    logger.error('Database connection failed', { error: error.message });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// ===== SERVER STARTUP =====

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(PORT, HOST, () => {
      logger.info('Server started successfully', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
      });

      console.log('');
      console.log('🚀 CyberForge API Server');
      console.log('========================');
      console.log(`🌐 Server: http://${HOST}:${PORT}`);
      console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`🔐 Auth: http://${HOST}:${PORT}/api/auth`);
      console.log(`📊 Frontend: ${FRONTEND_URL}`);
      console.log('');
      console.log(`🤖 AI Providers: ${aiService.getAvailableProviders().join(', ')}`);
      console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
      console.log(`🔴 Redis: ${process.env.REDIS_URL ? 'Configured' : 'Not configured'}`);
      console.log('');
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 Log Level: ${process.env.LOG_LEVEL || 'info'}`);
      console.log('========================');
      console.log('✅ Server ready!');
      console.log('');
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// ===== GRACEFUL SHUTDOWN =====

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// ===== START =====

startServer();

export default app;
