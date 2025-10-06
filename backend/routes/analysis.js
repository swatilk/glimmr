// import express from 'express';
// import { authenticate } from '../middleware/auth.js';
// import { formatResponse } from '../utils/helpers.js';

// const router = express.Router();

// // Placeholder for photo analysis
// router.post('/outfit', authenticate, async (req, res) => {
//   res.json(
//     formatResponse(false, null, 'Photo analysis coming soon - AI services need to be configured')
//   );
// });

// router.get('/history', authenticate, async (req, res) => {
//   res.json(
//     formatResponse(true, { sessions: [], pagination: {} }, 'History endpoint working')
//   );
// });

// export default router;


import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { formatResponse, generateSessionId } from '../utils/helpers.js';
import StyleSession from '../models/StyleSession.js';  // ← DEFAULT IMPORT
import User from '../models/User.js';

const router = express.Router();

// Analyze outfit
router.post('/outfit', authenticate, async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user._id;

    if (!image) {
      return res.status(400).json(
        formatResponse(false, null, 'Image is required')
      );
    }

    console.log('📸 Received image analysis request from user:', userId);

    // Generate session ID
    const sessionId = generateSessionId();

    // Mock analysis for now (until AI services are configured)
    const mockAnalysis = {
      colorPalette: {
        primary: ['#FF6B6B', '#4ECDC4'],
        secondary: ['#45B7D1', '#F9CA24'],
        accent: ['#FFA07A', '#98D8C8']
      },
      styleClassification: 'casual',
      neckline: 'v-neck',
      fabric: 'cotton',
      aesthetic: 'modern',
      skinTone: 'warm',
      occasion: 'date',
      confidence: 75
    };

    // Save session to database
    const session = new StyleSession({
      sessionId,
      userId,
      originalImage: {
        url: 'data:image/jpeg;base64,...', // You would save the actual image here
        metadata: {
          size: image.length,
          format: 'jpeg'
        }
      },
      analysis: mockAnalysis
    });

    await session.save();

    // Update user usage
    await User.findByIdAndUpdate(userId, {
      $inc: { 'usage.analysesThisMonth': 1 }
    });

    console.log('✅ Analysis completed, session created:', sessionId);

    res.json(
      formatResponse(true, {
        sessionId,
        analysis: mockAnalysis
      }, 'Analysis completed (using mock data - configure AI services for real analysis)')
    );

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Analysis failed', error.message)
    );
  }
});

// Get analysis history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.user._id;

    const sessions = await StyleSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-originalImage'); // Don't send image data

    const total = await StyleSession.countDocuments({ userId });

    res.json(
      formatResponse(true, {
        sessions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          hasNext: parseInt(page) * parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      })
    );
  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to fetch history', error.message)
    );
  }
});

// Get specific session
router.get('/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await StyleSession.findOne({ sessionId, userId });
    
    if (!session) {
      return res.status(404).json(
        formatResponse(false, null, 'Session not found')
      );
    }

    res.json(formatResponse(true, session));
  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to fetch session', error.message)
    );
  }
});

export default router;