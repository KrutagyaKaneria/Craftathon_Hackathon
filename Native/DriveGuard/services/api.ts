import axios from 'axios';
import { safeStorage } from '../utils/safeStorage';

// Configure backend API URL
// For LOCAL DEVELOPMENT: http://YOUR_LOCAL_IP:5000
// For PRODUCTION: https://your-backend-domain.com
// Get your local IP: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.145.246.155:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token with proper async handling
apiClient.interceptors.request.use(
  async (config) => {
    const token = await safeStorage.getItem('authToken');
    console.log('🔐 API Request Interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    console.log('📍 Request URL:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header set');
    } else {
      console.warn('⚠️ No token found in storage for this request');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors with proper async cleanup
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response successful:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      errorData: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage properly
      console.warn('⚠️ 401 Unauthorized - Token invalid or expired, clearing auth');
      await safeStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      if (response.data.success && response.data.data.token) {
        const token = response.data.data.token;
        await safeStorage.setItem('authToken', token);
        return response.data.data;
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || error.message || 'Login failed',
        status: error.response?.status
      };
    }
  },

  signup: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/signup', { email, password });
      if (response.data.success && response.data.data.token) {
        const token = response.data.data.token;
        await safeStorage.setItem('authToken', token);
        return response.data.data;
      }
      throw new Error(response.data.message || 'Signup failed');
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || error.message || 'Signup failed',
        status: error.response?.status
      };
    }
  },

  logout: async () => {
    await safeStorage.removeItem('authToken');
  },

  getProfile: async () => {
    try {
      const response = await apiClient.get('/api/auth/profile');
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to get profile',
        status: error.response?.status
      };
    }
  },

  verifyToken: async (token: string) => {
    try {
      const response = await apiClient.post('/api/auth/verify-token', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw {
        message: 'Token verification failed',
        status: error.response?.status
      };
    }
  },
};

// Sessions telemetry API calls
export const sessionsAPI = {
  updateTelemetry: async (sessionId: string, telemetryData: {
    distance?: number;
    maxAcceleration?: number;
    maxDeceleration?: number;
    avgSpeed?: number;
    maxSpeed?: number;
    telemetrySnapshot?: {
      distance: number;
      speed: number;
      acceleration: number;
      brake: number;
      steering: number;
    };
  }) => {
    try {
      const response = await apiClient.put(`/api/sessions/${sessionId}/telemetry`, telemetryData);
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update telemetry',
        status: error.response?.status
      };
    }
  },
};

// Drivers API calls (Native App - Authenticated only)
export const driversAPI = {
  // Get own drivers for authenticated owner (NATIVE APP - REQUIRES TOKEN)
  getOwnDrivers: async () => {
    try {
      console.log('📱 Native App: Fetching own drivers (authenticated)');
      const response = await apiClient.get('/api/drivers/owner/me');
      console.log(`✅ Fetched ${response.data?.data?.length || 0} drivers for authenticated owner`);
      return response.data?.data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch own drivers:', error.message);
      throw {
        message: error.response?.data?.message || 'Failed to fetch drivers',
        status: error.response?.status
      };
    }
  },

  // Get driver by ID
  getDriver: async (driverId: string) => {
    try {
      const response = await apiClient.get(`/api/drivers/${driverId}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch driver',
        status: error.response?.status
      };
    }
  },

  // Get driver analytics
  getAnalytics: async (driverId: string) => {
    try {
      const response = await apiClient.get(`/api/drivers/${driverId}/analytics`);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch analytics',
        status: error.response?.status
      };
    }
  },
};

// Vehicles API calls (Native App - Authenticated only)
export const vehiclesAPI = {
  // Get available vehicles for authenticated owner (NATIVE APP - REQUIRES TOKEN)
  getAvailableVehicles: async () => {
    try {
      console.log('📱 Native App: Fetching available vehicles (authenticated)');
      const response = await apiClient.get('/api/vehicles/native/available?status=available');
      console.log(`✅ Fetched ${response.data?.data?.length || 0} vehicles for authenticated owner`);
      return response.data?.data || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch available vehicles:', error.message);
      throw {
        message: error.response?.data?.message || 'Failed to fetch vehicles',
        status: error.response?.status
      };
    }
  },

  // Get vehicle by ID
  getVehicle: async (vehicleId: string) => {
    try {
      const response = await apiClient.get(`/api/vehicles/${vehicleId}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch vehicle',
        status: error.response?.status
      };
    }
  },

  // Lock/Allocate vehicle
  lockVehicle: async (vehicleId: string, driverId: string) => {
    try {
      const response = await apiClient.post(`/api/vehicles/${vehicleId}/lock`, {
        driverId
      });
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to allocate vehicle',
        status: error.response?.status
      };
    }
  },
};

export default apiClient;
