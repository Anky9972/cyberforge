// Fuzzing Routes (Distributed & Parallel)
import express from 'express';
import { distributedFuzzingService } from '../../services/distributedFuzzingService.js';
import { parallelFuzzingEngine } from '../../services/parallelFuzzingEngine.js';
import { lruCorpusManager } from '../../services/lruCorpusManager.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/fuzzing/start
 * @desc    Start distributed fuzzing job
 * @access  Private
 */
router.post('/start', authenticate, async (req, res, next) => {
  try {
    const { targetId, code, language, seeds, options } = req.body;
    
    if (!targetId || !code || !language) {
      return res.status(400).json({ error: 'targetId, code, and language are required' });
    }

    const jobId = await distributedFuzzingService.addFuzzJob({
      targetId,
      code,
      language,
      seeds: seeds || [],
      options: options || {}
    });

    res.json({
      success: true,
      jobId,
      message: 'Fuzzing job queued successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/fuzzing/status/:jobId
 * @desc    Get fuzzing job status
 * @access  Private
 */
router.get('/status/:jobId', authenticate, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const status = await distributedFuzzingService.getJobStatus(jobId);
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/fuzzing/parallel
 * @desc    Start parallel fuzzing (local worker threads)
 * @access  Private
 */
router.post('/parallel', authenticate, async (req, res, next) => {
  try {
    const { targets } = req.body;
    
    if (!targets || !Array.isArray(targets)) {
      return res.status(400).json({ error: 'targets array is required' });
    }

    await parallelFuzzingEngine.initialize();
    parallelFuzzingEngine.addTargets(targets);
    
    const sessionId = `session-${Date.now()}`;
    
    // Start fuzzing in background
    parallelFuzzingEngine.start().catch(error => {
      console.error('Parallel fuzzing error:', error);
    });

    res.json({
      success: true,
      sessionId,
      message: 'Parallel fuzzing started',
      workers: parallelFuzzingEngine['workerCount']
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/fuzzing/corpus/stats
 * @desc    Get corpus manager statistics
 * @access  Private
 */
router.get('/corpus/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await lruCorpusManager.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/fuzzing/corpus/add
 * @desc    Add seed to corpus
 * @access  Private
 */
router.post('/corpus/add', authenticate, async (req, res, next) => {
  try {
    const { input, coverage } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'input is required' });
    }

    const seedId = await lruCorpusManager.addSeed({
      input,
      coverage: coverage || []
    });

    res.json({
      success: true,
      seedId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/fuzzing/corpus/top
 * @desc    Get top performing seeds
 * @access  Private
 */
router.get('/corpus/top', authenticate, async (req, res, next) => {
  try {
    const count = parseInt(req.query.count as string) || 100;
    const seeds = await lruCorpusManager.getTopSeeds(count);
    
    res.json({
      success: true,
      count: seeds.length,
      seeds
    });
  } catch (error) {
    next(error);
  }
});

export default router;
