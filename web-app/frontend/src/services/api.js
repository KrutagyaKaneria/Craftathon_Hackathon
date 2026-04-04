import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://localhost:5000/api',
});

const aiApi = axios.create({
  baseURL: 'http://localhost:8000',
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
  const detail = error?.response?.data?.detail || error?.response?.data?.message;
  if (Array.isArray(detail)) {
    return detail.map((entry) => entry?.msg || 'Validation error').join(', ');
  }
  return detail || error?.message || fallback;
};

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

  getDrivers: async (ownerId) => {
    try {
      // Require authentication
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
      
      const url = `/drivers?ownerId=${ownerId}`;
      console.log('📥 Fetching drivers from:', url);
      
      const response = await backendApi.get(url);
      console.log('✅ Drivers fetched successfully:', response.data?.count || response.data?.data?.length || 0);
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      console.error('❌ Failed to fetch drivers:', error.message);
      throw new Error(getErrorMessage(error, 'Failed to load drivers - authentication may be required'));
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
      const url = ownerId ? `/vehicles?status=available&ownerId=${ownerId}` : '/vehicles?status=available';
      const response = await backendApi.get(url);
      return response.data?.success ? response.data.data : response.data;
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