import axios from 'axios';

// Backend API URL - Configure with your machine IP
const BACKEND_IP = import.meta.env.VITE_API_URL || 'http://10.44.202.155:5000/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://10.44.202.155:8000';

// Log API configuration on startup
console.log('🔧 API Configuration:');
console.log('  Backend:', BACKEND_IP);
console.log('  AI Service:', AI_SERVICE_URL);

const backendApi = axios.create({
  baseURL: BACKEND_IP,
  timeout: 10000, // 10 second timeout
});

const aiApi = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000, // 30 second timeout for AI operations
});

// ============================================
// Add authentication interceptor to backendApi
// ============================================
backendApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Auth token added to request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No auth token found in storage');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error info for debugging
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data,
      code: error.code
    });

    if (error.response?.status === 401) {
      console.error('❌ Unauthorized - token may have expired');
      // Clear token and redirect to login if needed
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

const getErrorMessage = (error, fallback) => {
  // Handle network errors
  if (!error.response) {
    const networkError = `Network Error: ${error.message}`;
    console.error('🌐 ' + networkError);
    console.error('   Please check if backend is running at:', BACKEND_IP);
    return `${networkError} - Backend unavailable. Check IP configuration.`;
  }

  // Handle response errors
  const detail = error?.response?.data?.detail || error?.response?.data?.message;
  if (Array.isArray(detail)) {
    return detail.map((entry) => entry?.msg || 'Validation error').join(', ');
  }
  return detail || error?.message || fallback;
};

// Add error interceptor for AI Service API
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ AI Service Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      code: error.code
    });

    if (!error.response) {
      console.error('   Please check if AI Service is running at:', AI_SERVICE_URL);
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Set authentication token
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('✅ Token stored in localStorage');
    }
  },

  // Logout and clear token
  clearAuthToken: () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('ownerId');
    console.log('✅ Auth token cleared');
  },

  // Login with email and password
  login: async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      console.log('🔐 Attempting login for:', email);
      
      const response = await backendApi.post('/auth/login', {
        email,
        password,
      });

      if (response.data?.success) {
        const { token, ownerId, firstName, lastName } = response.data.data;
        
        // Store token and owner info
        apiService.setAuthToken(token);
        localStorage.setItem('ownerId', ownerId);
        localStorage.setItem('ownerName', `${firstName} ${lastName}`);
        
        console.log('✅ Login successful - Token and ownerId stored');
        
        return {
          success: true,
          token,
          ownerId,
          firstName,
          lastName,
        };
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      throw new Error(getErrorMessage(error, 'Login failed'));
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token;
  },

  // Get stored owner info
  getOwnerInfo: () => {
    return {
      ownerId: localStorage.getItem('ownerId'),
      ownerName: localStorage.getItem('ownerName'),
      token: localStorage.getItem('authToken'),
    };
  },

  // Get ALL drivers from database - PUBLIC route, no authentication required
  getPublicDrivers: async () => {
    try {
      console.log('📥 Fetching all drivers from public route...');
      const response = await backendApi.get('/drivers/public/all');
      const drivers = response.data?.data || response.data || [];
      console.log('✅ Public drivers fetched successfully:', drivers.length);
      return Array.isArray(drivers) ? drivers : [];
    } catch (error) {
      console.error('❌ Failed to fetch public drivers:', error.message);
      throw new Error(getErrorMessage(error, 'Failed to load drivers list'));
    }
  },

  // Get driver analytics - requires authentication
  getDriverAnalytics: async (driverId) => {
    try {
      if (!apiService.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      console.log('📥 Fetching driver analytics for:', driverId);
      const response = await backendApi.get(`/drivers/${driverId}/analytics`);
      console.log('✅ Driver analytics fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch driver analytics:', error.message);
      throw new Error(getErrorMessage(error, 'Failed to load driver analytics'));
    }
  },

  // Get authenticated owner's drivers - PROTECTED route, requires authentication
  getOwnerDrivers: async (ownerId) => {
    try {
      if (!apiService.isAuthenticated()) {
        throw new Error('Authentication required - please log in');
      }

      // Require ownerId for authenticated request
      if (!ownerId) {
        console.warn('⚠️ No ownerId provided - attempting to use stored ownerId');
        ownerId = localStorage.getItem('ownerId');
      }

      if (!ownerId) {
        throw new Error('Owner ID not found - please log in again');
      }
      
      console.log('📥 Fetching authenticated owner drivers from:', ownerId);
      const response = await backendApi.get(`/drivers/owner/me?ownerId=${ownerId}`);
      const drivers = response.data?.data || response.data || [];
      console.log('✅ Owner drivers fetched successfully:', drivers.length);
      return Array.isArray(drivers) ? drivers : [];
    } catch (error) {
      console.error('❌ Failed to fetch owner drivers:', error.message);
      throw new Error(getErrorMessage(error, 'Failed to load drivers - authentication may be required'));
    }
  },

  // Backwards compatibility - get drivers (tries public first, then owner if authenticated)
  getDrivers: async (ownerId) => {
    try {
      // Try public route first (no auth required)
      if (!ownerId && !apiService.isAuthenticated()) {
        console.log('ℹ️ No authentication - using public drivers endpoint');
        return await apiService.getPublicDrivers();
      }

      // If authenticated or ownerId provided, use owner route
      if (apiService.isAuthenticated()) {
        if (!ownerId) {
          ownerId = localStorage.getItem('ownerId');
        }
        if (ownerId) {
          console.log('ℹ️ Authenticated - using owner drivers endpoint');
          return await apiService.getOwnerDrivers(ownerId);
        }
      }

      // Fallback to public if nothing else works
      console.log('ℹ️ Fallback - using public drivers endpoint');
      return await apiService.getPublicDrivers();
    } catch (error) {
      console.error('❌ Failed to fetch drivers:', error.message);
      throw error;
    }
  },

  verifyDriver: async (storedImage, capturedImage) => {
    try {
      // Direct call to AI service for face verification
      const response = await aiApi.post('/verify-face', {
        stored_image: storedImage,
        captured_image: capturedImage,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Face verification failed'));
    }
  },

  getAvailableVehicles: async (ownerId) => {
    try {
      if (!ownerId) {
        throw new Error('Owner ID is required to fetch vehicles');
      }
      // Use public endpoint - no authentication required
      const url = `/vehicles/public/available?status=available&ownerId=${ownerId}`;
      console.log('📥 Fetching available vehicles for owner:', ownerId);
      const response = await backendApi.get(url);
      const vehicles = response.data?.data || response.data || [];
      console.log('✅ Available vehicles fetched:', vehicles.length);
      return Array.isArray(vehicles) ? vehicles : [];
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to load vehicles'));
    }
  },

  lockVehicle: async (vehicleId, driverId, ownerId) => {
    try {
      const response = await backendApi.post(`/vehicles/${vehicleId}/lock`, {
        driverId,
        ownerId
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to select vehicle'));
    }
  },

  startSession: async (driverId, vehicleId, ownerId) => {
    try {
      const response = await backendApi.post('/sessions', {
        driverId,
        vehicleId,
        ownerId,
        status: 'active',
        startTime: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to start session'));
    }
  },

  detectFatigue: async ({ image, driverId, sessionId }) => {
    try {
      const response = await aiApi.post('/fatigue', {
        image,
        driver_id: String(driverId),
        session_id: String(sessionId),
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Fatigue detection failed'));
    }
  },

  detectRash: async ({ acceleration, brake, gyro, driverId, sessionId }) => {
    try {
      const response = await aiApi.post('/rash', {
        acceleration,
        brake,
        gyro,
        driver_id: String(driverId),
        session_id: String(sessionId),
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Rash detection failed'));
    }
  },

  updateSession: async (sessionId, data) => {
    try {
      const response = await backendApi.put(`/sessions/${sessionId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to update session'));
    }
  },

  getSessionsByOwner: async (ownerId) => {
    try {
      const response = await backendApi.get(`/sessions?ownerId=${ownerId}`);
      return response.data?.success ? response.data : response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch sessions'));
    }
  },
};

export default apiService;