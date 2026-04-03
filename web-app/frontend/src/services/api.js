import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://localhost:5000/api',
});

const aiApi = axios.create({
  baseURL: 'http://localhost:8000',
});

const getErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail || error?.response?.data?.message;
  if (Array.isArray(detail)) {
    return detail.map((entry) => entry?.msg || 'Validation error').join(', ');
  }
  return detail || error?.message || fallback;
};

export const apiService = {
  getDrivers: async () => {
    try {
      const response = await backendApi.get('/drivers');
      return response.data?.success ? response.data.data : response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to load drivers'));
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
};

export default apiService;