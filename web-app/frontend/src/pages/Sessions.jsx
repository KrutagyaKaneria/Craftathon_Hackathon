import { useEffect, useState } from 'react';
import apiService from '../services/api.js';
import useAppStore from '../store/appStore.js';
import useSocket from '../hooks/useSocket.js';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOwnerId] = useState('69cff887de1b982619dca00f'); // Default owner ID
  
  const { addAlert } = useAppStore();
  useSocket(selectedOwnerId);

  useEffect(() => {
    fetchSessions();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await apiService.getSessionsByOwner(selectedOwnerId);
      setSessions(response?.data?.data || response?.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 border-red-500 text-red-300';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
      case 'low': return 'bg-green-500/20 border-green-500 text-green-300';
      default: return 'bg-blue-500/20 border-blue-500 text-blue-300';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '<span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30">🟢 Active</span>';
      case 'ended':
        return '<span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-bold border border-gray-500/30">⏹️ Ended</span>';
      default:
        return `<span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">${status}</span>`;
    }
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">Sessions Management</h1>
          <p className="text-gray-400">Track all driver sessions and real-time alerts</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session._id}
                className={`p-6 rounded-xl border-2 transition-all ${
                  session.status === 'active'
                    ? 'bg-gray-800/50 border-green-500/30 shadow-lg shadow-green-500/10'
                    : 'bg-gray-800/30 border-gray-700/50 opacity-75'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Driver Info */}
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-1">Driver</p>
                    <p className="text-white text-lg font-bold">{session.driverName || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs mt-1">ID: {session.driverId}</p>
                  </div>

                  {/* Vehicle Info */}
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-1">Vehicle</p>
                    <p className="text-white text-lg font-bold">🚌 {session.vehicleNumber}</p>
                    <p className="text-gray-500 text-xs mt-1">{session.vehicleModel || 'Standard Bus'}</p>
                  </div>

                  {/* Session Time */}
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-1">Start Time</p>
                    <p className="text-white text-sm font-mono">{formatTime(session.startTime)}</p>
                    {session.duration && (
                      <p className="text-gray-500 text-xs mt-1">Duration: {session.duration} min</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {session.status === 'active' ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30 animate-pulse">
                          🟢 Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-bold border border-gray-500/30">
                          ⏹️ Ended
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Safety Score</p>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                        <span className="font-bold text-white text-lg">{session.safetyScore || 100}</span>
                      </div>
                      <span className="text-2xl">
                        {session.safetyScore >= 90 ? '✅' : session.safetyScore >= 70 ? '⚠️' : '🚨'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Alerts</p>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-red-400">{session.alertsCount || 0}</div>
                      <span className="text-lg">{session.alertsCount > 0 ? '🔔' : '✓'}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Risk Level</p>
                    <div className={`px-3 py-2 rounded-lg text-center font-bold border ${
                      session.safetyScore >= 90 ? 'bg-green-500/20 border-green-500 text-green-300' :
                      session.safetyScore >= 70 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' :
                      'bg-red-500/20 border-red-500 text-red-300'
                    }`}>
                      {session.safetyScore >= 90 ? 'LOW' : session.safetyScore >= 70 ? 'MEDIUM' : 'HIGH'}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  {session.status === 'ended' && (
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      📊 View Report
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-800/30 rounded-lg border border-dashed border-gray-600">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Sessions Found</h3>
              <p className="text-gray-500">Sessions will appear here when drivers start their routes</p>
            </div>
          )}
        </div>

        {/* Real-time Status */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleTimeString()} • Showing {sessions.length} session(s)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sessions;
