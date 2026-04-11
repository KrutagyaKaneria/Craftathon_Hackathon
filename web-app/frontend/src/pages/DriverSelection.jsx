import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import apiService from '../services/api.js';
import { useState } from 'react';

const DriverSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const { drivers, setDrivers, setSelectedDriver } = useAppStore();
  const hasFetchedRef = useRef(false); // Track if we've already fetched

  useEffect(() => {
    const fetchAllDrivers = async () => {
      // Only fetch once on component mount
      if (hasFetchedRef.current) {
        console.log('✅ Drivers already fetched, skipping...');
        return;
      }

      hasFetchedRef.current = true;
      
      try {
        setLoading(true);
        console.log('🌐 Fetching all public drivers...');
        const driverList = await apiService.getPublicDrivers();
        setDrivers(Array.isArray(driverList) ? driverList : []);
        console.log(`✅ Loaded ${Array.isArray(driverList) ? driverList.length : 0} drivers`);
      } catch (error) {
        console.error('❌ Failed to fetch drivers:', error);
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllDrivers();
  }, []); // Empty dependency array - fetch only once on mount

  const handleDriverSelect = (driver) => {
    try {
      setSelecting(true);
      console.log('👤 Driver selected:', driver.firstName, driver.lastName);
      setSelectedDriver(driver);
      
      // Navigate to verification page for face verification
      setTimeout(() => {
        navigate('/verification');
      }, 300);
    } catch (error) {
      console.error('❌ Error selecting driver:', error);
      setSelecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-6xl w-full p-8">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-center mb-2">Select Driver</h1>
          <p className="text-center text-gray-400 text-lg">Choose a driver to verify</p>
        </div>
        
        {loading && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <p className="text-gray-300 text-lg">Loading drivers...</p>
          </div>
        )}
        
        {!loading && (!drivers || !Array.isArray(drivers) || drivers.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No drivers available at this time.</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(drivers) && drivers.map((driver) => (
            <div
              key={driver._id || driver.id}
              onClick={() => !selecting && handleDriverSelect(driver)}
              className={`bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-all transform hover:scale-105 border border-gray-700 hover:border-blue-500 shadow-lg ${
                selecting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                pointerEvents: selecting ? 'none' : 'auto'
              }}
            >
              <img
                src={driver.profilePhoto || '/default-avatar.png'}
                alt={`${driver.firstName} ${driver.lastName}`}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-blue-600 hover:border-green-500 transition-colors"
              />
              <h2 className="text-2xl font-bold text-center">{driver.firstName} {driver.lastName}</h2>
              <p className="text-blue-400 text-center font-semibold mt-2">{driver.phone}</p>
              <p className="text-gray-500 text-center text-xs mt-3">ID: {driver._id || driver.id}</p>
              <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                <span className="text-sm text-gray-400">Click to verify</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverSelection;
