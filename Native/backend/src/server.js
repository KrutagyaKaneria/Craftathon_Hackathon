import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { connectDB } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:3000',
    'exp://localhost:8081',
    '*' // Allow all origins for development
  ],
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
app.listen(PORT, () => {
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
