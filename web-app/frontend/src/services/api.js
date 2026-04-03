import axios from 'axios';

const backendApi = axios.create({
  baseURL: 'http://localhost:8000',
});

const aiApi = axios.create({
  baseURL: 'http://localhost:8000',
});

const getErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((entry) => entry?.msg || 'Validation error').join(', ');
  }
  return detail || error?.message || fallback;
};

export const apiService = {
  getDrivers: async () => {
    try {
      const response = await backendApi.get('/drivers');
      return Array.isArray(response.data) ? response.data : response.data?.drivers || [];
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Failed to load drivers'));
    }
  },

  verifyDriver: async (driverId, storedImage, capturedImage) => {
    try {
      const response = await backendApi.post('/verify-driver', {
        driver_id: String(driverId),
        stored_image: storedImage,
        captured_image: capturedImage,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Driver verification failed'));
    }
  },

  startSession: async (driverId, vehicleId) => {
    try {
      const response = await backendApi.post('/start-session', {
        driver_id: String(driverId),
        vehicle_id: String(vehicleId),
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