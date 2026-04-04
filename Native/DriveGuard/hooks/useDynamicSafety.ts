import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';

export interface SafetyMetrics {
  safetyScore: number; // 0-100%
  alertsCount: number; // Total alerts
  highSeverityAlerts: number;
  mediumSeverityAlerts: number;
  lowSeverityAlerts: number;
  lastAlertTime: string | null;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

interface UseDynamicSafetyReturn {
  safety: SafetyMetrics | null;
  addAlert: (driverId: string, severity: 'high' | 'medium' | 'low') => void;
  resetSafety: () => void;
}

/**
 * Calculate safety score based on alert count and severity
 * High severity: -15 points
 * Medium severity: -8 points
 * Low severity: -3 points
 * Minimum: 0%, Maximum: 100%
 */
const calculateSafetyScore = (
  highSeverity: number,
  mediumSeverity: number,
  lowSeverity: number
): number => {
  let score = 100;
  score -= highSeverity * 15;
  score -= mediumSeverity * 8;
  score -= lowSeverity * 3;

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
};

/**
 * Determine safety status based on score
 */
const getSafetyStatus = (score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'poor';
  return 'critical';
};

/**
 * Hook to track driver safety score dynamically based on real-time alerts
 * @returns {UseDynamicSafetyReturn} Current safety metrics, alert tracking methods
 */
export function useDynamicSafety(): UseDynamicSafetyReturn {
  const [safety, setSafety] = useState<SafetyMetrics>({
    safetyScore: 100,
    alertsCount: 0,
    highSeverityAlerts: 0,
    mediumSeverityAlerts: 0,
    lowSeverityAlerts: 0,
    lastAlertTime: null,
    status: 'excellent',
  });

  const alertsRef = useRef({
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    // Listen for new alerts via WebSocket
    const unsubscribe = socketService.on('new_alert', (alert) => {
      console.log('🚨 New Alert for Safety Scoring:', {
        driverId: alert.driverId,
        severity: alert.severity,
        eventType: alert.eventType,
      });

      // Increment alert count based on severity
      if (alert.severity === 'high') {
        alertsRef.current.high += 1;
      } else if (alert.severity === 'medium') {
        alertsRef.current.medium += 1;
      } else if (alert.severity === 'low') {
        alertsRef.current.low += 1;
      }

      // Calculate new safety score
      const newScore = calculateSafetyScore(
        alertsRef.current.high,
        alertsRef.current.medium,
        alertsRef.current.low
      );

      const totalAlerts = alertsRef.current.high + alertsRef.current.medium + alertsRef.current.low;

      // Update safety state
      setSafety({
        safetyScore: newScore,
        alertsCount: totalAlerts,
        highSeverityAlerts: alertsRef.current.high,
        mediumSeverityAlerts: alertsRef.current.medium,
        lowSeverityAlerts: alertsRef.current.low,
        lastAlertTime: new Date().toISOString(),
        status: getSafetyStatus(newScore),
      });

      console.log(`📊 Safety Updated: ${newScore}% (${totalAlerts} alerts - H:${alertsRef.current.high} M:${alertsRef.current.medium} L:${alertsRef.current.low})`);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const addAlert = (driverId: string, severity: 'high' | 'medium' | 'low') => {
    console.log(`➕ Adding ${severity} alert for driver ${driverId}`);

    if (severity === 'high') {
      alertsRef.current.high += 1;
    } else if (severity === 'medium') {
      alertsRef.current.medium += 1;
    } else {
      alertsRef.current.low += 1;
    }

    const newScore = calculateSafetyScore(
      alertsRef.current.high,
      alertsRef.current.medium,
      alertsRef.current.low
    );

    const totalAlerts = alertsRef.current.high + alertsRef.current.medium + alertsRef.current.low;

    setSafety({
      safetyScore: newScore,
      alertsCount: totalAlerts,
      highSeverityAlerts: alertsRef.current.high,
      mediumSeverityAlerts: alertsRef.current.medium,
      lowSeverityAlerts: alertsRef.current.low,
      lastAlertTime: new Date().toISOString(),
      status: getSafetyStatus(newScore),
    });
  };

  const resetSafety = () => {
    alertsRef.current = { high: 0, medium: 0, low: 0 };
    setSafety({
      safetyScore: 100,
      alertsCount: 0,
      highSeverityAlerts: 0,
      mediumSeverityAlerts: 0,
      lowSeverityAlerts: 0,
      lastAlertTime: null,
      status: 'excellent',
    });
    console.log('🔄 Safety metrics reset');
  };

  return {
    safety,
    addAlert,
    resetSafety,
  };
}
