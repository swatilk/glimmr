import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'redis';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// CRITICAL: CORS MUST BE CONFIGURED BEFORE OTHER MIDDLEWARE
// ========================================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight for 10 minutes
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parsing middleware (AFTER CORS)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ========================================
// DATABASE CONNECTIONS
// ========================================

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    console.log('⚠️  Make sure MongoDB is running:');
    console.log('   docker ps | grep mongo');
    console.log('   If not running: docker start glimmr-mongodb');
  });

// Connect to Redis
let redisClient;
try {
  redisClient = createClient({
    url: process.env.REDIS_URL
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
  });
  
  redisClient.on('connect', () => {
    console.log('✅ Redis Connected');
  });

  await redisClient.connect();
} catch (error) {
  console.error('❌ Redis Connection Error:', error.message);
  console.log('⚠️  Make sure Redis is running:');
  console.log('   docker ps | grep redis');
  console.log('   If not running: docker start glimmr-redis');
}

// Export Redis client
export { redisClient };

// ========================================
// ROUTES
// ========================================

// Health check endpoint (NO AUTH REQUIRED)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '🎉 Glimmr Backend is Running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isOpen ? 'connected' : 'disconnected'
    }
  });
});

// Import routes
import authRoutes from './routes/auth.js';
import analysisRoutes from './routes/analysis.js';
import recommendationRoutes from './routes/recommendations.js';
import userRoutes from './routes/user.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/user', userRoutes);

// ========================================
// ERROR HANDLERS
// ========================================

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/health'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 Glimmr Backend Server Started Successfully!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📡 API Server:    http://localhost:${PORT}`);
  console.log(`🏥 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth Endpoint: http://localhost:${PORT}/api/auth/*`);
  console.log(`🌍 Environment:   ${process.env.NODE_ENV}`);
  console.log(`✅ CORS Enabled:  localhost:3000, localhost:3001`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📚 Available Routes:');
  console.log('  POST /api/auth/register  - Register new user');
  console.log('  POST /api/auth/login     - Login user');
  console.log('  GET  /api/auth/me        - Get current user');
  console.log('  GET  /api/health         - Health check');
  console.log('');
  console.log('🔍 Watching for requests...');
  console.log('');
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  if (redisClient) {
    await redisClient.quit();
    console.log('✅ Redis connection closed');
  }
  
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  
  process.exit(0);
});