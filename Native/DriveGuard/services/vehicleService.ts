import apiClient from './api';

export interface Vehicle {
  _id?: string;
  vehicle_number: string;
  vehicle_name: string;
  status?: string;
  safety_rating?: number;
  last_active?: string;
  protocol_status?: string;
  recent_performance?: number[];
  in_transit?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleListResponse {
  success: boolean;
  data?: Vehicle[];
  message?: string;
}

/**
 * Vehicle API Service
 * Provides methods to interact with vehicle endpoints
 */
export const vehicleAPI = {
  /**
   * GET /api/vehicles
   * Fetch all vehicles for authenticated owner
   */
  getVehicles: async (ownerId?: string): Promise<Vehicle[]> => {
    try {
      console.log('Fetching vehicles for owner...', ownerId ? `ownerId: ${ownerId}` : 'ownerId from auth header');
      const response = await apiClient.get<VehicleListResponse>('/api/vehicles', {
        params: ownerId ? { ownerId } : {}
      });
      
      if (response.data.success && response.data.data) {
        console.log('Vehicles fetched successfully:', response.data.data.length, 'vehicles');
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch vehicles');
    } catch (error: any) {
      console.error('Error fetching vehicles:', error.message);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch vehicles',
        status: error.response?.status
      };
    }
  },

  /**
   * GET /api/vehicles/:id
   * Fetch single vehicle by ID
   */
  getVehicle: async (vehicleId: string): Promise<Vehicle> => {
    try {
      console.log('🚗 Fetching vehicle:', vehicleId);
      const response = await apiClient.get<{ success: boolean; data: Vehicle }>(`/api/vehicles/${vehicleId}`);
      
      if (response.data.success && response.data.data) {
        console.log('✅ Vehicle fetched successfully');
        return response.data.data;
      }
      throw new Error('Failed to fetch vehicle');
    } catch (error: any) {
      console.error('❌ Error fetching vehicle:', error.message);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch vehicle',
        status: error.response?.status
      };
    }
  },

  /**
   * POST /api/vehicles
   * Create new vehicle
   */
  createVehicle: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    try {
      console.log('Creating vehicle...');
      const response = await apiClient.post<{ success: boolean; data: Vehicle }>('/api/vehicles', data);
      
      if (response.data.success && response.data.data) {
        console.log('Vehicle created successfully');
        return response.data.data;
      }
      throw new Error('Failed to create vehicle');
    } catch (error: any) {
      console.error('Error creating vehicle:', error.message);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to create vehicle',
        status: error.response?.status
      };
    }
  },

  /**
   * PUT /api/vehicles/:id
   * Update vehicle
   */
  updateVehicle: async (vehicleId: string, data: Partial<Vehicle>): Promise<Vehicle> => {
    try {
      console.log('🚗 Updating vehicle:', vehicleId);
      const response = await apiClient.put<{ success: boolean; data: Vehicle }>(`/api/vehicles/${vehicleId}`, data);
      
      if (response.data.success && response.data.data) {
        console.log('✅ Vehicle updated successfully');
        return response.data.data;
      }
      throw new Error('Failed to update vehicle');
    } catch (error: any) {
      console.error('❌ Error updating vehicle:', error.message);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to update vehicle',
        status: error.response?.status
      };
    }
  },

  /**
   * DELETE /api/vehicles/:id
   * Delete vehicle
   */
  deleteVehicle: async (vehicleId: string): Promise<void> => {
    try {
      console.log('🚗 Deleting vehicle:', vehicleId);
      await apiClient.delete(`/api/vehicles/${vehicleId}`);
      
      console.log('✅ Vehicle deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting vehicle:', error.message);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to delete vehicle',
        status: error.response?.status
      };
    }
  },
};

export default vehicleAPI;
