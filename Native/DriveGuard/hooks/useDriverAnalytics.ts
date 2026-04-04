import { useState, useEffect } from 'react';
import apiClient from '../services/api';

/**
 * Driver Analytics Interface
 */
export interface DriverAnalytics {
  driverId: string;
  driverName: string;
  totalSessions: number;
  averageSafetyScore: number;
  totalDutyHours: number;
  totalDutyMinutes: number;
  totalDistanceCovered: number;
  totalAlerts: number;
  perfectPerformanceSessions: number;
  perfectPerformancePercentage: number;
  performanceRating: number;
  recentPerformance: Array<{
    date: string;
    safetyScore: number;
    alerts: number;
    duration?: number;
    distance?: number;
    status: string;
  }>;
  safetyTrend: Array<{
    date: string;
    score: number;
  }>;
  lastSessionDate: string | null;
}

interface UseDriverAnalyticsReturn {
  analytics: DriverAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage driver analytics
 * @param driverId - The ID of the driver to fetch analytics for
 * @param ownerId - The owner ID for authorization
 * @returns {UseDriverAnalyticsReturn} Analytics data, loading state, error, and refetch function
 */
export function useDriverAnalytics(driverId: string, ownerId?: string): UseDriverAnalyticsReturn {
  const [analytics, setAnalytics] = useState<DriverAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!driverId) {
      setError('Driver ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (ownerId) {
        params.ownerId = ownerId;
      }

      const response = await apiClient.get(`/api/drivers/${driverId}/analytics`, { params });

      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch analytics');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch driver analytics';
      setError(errorMsg);
      console.error('❌ useDriverAnalytics error:', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch analytics when driverId changes
  useEffect(() => {
    if (driverId) {
      fetchAnalytics();
    }
  }, [driverId]);

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}
