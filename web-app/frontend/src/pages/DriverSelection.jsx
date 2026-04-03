import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import apiService from '../services/api.js';
import { useState } from 'react';

const DriverSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { drivers, setDrivers, setSelectedDriver } = useAppStore();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        setError('');
        const driverList = await apiService.getDrivers();
        setDrivers(driverList);
      } catch (error) {
        console.error('Failed to fetch drivers:', error);
        setError(error.message || 'Unable to load drivers');
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [setDrivers]);

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    navigate('/verification');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-4xl w-full p-8">
        <h1 className="text-4xl font-bold text-center mb-8">Select Driver</h1>
        <div className="mb-6 text-center">
          <Link to="/ai-test" className="rounded bg-purple-700 px-4 py-2 text-sm hover:bg-purple-600">
            Open AI-Only Test Mode
          </Link>
        </div>
        {error && <div className="mb-6 rounded-lg bg-red-600 px-4 py-3 text-sm">{error}</div>}
        {loading && <div className="mb-6 text-center text-gray-300">Loading drivers...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              onClick={() => handleDriverSelect(driver)}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <img
                src={driver.profile_image || '/default-avatar.png'}
                alt={driver.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h2 className="text-xl font-semibold text-center">{driver.name}</h2>
              <p className="text-gray-400 text-center">ID: {driver.id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverSelection;