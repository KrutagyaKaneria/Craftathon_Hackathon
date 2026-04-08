/**
 * AI Service Health Check Utility
 * Ensures AI-Service is ready before accepting session creation requests
 */

import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const HEALTH_CHECK_TIMEOUT = 3000; // 3 seconds

let lastHealthCheckTime = 0;
let lastHealthCheckStatus = false;
const CACHE_DURATION = 10000; // Cache health status for 10 seconds

/**
 * Check if AI-Service is ready to handle requests
 * Includes caching to avoid excessive health checks
 */
export const isAIServiceReady = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached result if available and not stale
  if (!forceRefresh && now - lastHealthCheckTime < CACHE_DURATION && lastHealthCheckStatus) {
    return true;
  }

  try {
    console.log(`🔍 Checking AI-Service health at ${AI_SERVICE_URL}/health...`);
    
    const response = await axios.get(
      `${AI_SERVICE_URL}/health`,
      { timeout: HEALTH_CHECK_TIMEOUT }
    );

    const isReady = response.status === 200 && response.data?.status === 'ok';
    
    if (isReady) {
      console.log('✅ AI-Service is ready');
      console.log(`   Socket connected: ${response.data.socket_connected}`);
      console.log(`   Active sessions: ${response.data.active_sessions}`);
    }

    lastHealthCheckTime = now;
    lastHealthCheckStatus = isReady;
    return isReady;

  } catch (error) {
    console.error(`❌ AI-Service health check failed: ${error.message}`);
    lastHealthCheckTime = now;
    lastHealthCheckStatus = false;
    return false;
  }
};

/**
 * Wait for AI-Service to be ready with exponential backoff
 * @param {number} maxAttempts - Maximum number of attempts (default 5)
 * @param {number} delayMs - Initial delay in milliseconds (default 500)
 */
export const waitForAIServiceReady = async (maxAttempts = 5, delayMs = 500) => {
  console.log(`⏳ Waiting for AI-Service to be ready (max ${maxAttempts} attempts)...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isReady = await isAIServiceReady(true); // Force refresh on each attempt
    
    if (isReady) {
      console.log(`✅ AI-Service ready after ${attempt} attempt(s)`);
      return true;
    }

    if (attempt < maxAttempts) {
      const waitTime = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`   Attempt ${attempt}/${maxAttempts} failed. Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.error(`❌ AI-Service did not become ready after ${maxAttempts} attempts`);
  return false;
};

export default {
  isAIServiceReady,
  waitForAIServiceReady,
};
