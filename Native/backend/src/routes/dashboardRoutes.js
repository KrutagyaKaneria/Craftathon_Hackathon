/**
 * Dashboard Routes
 * API endpoints for dashboard data and alerts
 */

import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import {
  getDashboardData,
  getMetrics,
  getAlerts,
  acknowledgeAlert,
} from '../controllers/dashboardController.js';

const router = express.Router();

// Protect all dashboard routes with authentication for owner-based multi-tenant access
router.use(verifyAuth);

/**
 * GET /api/dashboard
 * Fetch complete dashboard data (metrics + alerts)
 */
router.get('/', getDashboardData);

/**
 * GET /api/dashboard/metrics
 * Fetch only metrics data
 * Query params:
 *   - none
 */
router.get('/metrics', getMetrics);

/**
 * GET /api/dashboard/alerts
 * Fetch alerts list
 * Query params:
 *   - limit: number of alerts to return (default: 5)
 */
router.get('/alerts', getAlerts);

/**
 * POST /api/dashboard/alerts/:alertId/acknowledge
 * Mark an alert as acknowledged/resolved
 */
router.post('/alerts/:alertId/acknowledge', acknowledgeAlert);

export default router;
