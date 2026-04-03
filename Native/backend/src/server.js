import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { connectDB } from './config/database.js';

import http from 'http';
import { initSocket } from './utils/socketHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches our allowed list or is a development origin
    const allowedPorts = ['8081', '3000', '5173', '19000'];
    const isLocal = origin.includes('localhost') || 
                    origin.includes('127.0.0.1') || 
                    origin.includes('192.168.');
    
    if (isLocal || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
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
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
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
