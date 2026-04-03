import apiClient from './api';

export interface DashboardAlert {
  id: string;
  type: 'driver_fatigue' | 'hard_braking' | 'route_deviation' | 'protocol_breach';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  unitId: string;
  timestamp: string;
  actionRequired?: boolean;
}

export interface DashboardData {
  totalDrivers: number;
  totalVehicles: number;
  activeDrivers: number;
  safetyRating: number;
  fleetReadiness: number;
  fuelEfficiency: number;
  recentAlerts: DashboardAlert[];
}

export const dashboardAPI = {
  // Fetch dashboard data
  getDashboard: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get('/api/dashboard');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch dashboard');
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch dashboard',
        status: error.response?.status
      };
    }
  },

  // Get dashboard metrics only
  getMetrics: async () => {
    try {
      const response = await apiClient.get('/api/dashboard/metrics');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch metrics');
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch metrics',
        status: error.response?.status
      };
    }
  },

  // Get alerts only
  getAlerts: async (limit: number = 5): Promise<DashboardAlert[]> => {
    try {
      const response = await apiClient.get(`/api/dashboard/alerts?limit=${limit}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch alerts');
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch alerts',
        status: error.response?.status
      };
    }
  },

  // Acknowledge an alert
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    try {
      const response = await apiClient.post(`/api/dashboard/alerts/${alertId}/acknowledge`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to acknowledge alert');
      }
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || error.message || 'Failed to acknowledge alert',
        status: error.response?.status
      };
    }
  },
};

export default dashboardAPI;
