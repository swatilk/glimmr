// import express from 'express';
// import { authenticate } from '../middleware/auth.js';
// import { formatResponse } from '../utils/helpers.js';
// import User from '../models/User.js';
// import StyleSession from '../models/StyleSession.js';

// const router = express.Router();

// // Get user profile
// router.get('/profile', authenticate, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('-password');
//     if (!user) {
//       return res.status(404).json(
//         formatResponse(false, null, 'User not found')
//       );
//     }

//     res.json(formatResponse(true, user));
//   } catch (error) {
//     res.status(500).json(
//       formatResponse(false, null, 'Failed to fetch profile', error.message)
//     );
//   }
// });

// // Update user profile
// router.put('/profile', authenticate, async (req, res) => {
//   try {
//     const {
//       name,
//       avatar,
//       skinTone,
//       preferences,
//     } = req.body;

//     const updateData = {};
//     if (name) updateData['profile.name'] = name;
//     if (avatar) updateData['profile.avatar'] = avatar;
//     if (skinTone) updateData['profile.skinTone'] = skinTone;
//     if (preferences) {
//       Object.keys(preferences).forEach(key => {
//         updateData[`profile.preferences.${key}`] = preferences[key];
//       });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     ).select('-password');

//     res.json(
//       formatResponse(true, user, 'Profile updated successfully')
//     );
//   } catch (error) {
//     res.status(400).json(
//       formatResponse(false, null, 'Failed to update profile', error.message)
//     );
//   }
// });

// // Get user usage statistics
// router.get('/usage', authenticate, async (req, res) => {
//   try {
//     const user = req.user;
//     await user.resetMonthlyUsage();

//     const limits = {
//       free: 10,
//       premium: 100,
//       professional: 1000
//     };

//     const usage = {
//       plan: user.subscription.plan,
//       analysesThisMonth: user.usage.analysesThisMonth,
//       analysesLimit: limits[user.subscription.plan],
//       analysesRemaining: Math.max(0, limits[user.subscription.plan] - user.usage.analysesThisMonth),
//       resetDate: user.usage.lastResetDate
//     };

//     res.json(formatResponse(true, usage));
//   } catch (error) {
//     res.status(500).json(
//       formatResponse(false, null, 'Failed to fetch usage', error.message)
//     );
//   }
// });

// // Add to favorites
// router.post('/favorites/:type', authenticate, async (req, res) => {
//   try {
//     const { type } = req.params; // 'looks', 'products', 'nailDesigns', 'hennaPatterns'
//     const { item } = req.body;

//     const validTypes = ['looks', 'products', 'nailDesigns', 'hennaPatterns'];
//     if (!validTypes.includes(type)) {
//       return res.status(400).json(
//         formatResponse(false, null, 'Invalid favorite type')
//       );
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { $addToSet: { [`favorites.${type}`]: item } },
//       { new: true }
//     ).select('-password');

//     res.json(
//       formatResponse(true, user.favorites, 'Added to favorites successfully')
//     );
//   } catch (error) {
//     res.status(400).json(
//       formatResponse(false, null, 'Failed to add to favorites', error.message)
//     );
//   }
// });

// // Remove from favorites
// router.delete('/favorites/:type/:itemId', authenticate, async (req, res) => {
//   try {
//     const { type, itemId } = req.params;

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { $pull: { [`favorites.${type}`]: { id: itemId } } },
//       { new: true }
//     ).select('-password');

//     res.json(
//       formatResponse(true, user.favorites, 'Removed from favorites successfully')
//     );
//   } catch (error) {
//     res.status(400).json(
//       formatResponse(false, null, 'Failed to remove from favorites', error.message)
//     );
//   }
// });

// // Get favorites
// router.get('/favorites', authenticate, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('favorites');
//     res.json(formatResponse(true, user.favorites));
//   } catch (error) {
//     res.status(500).json(
//       formatResponse(false, null, 'Failed to fetch favorites', error.message)
//     );
//   }
// });

// // Update user feedback for a session
// router.post('/feedback/:sessionId', authenticate, async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const { rating, comments, helpful, liked, implemented } = req.body;

//     const session = await StyleSession.findOneAndUpdate(
//       { sessionId, userId: req.user._id },
//       {
//         $set: {
//           'userInteraction.feedback': {
//             rating,
//             comments,
//             helpful
//           },
//           'userInteraction.liked': liked,
//           'userInteraction.implemented': implemented
//         }
//       },
//       { new: true }
//     );

//     if (!session) {
//       return res.status(404).json(
//         formatResponse(false, null, 'Session not found')
//       );
//     }

//     res.json(
//       formatResponse(true, session.userInteraction, 'Feedback saved successfully')
//     );
//   } catch (error) {
//     res.status(400).json(
//       formatResponse(false, null, 'Failed to save feedback', error.message)
//     );
//   }
// });

// // Delete user account
// router.delete('/account', authenticate, async (req, res) => {
//   try {
//     // Delete all user sessions
//     await StyleSession.deleteMany({ userId: req.user._id });
    
//     // Delete user account
//     await User.findByIdAndDelete(req.user._id);

//     res.json(
//       formatResponse(true, null, 'Account deleted successfully')
//     );
//   } catch (error) {
//     res.status(500).json(
//       formatResponse(false, null, 'Failed to delete account', error.message)
//     );
//   }
// });

// export default router;

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { formatResponse } from '../utils/helpers.js';
import User from '../models/User.js';  // ← DEFAULT IMPORT
import StyleSession from '../models/StyleSession.js';  // ← DEFAULT IMPORT

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json(
        formatResponse(false, null, 'User not found')
      );
    }

    res.json(formatResponse(true, user));
  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to fetch profile', error.message)
    );
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, avatar, skinTone, preferences } = req.body;

    const updateData = {};
    if (name) updateData['profile.name'] = name;
    if (avatar) updateData['profile.avatar'] = avatar;
    if (skinTone) updateData['profile.skinTone'] = skinTone;
    if (preferences) {
      Object.keys(preferences).forEach(key => {
        updateData[`profile.preferences.${key}`] = preferences[key];
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(
      formatResponse(true, user, 'Profile updated successfully')
    );
  } catch (error) {
    res.status(400).json(
      formatResponse(false, null, 'Failed to update profile', error.message)
    );
  }
});

// Get user usage statistics
router.get('/usage', authenticate, async (req, res) => {
  try {
    const user = req.user;

    const limits = {
      free: 10,
      premium: 100,
      professional: 1000
    };

    const usage = {
      plan: user.subscription.plan,
      analysesThisMonth: user.usage.analysesThisMonth,
      analysesLimit: limits[user.subscription.plan],
      analysesRemaining: Math.max(0, limits[user.subscription.plan] - user.usage.analysesThisMonth),
      resetDate: user.usage.lastResetDate
    };

    res.json(formatResponse(true, usage));
  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to fetch usage', error.message)
    );
  }
});

// Get favorites
router.get('/favorites', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('favorites');
    res.json(formatResponse(true, user.favorites || {}));
  } catch (error) {
    res.status(500).json(
      formatResponse(false, null, 'Failed to fetch favorites', error.message)
    );
  }
});

export default router;