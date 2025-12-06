// Machine Learning Prediction Routes
import express from 'express';
import { mlVulnerabilityPredictor } from '../../services/mlVulnerabilityPredictor.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/ml/predict
 * @desc    Predict vulnerability risk for code
 * @access  Private
 */
router.post('/predict', authenticate, async (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prediction = await mlVulnerabilityPredictor.predict(code);
    
    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ml/train
 * @desc    Train ML model with new data (admin only)
 * @access  Private (Admin)
 */
router.post('/train', authenticate, async (req, res, next) => {
  try {
    const { trainingData } = req.body;
    
    // Check if user is admin
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!trainingData || !Array.isArray(trainingData)) {
      return res.status(400).json({ error: 'Valid training data is required' });
    }

    await mlVulnerabilityPredictor.train(trainingData);
    
    res.json({
      success: true,
      message: 'Model trained successfully',
      samplesCount: trainingData.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ml/status
 * @desc    Get ML model status
 * @access  Private
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    // Return model info
    res.json({
      success: true,
      model: {
        type: 'TensorFlow.js Neural Network',
        inputFeatures: 8,
        outputClasses: 2,
        status: 'ready'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
