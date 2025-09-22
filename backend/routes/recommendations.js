import express from 'express';
import { authenticate, checkSubscription } from '../middleware/auth.js';
import { getStyleRecommendations } from '../services/styleRecommendations.js';
import { generateNailArt, generateHennaDesign, generateMoodboard } from '../services/imageGeneration.js';
import { getProductRecommendations } from '../services/productRecommendations.js';
import { formatResponse } from '../utils/helpers.js';
import StyleSession from '../models/StyleSession.js';
import User from '../models/User.js';

const router = express.Router();

// Generate style recommendations for a session
router.post('/:sessionId/generate', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      preferences = {}, 
      includeProducts = false, 
      includeNailArt = false, 
      includeHenna = false,
      generateMoodboardImage = false
    } = req.body;
    const userId = req.user._id;

    // Find the style session
    const session = await StyleSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json(
        formatResponse(false, null, 'Session not found')
      );
    }

    // Get user preferences (merge with request preferences)
    const user = await User.findById(userId);
    const userPrefs = {
      ...user.profile.preferences,
      ...preferences
    };

    console.log('🎨 Generating recommendations for session:', sessionId);

    // Generate style recommendations
    const recommendations = await getStyleRecommendations(session.analysis, userPrefs);

    // Generate nail art images if requested (Premium feature)
    if (includeNailArt && recommendations.nails) {
      try {
        if (user.subscription.plan === 'free') {
          return res.status(403).json(
            formatResponse(false, null, 'Nail art generation requires premium subscription')
          );
        }

        const nailPrompt = `${recommendations.nails.artStyle} nail design in ${recommendations.nails.colors.join(', ')} colors, ${recommendations.nails.shape} shape, ${recommendations.nails.length} length`;
        const nailImages = await generateNailArt(nailPrompt, 'realistic', recommendations.nails.colors);
        
        if (nailImages) {
          recommendations.nails.generatedImages = Array.isArray(nailImages) ? nailImages : [nailImages];
        }
      } catch (error) {
        console.error('Nail art generation failed:', error);
        recommendations.nails.generatedImages = [];
      }
    }

    // Generate henna designs if requested (Premium feature)
    if (includeHenna && recommendations.henna) {
      try {
        if (user.subscription.plan === 'free') {
          return res.status(403).json(
            formatResponse(false, null, 'Henna design generation requires premium subscription')
          );
        }

        const hennaImages = await generateHennaDesign(
          'hands', 
          recommendations.henna.style, 
          recommendations.henna.complexity,
          recommendations.henna.cultural
        );
        
        if (hennaImages) {
          recommendations.henna.generatedImages = Array.isArray(hennaImages) ? hennaImages : [hennaImages];
        }
      } catch (error) {
        console.error('Henna generation failed:', error);
        recommendations.henna.generatedImages = [];
      }
    }

    // Generate moodboard if requested (Professional feature)
    let moodboardUrl = null;
    if (generateMoodboardImage) {
      if (user.subscription.plan !== 'professional') {
        return res.status(403).json(
          formatResponse(false, null, 'Moodboard generation requires professional subscription')
        );
      }

      try {
        moodboardUrl = await generateMoodboard(recommendations, session.analysis);
      } catch (error) {
        console.error('Moodboard generation failed:', error);
      }
    }

    // Get product recommendations if requested
    let productMatches = [];
    if (includeProducts) {
      try {
        productMatches = await getProductRecommendations(recommendations, session.analysis);
      } catch (error) {
        console.error('Product recommendations failed:', error);
      }
    }

    // Update session with recommendations
    session.recommendations = recommendations;
    session.productMatches = productMatches;
    if (moodboardUrl) {
      session.moodboardUrl = moodboardUrl;
    }
    await session.save();

    const responseData = {
      sessionId,
      recommendations,
      ...(includeProducts && { productMatches }),
      ...(moodboardUrl && { moodboardUrl })
    };

    res.json(
      formatResponse(true, responseData, 'Recommendations generated successfully')
    );

  } catch (error) {
    console.error('Recommendation generation error:', error);
    res.status(500).json(
      formatResponse(false, null, 'Failed to generate recommendations', error.message)
    );
  }
});

// Regenerate specific recommendation category
router.post('/:sessionId/regenerate/:category', authenticate, async (req, res) => {
  try {
    const { sessionId, category } = req.params;
    const { preferences = {} } = req.body;
    const userId = req.user._id;

    const validCategories = ['jewelry', 'makeup', 'hair', 'nails', 'henna'];
    if (!validCategories.includes(category)) {
      return res.status(400).json(
        formatResponse(false, null, 'Invalid category')
      );
    }

    const session = await StyleSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json(
        formatResponse(false, null, 'Session not found')
      );
    }

    const user = await User.findById(userId);
    const userPrefs = { ...user.profile.preferences, ...preferences };

    // Regenerate specific category
    const newRecommendations = await getStyleRecommendations(session.analysis, userPrefs);
    
    // Update only the specific category
    if (!session.recommendations) {
      session.recommendations = {};
    }
    session.recommendations[category] = newRecommendations[category];
    
    // Handle image generation for specific categories
    if (category === 'nails' && newRecommendations.nails) {
      try {
        const nailPrompt = `${newRecommendations.nails.artStyle} nail design in ${newRecommendations.nails.colors.join(', ')} colors`;
        const nailImages = await generateNailArt(nailPrompt, 'realistic', newRecommendations.nails.colors);
        
        if (nailImages) {
          session.recommendations.nails.generatedImages = Array.isArray(nailImages) ? nailImages : [nailImages];
        }
      } catch (error) {
        console.error('Nail art regeneration failed:', error);
      }
    }

    if (category === 'henna' && newRecommendations.henna) {
      try {
        const hennaImages = await generateHennaDesign(
          'hands',
          newRecommendations.henna.style,
          newRecommendations.henna.complexity
        );
        
        if (hennaImages) {
          session.recommendations.henna.generatedImages = Array.isArray(hennaImages) ? hennaImages : [hennaImages];
        }
      } catch (error) {
        console.error('Henna regeneration failed:', error);
      }
    }

    await session.save();

    res.json(
      formatResponse(true, {
        category,
        recommendations: session.recommendations[category]
      }, `${category} recommendations regenerated successfully`)
    );

  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to regenerate recommendations', error.message)
    );
  }
});

// Get saved recommendations
router.get('/saved', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const userId = req.user._id;

    const query = { 
      userId, 
      'userInteraction.saved': true,
      recommendations: { $exists: true }
    };

    if (category) {
      query[`recommendations.${category}`] = { $exists: true };
    }

    const sessions = await StyleSession.find(query)
      .sort({ 'userInteraction.viewed': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId recommendations userInteraction createdAt');

    const total = await StyleSession.countDocuments(query);

    res.json(
      formatResponse(true, {
        sessions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      })
    );
  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to fetch saved recommendations', error.message)
    );
  }
});

// Save/unsave recommendations
router.post('/:sessionId/save', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { save = true } = req.body;
    const userId = req.user._id;

    const session = await StyleSession.findOneAndUpdate(
      { sessionId, userId },
      { $set: { 'userInteraction.saved': save } },
      { new: true }
    );

    if (!session) {
      return res.status(404).json(
        formatResponse(false, null, 'Session not found')
      );
    }

    res.json(
      formatResponse(true, { saved: save }, save ? 'Recommendations saved' : 'Recommendations unsaved')
    );
  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to save recommendations', error.message)
    );
  }
});

export default router;