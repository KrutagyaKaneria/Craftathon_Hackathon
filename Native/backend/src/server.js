import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import { connectDB } from './config/database.js';
import { validateDatabaseSetup, isDatabaseReadyForSessions } from './utils/databaseValidator.js';

import http from 'http';
import { initSocket } from './utils/socketHandler.js';
import { startVehicleAutoReleaseTimer } from './utils/vehicleAutoRelease.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

// Middleware
// 🔒 CORS Configuration - Restrict to known origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like native mobile apps or server-to-server)
    if (!origin) return callback(null, true);
    
    // Define allowed origins for CORS
    const allowedOrigins = [
      // Frontend URLs
      'http://localhost:3000',    // React dev
      'http://localhost:5173',    // Vite dev
      'http://localhost:8081',    // Expo web
      'http://localhost:19000',   // Expo dev
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:19000',
    ];
    
    // Allow local network IPs for mobile testing
    const isLocalOrNetwork = 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.includes('192.168.') ||
      origin.includes('10.');
    
    // Allow production URLs via environment variable
    const prodUrl = process.env.FRONTEND_URL;
    if (prodUrl && origin.includes(prodUrl)) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || (isLocalOrNetwork && process.env.NODE_ENV !== 'production')) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase body size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/alerts', alertRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
});

// Test alert endpoint - for development/debugging
app.get('/api/test-alert/:ownerId', (req, res) => {
  try {
    const { ownerId } = req.params;
    
    if (!ownerId) {
      return res.status(400).json({ success: false, message: 'Owner ID required' });
    }

    const testAlert = {
      type: 'eye_closure',
      event: 'Eyes Closed - Test Alert',
      severity: 'high',
      status: 'active',
      timestamp: new Date().toISOString(),
      driver_id: 'test-driver',
      session_id: 'test-session',
      driver_name: 'Test Driver',
      vehicle_number: 'TEST-001',
      data: {
        eyeClosureDuration: '3 seconds'
      }
    };

    console.log(`🧪 TEST: Emitting test alert to owner:${ownerId}`);
    io.to(`owner:${ownerId}`).emit('new_alert', testAlert);

    return res.status(200).json({
      success: true,
      message: 'Test alert emitted',
      alert: testAlert,
      room: `owner:${ownerId}`
    });
  } catch (error) {
    console.error('❌ Test alert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to emit test alert',
      error: error.message
    });
  }
});

// Test analytics endpoint - for development/debugging
app.get('/api/test-analytics/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const ownerId = req.query.ownerId || '69cfd750239cb96c7844acb5';

    if (!driverId) {
      return res.status(400).json({ success: false, message: 'Driver ID required' });
    }

    // Import Session model here to avoid circular dependency
    const { Session } = await import('./models/Session.js');
    const { Driver } = await import('./models/Driver.js');

    // Get driver info
    const driver = await Driver.findById(driverId).select('-password');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Generate sample session data for testing if no sessions exist
    const existingSessions = await Session.find({ driverId }).lean();

    if (existingSessions.length === 0) {
      console.log('📊 TEST: Generating sample session data for driver:', driverId);
      
      // Generate 5 sample sessions for the past 7 days
      const sampleSessions = [];
      for (let i = 0; i < 5; i++) {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - (6 - i));
        startTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0);

        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + (2 + Math.random() * 4)); // 2-6 hour sessions

        const safetyScore = 70 + Math.floor(Math.random() * 31); // 70-100
        const alertsCount = Math.floor(Math.random() * 5); // 0-4 alerts

        const session = new Session({
          ownerId,
          driverId,
          driverName: `${driver.firstName} ${driver.lastName}`,
          vehicleNumber: `TEST-VEH-${i + 1}`,
          vehicleModel: 'Test Vehicle',
          status: 'ended',
          startTime,
          endTime,
          duration: Math.floor((endTime - startTime) / (1000 * 60)), // in minutes
          distanceCovered: 50 + Math.random() * 200, // 50-250 km
          maxAcceleration: 5 + Math.random() * 3, // 5-8 m/s²
          avgSpeed: 60 + Math.random() * 30, // 60-90 km/h
          maxSpeed: 100 + Math.random() * 30, // 100-130 km/h
          safetyScore,
          alertsCount,
        });

        await session.save();
        sampleSessions.push(session);
      }

      console.log(`✅ TEST: Generated ${sampleSessions.length} sample sessions for driver ${driverId}`);
    }

    // Fetch updated sessions
    const sessions = await Session.find({ driverId }).sort({ startTime: -1 }).lean();

    // Calculate analytics
    let totalSafetyScore = 0;
    let totalDutyMinutes = 0;
    let totalAlerts = 0;
    let perfectPerformanceSessions = 0;

    sessions.forEach((session) => {
      totalSafetyScore += session.safetyScore || 100;
      totalDutyMinutes += session.duration || 0;
      totalAlerts += session.alertsCount || 0;

      if ((session.alertsCount === 0 || !session.alertsCount) && (session.safetyScore || 100) > 90) {
        perfectPerformanceSessions += 1;
      }
    });

    const averageSafetyScore = Math.round(totalSafetyScore / sessions.length);
    const totalDutyHours = (totalDutyMinutes / 60).toFixed(2);
    const perfectPerformancePercentage = Math.round((perfectPerformanceSessions / sessions.length) * 100);

    const safetyComponent = (averageSafetyScore / 100) * 3.5;
    const perfectionComponent = (perfectPerformancePercentage / 100) * 1.0;
    const alertComponent = Math.max(0, 0.5 - (Math.min(totalAlerts, 50) / 100));
    const performanceRating = Math.min(5.0, safetyComponent + perfectionComponent + alertComponent).toFixed(1);

    console.log(`📊 TEST: Analytics calculated for driver ${driverId}:`);
    console.log(`   Sessions: ${sessions.length}`);
    console.log(`   Avg Safety: ${averageSafetyScore}%`);
    console.log(`   Total Duty: ${totalDutyHours}h`);
    console.log(`   Rating: ${performanceRating}/5.0`);

    return res.status(200).json({
      success: true,
      message: 'Analytics calculated',
      data: {
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        totalSessions: sessions.length,
        averageSafetyScore,
        totalDutyHours: parseFloat(totalDutyHours),
        totalDutyMinutes,
        totalAlerts,
        perfectPerformanceSessions,
        perfectPerformancePercentage,
        performanceRating: parseFloat(performanceRating),
        sessions: sessions.slice(0, 3), // Show last 3 sessions
      }
    });
  } catch (error) {
    console.error('❌ Test analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate analytics',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  
  // Database validation will be performed before each session creation
  // rather than at startup, to give MongoDB time to fully initialize
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB connected - Database validation will run on session creation');
  } else {
    console.warn('⚠️  MongoDB connection in progress - Database validation will run on session creation');
  }
  console.log('');
  
  // Start vehicle auto-release timer
  await startVehicleAutoReleaseTimer();
  
  console.log(`📝 API Documentation:`);
  console.log(`   Authentication:`);
  console.log(`   POST /api/auth/signup`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/refresh`);
  console.log(`   Dashboard:`);
  console.log(`   GET /api/dashboard (all data)`);
  console.log(`   GET /api/dashboard/metrics (metrics only)`);
  console.log(`   GET /api/dashboard/alerts (alerts only)`);
  console.log(`   POST /api/dashboard/alerts/:alertId/acknowledge`);
  console.log(`   Vehicles:`);
  console.log(`   GET /api/vehicles (list all)`);
  console.log(`   GET /api/vehicles/:id (get one)`);
  console.log(`   GET /api/vehicles/status/:status (filter by status)`);
  console.log(`   POST /api/vehicles (create)`);
  console.log(`   PUT /api/vehicles/:id (update)`);
  console.log(`   DELETE /api/vehicles/:id (delete)`);
  console.log(`   Drivers:`);
  console.log(`   GET /api/drivers (list all)`);
  console.log(`   GET /api/drivers/:id (get one)`);
  console.log(`   POST /api/drivers (create)`);
  console.log(`   PUT /api/drivers/:id (update)`);
  console.log(`   DELETE /api/drivers/:id (delete)`);
  console.log(`   Health:`);
  console.log(`   GET /api/health`);
});

export default app;
