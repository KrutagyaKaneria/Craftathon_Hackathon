import apiClient from './api';

/**
 * Comprehensive Vehicle Interface
 * Matches backend comprehensive vehicle data structure with all fields
 */
export interface Vehicle {
  // ===== IDENTIFICATION =====
  _id?: string;
  vehicle_number: string;           // e.g., "BUS-1234-01"
  vehicle_name: string;             // e.g., "Metro Transit Pulsar"
  vin?: string;                     // Vehicle Identification Number

  // ===== MODEL & YEAR =====
  model?: string;                   // e.g., "Volvo 9400 B11R"
  year?: number;                    // e.g., 2023

  // ===== STATUS FIELDS =====
  status?: string;                  // available, in-use, maintenance, inactive
  protocol_status?: string;         // ACTIVE, IDLE, IN_TRANSIT, DIAGNOSTIC, OFFLINE
  in_transit?: boolean;             // Whether vehicle is currently moving

  // ===== METRICS (Gauge Display) =====
  safety_rating?: number;           // Safety percentage (0-100)
  fuel_level?: number;              // Fuel/Battery percentage (0-100)

  // ===== MILEAGE & LOCATION =====
  mileage?: number;                 // Distance in km
  location?: {
    type?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };

  // ===== DRIVER ASSIGNMENT =====
  assigned_driver?: string | null;  // Driver ObjectId or name, null = Unassigned
  assigned_driver_name?: string;    // Populated driver name from backend

  // ===== MAINTENANCE =====
  maintenance_due?: string | Date;  // When next maintenance is due

  // ===== PERFORMANCE TRACKING =====
  recent_performance?: number[];    // 7-day performance metrics

  // ===== DESCRIPTIVE FIELDS =====
  notes?: string;                   // Vehicle condition/status notes

  // ===== METADATA =====
  last_active?: string | Date;      // Last active timestamp
  created_at?: string | Date;       // Creation timestamp
  updated_at?: string | Date;       // Last update timestamp

  // ===== OWNER REFERENCE =====
  ownerId?: string;                 // Fleet owner ID
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
   * GET /api/vehicles/native/available
   * Fetch available vehicles for authenticated owner (NATIVE APP - REQUIRES TOKEN)
   */
  getVehicles: async (ownerId?: string): Promise<Vehicle[]> => {
    try {
      console.log('📱 Native App: Fetching available vehicles for authenticated owner');
      // Use protected native app endpoint that automatically filters by authenticated owner
      const response = await apiClient.get<VehicleListResponse>('/api/vehicles/native/available');
      
      if (response.data.data) {
        console.log('✅ Available vehicles fetched successfully:', response.data.data.length, 'vehicles');
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch vehicles');
    } catch (error: any) {
      console.error('❌ Error fetching vehicles:', error.message);
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
