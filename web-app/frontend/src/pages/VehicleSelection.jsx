import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import apiService from '../services/api.js';
import useSocket from '../hooks/useSocket.js';

const VehicleSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { verifiedDriver, vehicles, setVehicles, setSelectedVehicle, setSession } = useAppStore();
  
  // Use Socket.io for real-time synchronization
  useSocket(verifiedDriver?.ownerId);

  useEffect(() => {
    if (!verifiedDriver) {
      navigate('/');
      return;
    }

    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError('');
        const vehicleList = await apiService.getAvailableVehicles(verifiedDriver.ownerId);
        setVehicles(vehicleList);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        setError(error.message || 'Unable to load available buses');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicles();
  }, [verifiedDriver, navigate, setVehicles]);

  const handleVehicleSelect = async (vehicle) => {
    try {
      setError('');
      setLoading(true);
      
      console.log(`🚗 STEP 1: Selected vehicle - ${vehicle.vehicle_number}`);
      
      // Atomic locking on backend
      const result = await apiService.lockVehicle(vehicle._id || vehicle.id, verifiedDriver._id || verifiedDriver.id, verifiedDriver.ownerId);
      
      if (result.success) {
        console.log(`✅ STEP 1: Vehicle locked - ${result.data.vehicle_number}`);
        setSelectedVehicle(result.data);
        
        // Start building the session
        console.log(`📝 STEP 2: Creating session with backend...`);
        const sessionResult = await apiService.startSession(verifiedDriver._id || verifiedDriver.id, vehicle._id || vehicle.id, verifiedDriver.ownerId);
        
        if (sessionResult.data && (sessionResult.data._id || sessionResult.data.session_id)) {
          const sessionId = sessionResult.data._id || sessionResult.data.session_id;
          console.log(`✅ STEP 2: Session created - ${sessionId}`);
          console.log(`   Driver: ${sessionResult.data.driverName}`);
          console.log(`   Vehicle: ${sessionResult.data.vehicleNumber}`);
          
          console.log(`✅ STEP 3: Session context stored. Navigating to dashboard...`);
          setSession(sessionResult.data || sessionResult);
          navigate('/dashboard');
        } else {
          throw new Error('Session created but no ID received');
        }
      }
    } catch (error) {
      console.error('❌ Failed to allocate vehicle:', error);
      setError(error.message || 'Bus already selected by another driver');
      
      // Refresh list to remove the taken bus
      const vehicleList = await apiService.getAvailableVehicles(verifiedDriver.ownerId);
      setVehicles(vehicleList);
    } finally {
      setLoading(false);
    }
  };

  if (!verifiedDriver) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-blue-500 mb-4">Bus Allocation</h1>
          <div className="flex items-center justify-center space-x-3 text-2xl">
            <span className="text-gray-400">Driver:</span>
            <span className="text-white font-semibold">{verifiedDriver.firstName} {verifiedDriver.lastName}</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm font-mono tracking-wider uppercase border border-green-500/30">Verified</span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 text-red-100 rounded-xl flex items-center space-x-3 shadow-lg animate-pulse">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium text-lg">{error}</p>
          </div>
        )}

        {loading && vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 font-medium text-xl">Fetching available fleet...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(vehicles) && vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <div
                  key={vehicle._id || vehicle.id}
                  onClick={() => handleVehicleSelect(vehicle)}
                  className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 cursor-pointer border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transform hover:-translate-y-2 overflow-hidden"
                >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-6xl">🚌</span>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-blue-500/30">
                      Available
                    </span>
                    <span className="text-gray-500 font-mono">#{vehicle.vehicle_number}</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {vehicle.year || 'N/A'}
                  </h2>
                  <p className="text-gray-400 mb-6 text-lg">{vehicle.model || 'N/A'}</p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-700/50 pt-6">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Mileage</span>
                      <span className="text-white font-medium">{vehicle.mileage !== undefined ? vehicle.mileage : 'N/A'} km</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Fuel</span>
                      <span className="text-green-400 font-medium">{vehicle.fuel_level !== undefined ? vehicle.fuel_level : 'N/A'}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Safety Rating</span>
                      <span className="text-yellow-400 font-medium">{vehicle.safety_rating !== undefined ? vehicle.safety_rating : 'N/A'}/100</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Status</span>
                      <span className="text-blue-400 font-medium capitalize">{vehicle.protocol_status || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Latitude</span>
                      <span className="text-white font-medium text-sm">{vehicle.location?.coordinates?.[1]?.toFixed(4) || (vehicle.location?.coordinates?.[1] === 0 ? '0.0000' : 'N/A')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Longitude</span>
                      <span className="text-white font-medium text-sm">{vehicle.location?.coordinates?.[0]?.toFixed(4) || (vehicle.location?.coordinates?.[0] === 0 ? '0.0000' : 'N/A')}</span>
                    </div>
                    {vehicle.vin && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">VIN</span>
                        <span className="text-white font-medium text-sm truncate">{vehicle.vin}</span>
                      </div>
                    )}
                    {vehicle.vehicle_number && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Bus Number</span>
                        <span className="text-white font-medium">{vehicle.vehicle_number}</span>
                      </div>
                    )}
                    {vehicle.maintenance_due && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-tighter">Maintenance Due</span>
                        <span className="text-red-400 font-medium text-sm">{new Date(vehicle.maintenance_due).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-gray-800/30 rounded-3xl border border-dashed border-gray-700">
                <span className="text-8xl mb-6 block">🚧</span>
                <h3 className="text-2xl font-bold text-gray-300">No buses available right now</h3>
                <p className="text-gray-500 max-w-md mx-auto mt-2">All vehicles are currently in-use or in maintenance. Please wait for a bus to be released.</p>
              </div>
            )}
          </div>
        )}

        {!Array.isArray(vehicles) && !loading && (
          <div className="text-center py-20 bg-gray-800/30 rounded-3xl border border-dashed border-gray-700">
            <span className="text-8xl mb-6 block">⚠️</span>
            <h3 className="text-2xl font-bold text-gray-300">Error loading buses</h3>
            <p className="text-gray-500 max-w-md mx-auto mt-2">An error occurred while loading the available buses. Please refresh the page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSelection;
