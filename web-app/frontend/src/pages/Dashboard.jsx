import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import { useCamera } from '../hooks/useCamera.js';
import aiService from '../services/aiService.js';
import { utils } from '../utils/utils.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    verifiedDriver,
    selectedVehicle,
    session,
    cameraError,
    wsConnected,
    fatigueStatus,
    acceleration,
    brake,
    steering,
    alerts,
    toasts,
    setAcceleration,
    setBrake,
    setSteering,
    addAlert,
    dismissToast,
    reset,
    setWsConnected,
  } = useAppStore();

  const sessionId = session?.session_id || session?.id || `${verifiedDriver?.id || 'driver'}-${Date.now()}`;
  const { videoRef, isStreaming, startCamera, stopCamera, startFatigueDetection, stopFatigueDetection } = useCamera({
    driverId: verifiedDriver?.id,
    sessionId,
  });
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    if (!verifiedDriver || !selectedVehicle || !session) {
      navigate('/');
      return;
    }

    // Start camera and fatigue detection
    startCamera();
    startFatigueDetection();

    // Start session timer
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    const rashInterval = setInterval(async () => {
      try {
        const result = await aiService.detectRash({
          acceleration,
          brake,
          gyro: steering,
          driverId: verifiedDriver.id,
          sessionId,
        });

        const rash = result?.rash_driving;
        if (rash?.rash) {
          addAlert({
            type: 'rash',
            severity: rash.severity || 'medium',
            message: `Rash event: ${String(rash.event).replace('_', ' ')}`,
          });
        }
      } catch (error) {
        console.error('Rash detection error:', error);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(rashInterval);
      stopCamera();
      stopFatigueDetection();
    };
  }, [verifiedDriver, selectedVehicle, session, navigate, startCamera, startFatigueDetection, stopCamera, stopFatigueDetection, acceleration, brake, steering, addAlert, sessionId]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:9000/ws');
    socket.onopen = () => setWsConnected(true);
    socket.onclose = () => setWsConnected(false);
    socket.onerror = () => setWsConnected(false);
    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);
        if (payload?.type) {
          addAlert({
            type: payload.type,
            severity: payload.severity || 'medium',
            message: payload.message || `${payload.type} event`,
            timestamp: payload.timestamp,
          });
        }
      } catch {
        // Ignore malformed messages from non-standard sockets.
      }
    };

    return () => {
      socket.close();
    };
  }, [addAlert, setWsConnected]);

  useEffect(() => {
    const highs = toasts.filter((toast) => toast.severity === 'high');
    if (highs.length) {
      utils.flashScreen();
      utils.playAlertSound();
    }
  }, [toasts]);

  useEffect(() => {
    if (!toasts.length) return;
    const timeout = setTimeout(() => dismissToast(toasts[0].id), 3500);
    return () => clearTimeout(timeout);
  }, [toasts, dismissToast]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFatigueColor = (status) => {
    switch (status) {
      case 'alert': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'drowsy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getFatigueIcon = (status) => {
    switch (status) {
      case 'alert': return '🟢';
      case 'warning': return '🟡';
      case 'drowsy': return '🔴';
      default: return '⚪';
    }
  };

  if (!verifiedDriver || !selectedVehicle || !session) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-72 rounded-lg px-4 py-3 text-sm shadow-lg ${
              toast.severity === 'high' ? 'bg-red-600' : toast.severity === 'medium' ? 'bg-yellow-600 text-black' : 'bg-blue-600'
            }`}
          >
            <p className="font-semibold">{toast.message}</p>
            <p className="text-xs opacity-80">{utils.formatTimestamp(toast.timestamp)}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-gray-400">
              {verifiedDriver.name} • {selectedVehicle.number} • Session: {formatTime(sessionTime)}
            </p>
            <p className="text-xs text-gray-500">Session ID: {sessionId}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs ${wsConnected ? 'bg-emerald-700' : 'bg-gray-700'}`}>
              {wsConnected ? 'WS Connected' : 'WS Offline'}
            </span>
            <button
              onClick={() => {
                reset();
                navigate('/');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Camera Feed</h2>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-lg">
                  <p className="text-gray-400">Camera not active</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-lg">{getFatigueIcon(fatigueStatus)}</span>
              <span className={`font-semibold ${getFatigueColor(fatigueStatus)}`}>
                Fatigue Status: {fatigueStatus.toUpperCase()}
              </span>
            </div>
            {cameraError && <div className="mt-4 rounded-lg bg-red-600 px-3 py-2 text-sm">{cameraError}</div>}
          </div>
        </div>

        {/* Controls and Alerts */}
        <div className="space-y-6">
          {/* Driving Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Driving Controls</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Accelerator</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={acceleration}
                  onChange={(e) => setAcceleration(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-400">{acceleration.toFixed(1)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Brake</label>
                <input
                  type="range"
                  min="-5"
                  max="0"
                  step="0.1"
                  value={brake}
                  onChange={(e) => setBrake(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-400">{brake.toFixed(1)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Steering</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSteering(Math.max(-1, steering - 0.1))}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                  >
                    ← Left
                  </button>
                  <span className="flex items-center justify-center text-sm text-gray-400 min-w-[60px]">
                    {steering.toFixed(1)}
                  </span>
                  <button
                    onClick={() => setSteering(Math.min(1, steering + 0.1))}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                  >
                    Right →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-400">No alerts</p>
              ) : (
                alerts.slice(-10).map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      alert.severity === 'high' ? 'bg-red-600' :
                      alert.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                    }`}
                  >
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-300">{utils.formatTimestamp(alert.timestamp)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;