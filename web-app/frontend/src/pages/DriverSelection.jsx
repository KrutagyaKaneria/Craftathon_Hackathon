import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import apiService from '../services/api.js';
import { useState } from 'react';

const DriverSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [showOwnerId, setShowOwnerId] = useState(false);
  const { drivers, setDrivers, setSelectedDriver } = useAppStore();

  useEffect(() => {
    // Check authentication first
    if (!apiService.isAuthenticated()) {
      console.warn('⚠️ Not authenticated - redirecting to login');
      navigate('/login');
      return;
    }

    const fetchDrivers = async () => {
      // Only fetch if we don't have drivers yet
      if (drivers && drivers.length > 0) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        // Get stored ownerId
        const storedOwnerId = localStorage.getItem('ownerId');
        const ownerName = localStorage.getItem('ownerName');
        
        if (!storedOwnerId) {
          throw new Error('Owner ID not found. Please log in again.');
        }

        console.log('🔍 Fetching drivers for owner:', ownerName);
        
        // Pass ownerId from storage
        const driverList = await apiService.getDrivers(storedOwnerId);
        setDrivers(driverList);
        setShowOwnerId(false);
        
        if (!driverList || driverList.length === 0) {
          setError('No drivers found for this account.');
        }
      } catch (error) {
        console.error('❌ Failed to fetch drivers:', error);
        setError(error.message || 'Unable to load drivers. Authentication may have expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [setDrivers, drivers, navigate]);

  const handleSetOwnerIdAndRetry = async () => {
    if (!ownerId.trim()) {
      setError('Please enter an Owner ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Store ownerId for future use
      localStorage.setItem('ownerId', ownerId);
      
      console.log('🔄 Retrying driver fetch with ownerId:', ownerId);
      const driverList = await apiService.getDrivers(ownerId);
      setDrivers(driverList);
      setShowOwnerId(false);
      
      if (!driverList || driverList.length === 0) {
        setError('No drivers found for this Owner ID.');
      }
    } catch (error) {
      console.error('❌ Failed to fetch drivers with ownerId:', error);
      setError(error.message || 'Failed to load drivers for this Owner ID');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.clearAuthToken();
    navigate('/login');
  };

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
        
        {error && (
          <div className="mb-6 rounded-lg bg-red-600 px-4 py-3 text-sm">
            <p>{error}</p>
            <p className="text-xs mt-2 text-red-100">
              ℹ️ This web app now requires authentication. Please provide your Owner ID to continue.
            </p>
          </div>
        )}
        
        {showOwnerId && (
          <div className="mb-8 rounded-lg bg-blue-900 px-6 py-4 border border-blue-700">
            <h2 className="text-lg font-semibold mb-4">❌ Authentication Required</h2>
            <p className="mb-4 text-gray-300">
              To access your drivers, please enter your Owner ID:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="Enter your Owner ID"
                className="flex-1 rounded bg-gray-800 px-4 py-2 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSetOwnerIdAndRetry()}
              />
              <button
                onClick={handleSetOwnerIdAndRetry}
                disabled={loading || !ownerId.trim()}
                className="rounded bg-blue-600 px-6 py-2 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Retry'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              💡 Tip: Your Owner ID was provided when you set up your account on the mobile app.
            </p>
          </div>
        )}
        
        {loading && !showOwnerId && (
          <div className="mb-6 text-center text-gray-300">Loading drivers...</div>
        )}
        
        {!loading && !error && drivers.length === 0 && !showOwnerId && (
          <div className="mb-6 text-center text-gray-400">
            <p>No drivers available. Please check your connection and try again.</p>
        </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers && drivers.map((driver) => (
            <div
              key={driver._id || driver.id}
              onClick={() => handleDriverSelect(driver)}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700 hover:border-blue-500"
            >
              <img
                src={driver.profilePhoto || '/default-avatar.png'}
                alt={`${driver.firstName} ${driver.lastName}`}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-blue-600"
              />
              <h2 className="text-xl font-semibold text-center">{driver.firstName} {driver.lastName}</h2>
              <p className="text-blue-400 text-center font-medium mt-1">{driver.phone}</p>
              <p className="text-gray-500 text-center text-xs mt-2 truncate">ID: {driver._id || driver.id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverSelection;