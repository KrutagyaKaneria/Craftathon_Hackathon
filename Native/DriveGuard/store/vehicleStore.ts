import { create } from 'zustand';
import { vehicleAPI, Vehicle } from '../services/vehicleService';
import { useAuthStore } from './authStore';

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  fetchVehicles: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  selectVehicle: (vehicle: Vehicle | null) => void;
  addVehicle: (vehicle: Vehicle) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  selectedVehicle: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Fetch vehicles on app load
  fetchVehicles: async () => {
    const { isLoading } = get();
    
    // Prevent duplicate fetches
    if (isLoading) {
      console.log('Vehicle fetch already in progress, skipping...');
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      // Get ownerId from authStore
      const authState = useAuthStore.getState();
      const ownerId = authState.user?.ownerId;
      
      console.log('Vehicle Store: Fetching vehicles for ownerId:', ownerId);
      
      if (!ownerId) {
        throw new Error('Not authenticated - no ownerId available');
      }
      
      const vehicles = await vehicleAPI.getVehicles(ownerId);
      
      console.log(`Vehicle Store: Received ${vehicles.length} vehicles`);
      set({ 
        vehicles, 
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch vehicles';
      console.error('Vehicle Store Error:', errorMessage);
      
      set({ 
        vehicles: [],
        isLoading: false,
        error: errorMessage
      });
    }
  },

  // Refresh vehicles (pull-to-refresh)
  refreshVehicles: async () => {
    set({ isRefreshing: true, error: null });
    
    try {
      // Get ownerId from authStore
      const authState = useAuthStore.getState();
      const ownerId = authState.user?.ownerId;
      
      console.log('Vehicle Store: Refreshing vehicles for ownerId:', ownerId);
      
      if (!ownerId) {
        throw new Error('Not authenticated - no ownerId available');
      }
      
      const vehicles = await vehicleAPI.getVehicles(ownerId);
      
      console.log(`Vehicle Store: Refreshed, received ${vehicles.length} vehicles`);
      set({ 
        vehicles, 
        isRefreshing: false,
        error: null 
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to refresh vehicles';
      console.error('Vehicle Store Refresh Error:', errorMessage);
      
      set({ 
        isRefreshing: false,
        error: errorMessage
      });
    }
  },

  // Select a specific vehicle for detailed view
  selectVehicle: (vehicle: Vehicle | null) => {
    console.log('Vehicle Store: Selected vehicle:', vehicle?._id || 'none');
    set({ selectedVehicle: vehicle });
  },

  // Add new vehicle to list (after creation)
  addVehicle: (vehicle: Vehicle) => {
    const { vehicles } = get();
    console.log('Vehicle Store: Adding new vehicle:', vehicle._id);
    set({ vehicles: [vehicle, ...vehicles] });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Reset store to initial state
  reset: () => {
    set({
      vehicles: [],
      selectedVehicle: null,
      isLoading: false,
      isRefreshing: false,
      error: null
    });
  },
}));

export default useVehicleStore;
