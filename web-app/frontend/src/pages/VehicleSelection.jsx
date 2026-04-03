import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import apiService from '../services/api.js';

const VehicleSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { verifiedDriver, vehicles, setVehicles, setSelectedVehicle, setSession } = useAppStore();

  useEffect(() => {
    if (!verifiedDriver) {
      navigate('/');
      return;
    }

    // Replace with backend endpoint when available.
    const mockVehicles = [
      { id: 1, number: 'BUS-001', type: 'City Bus', capacity: 50 },
      { id: 2, number: 'BUS-002', type: 'Express Bus', capacity: 40 },
      { id: 3, number: 'BUS-003', type: 'Mini Bus', capacity: 25 },
    ];
    setVehicles(mockVehicles);
    setLoading(false);
  }, [verifiedDriver, navigate]);

  const handleVehicleSelect = async (vehicle) => {
    try {
      setError('');
      setSelectedVehicle(vehicle);
      const session = await apiService.startSession(verifiedDriver.id, vehicle.id);
      setSession(session);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to start session:', error);
      setError(error.message || 'Failed to start driving session');
    }
  };

  if (!verifiedDriver) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-4xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Select Vehicle</h1>
        <p className="text-center text-gray-400 mb-8">
          Welcome, {verifiedDriver.name}. Please select your assigned vehicle.
        </p>

        {loading ? (
          <div className="text-center">Loading vehicles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle)}
                className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚌</span>
                  </div>
                  <h2 className="text-xl font-semibold">{vehicle.number}</h2>
                  <p className="text-gray-400">{vehicle.type}</p>
                  <p className="text-sm text-gray-500">Capacity: {vehicle.capacity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <div className="mt-6 rounded-lg bg-red-600 px-4 py-3 text-sm">{error}</div>}
      </div>
    </div>
  );
};

export default VehicleSelection;