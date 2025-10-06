import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    avatar: String,
    skinTone: {
      type: String,
      enum: ['warm', 'cool', 'neutral', 'unknown'],
      default: 'unknown'
    },
    preferences: {
      styleAesthetic: [{
        type: String,
        enum: ['boho', 'minimalist', 'glam', 'traditional', 'modern', 'vintage', 'edgy', 'romantic']
      }],
      budgetRange: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      culturalBackground: String,
      favoriteColors: [String],
      avoidColors: [String],
      occasions: [{
        type: String,
        enum: ['work', 'casual', 'date', 'party', 'wedding', 'festival', 'travel']
      }]
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'professional'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },
    expiresAt: Date
  },
  usage: {
    analysesThisMonth: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', UserSchema);
