import api from './api';

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    ownerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    token: string;
  };
}

export const authService = {
  // Sign up new user
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/auth/signup', payload);
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        message: error.response?.data?.message || 'Signup failed',
      };
    }
  },

  // Login user
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', payload);
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  },

  // Verify token
  verifyToken: async (token: string) => {
    try {
      const response = await api.post('/api/auth/verify-token', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        message: 'Token verification failed',
      };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch profile',
      };
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      throw {
        success: false,
        message: 'Backend connection failed',
      };
    }
  },
};
