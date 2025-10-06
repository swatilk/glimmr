import mongoose from 'mongoose';

const StyleSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  originalImage: {
    url: String,
    publicId: String,
    metadata: {
      size: Number,
      format: String,
      width: Number,
      height: Number
    }
  },
  analysis: {
    colorPalette: {
      primary: [String],
      secondary: [String],
      accent: [String]
    },
    styleClassification: String,
    neckline: String,
    fabric: String,
    aesthetic: String,
    skinTone: String,
    occasion: String,
    confidence: Number
  },
  recommendations: {
    jewelry: {
      necklace: mongoose.Schema.Types.Mixed,
      earrings: mongoose.Schema.Types.Mixed,
      bracelets: mongoose.Schema.Types.Mixed,
      rings: mongoose.Schema.Types.Mixed
    },
    makeup: {
      foundation: mongoose.Schema.Types.Mixed,
      eyes: mongoose.Schema.Types.Mixed,
      lips: mongoose.Schema.Types.Mixed,
      blush: mongoose.Schema.Types.Mixed
    },
    hair: {
      styles: [mongoose.Schema.Types.Mixed],
      accessories: [mongoose.Schema.Types.Mixed]
    },
    nails: {
      colors: [String],
      designs: [String],
      length: String,
      artStyle: String,
      shape: String,
      generatedImages: [String]
    },
    henna: {
      complexity: String,
      style: String,
      placement: [String],
      patterns: [String],
      cultural: String,
      generatedImages: [String]
    }
  },
  productMatches: [{
    type: String,
    category: String,
    products: [mongoose.Schema.Types.Mixed]
  }],
  userInteraction: {
    viewed: {
      type: Date,
      default: Date.now
    },
    liked: Boolean,
    saved: Boolean,
    shared: Boolean,
    feedback: {
      rating: Number,
      comments: String,
      helpful: Boolean
    }
  }
}, {
  timestamps: true
});

// Add indexes for better performance
StyleSessionSchema.index({ userId: 1 });
StyleSessionSchema.index({ sessionId: 1 });
StyleSessionSchema.index({ createdAt: -1 });

// IMPORTANT: Use default export
export default mongoose.model('StyleSession', StyleSessionSchema);