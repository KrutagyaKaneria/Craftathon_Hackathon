import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera.js';
import aiService from '../services/aiService.js';
import useAppStore from '../store/appStore.js';
import { utils } from '../utils/utils.js';

const AiServiceTest = () => {
  const [driverId, setDriverId] = useState('demo-driver-1');
  const [sessionId, setSessionId] = useState(`demo-session-${Date.now()}`);
  const [isRunning, setIsRunning] = useState(false);
  const [requestError, setRequestError] = useState('');

  const {
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
  } = useAppStore();

  const { videoRef, isStreaming, startCamera, stopCamera, startFatigueDetection, stopFatigueDetection } = useCamera({
    driverId,
    sessionId,
  });

  useEffect(() => {
    if (!isRunning) return;
    const intervalId = setInterval(async () => {
      try {
        setRequestError('');
        const result = await aiService.detectRash({
          acceleration,
          brake,
          gyro: steering,
          driverId,
          sessionId,
        });
        if (result?.rash_driving?.rash) {
          addAlert({
            type: 'rash',
            severity: result.rash_driving.severity || 'medium',
            message: `Rash: ${String(result.rash_driving.event).replace('_', ' ')}`,
          });
        }
      } catch (error) {
        setRequestError(error.message || 'Rash request failed');
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning, acceleration, brake, steering, driverId, sessionId, addAlert]);

  useEffect(() => {
    if (!toasts.length) return;
    const highToast = toasts.find((item) => item.severity === 'high');
    if (highToast) {
      utils.flashScreen();
      utils.playAlertSound();
    }
    const timer = setTimeout(() => dismissToast(toasts[0].id), 3000);
    return () => clearTimeout(timer);
  }, [toasts, dismissToast]);

  const startTest = async () => {
    setRequestError('');
    await startCamera();
    startFatigueDetection();
    setIsRunning(true);
  };

  const stopTest = () => {
    stopFatigueDetection();
    stopCamera();
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between">
        <h1 className="text-2xl font-bold">AI Service Test Mode</h1>
        <Link className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600" to="/">
          Back to Full Flow
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-gray-800 p-5 lg:col-span-2">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
          <div className="mt-4 flex items-center gap-3">
            <span className="rounded bg-gray-700 px-3 py-1 text-sm">{isStreaming ? 'Camera On' : 'Camera Off'}</span>
            <span className="rounded bg-gray-700 px-3 py-1 text-sm">Fatigue: {fatigueStatus}</span>
            {!isRunning ? (
              <button className="rounded bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-500" onClick={startTest}>
                Start AI Test
              </button>
            ) : (
              <button className="rounded bg-red-600 px-4 py-2 text-sm hover:bg-red-500" onClick={stopTest}>
                Stop AI Test
              </button>
            )}
            <button
              className="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
              onClick={() => {
                stopTest();
                reset();
                setSessionId(`demo-session-${Date.now()}`);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-gray-800 p-5">
            <h2 className="mb-3 text-lg font-semibold">Request Context</h2>
            <label className="mb-2 block text-sm text-gray-300">Driver ID</label>
            <input
              className="mb-3 w-full rounded bg-gray-700 p-2 text-sm outline-none"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            />
            <label className="mb-2 block text-sm text-gray-300">Session ID</label>
            <input
              className="w-full rounded bg-gray-700 p-2 text-sm outline-none"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
            {requestError && <p className="mt-3 rounded bg-red-700 px-3 py-2 text-sm">{requestError}</p>}
          </div>

          <div className="rounded-lg bg-gray-800 p-5">
            <h2 className="mb-3 text-lg font-semibold">Driving Inputs</h2>
            <label className="text-sm">Acceleration: {acceleration.toFixed(1)}</label>
            <input type="range" min="0" max="5" step="0.1" value={acceleration} onChange={(e) => setAcceleration(parseFloat(e.target.value))} className="mb-3 w-full" />
            <label className="text-sm">Brake: {brake.toFixed(1)}</label>
            <input type="range" min="-5" max="0" step="0.1" value={brake} onChange={(e) => setBrake(parseFloat(e.target.value))} className="mb-3 w-full" />
            <label className="text-sm">Steering (gyro): {steering.toFixed(1)}</label>
            <input type="range" min="-2" max="2" step="0.1" value={steering} onChange={(e) => setSteering(parseFloat(e.target.value))} className="w-full" />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl rounded-lg bg-gray-800 p-5">
        <h2 className="mb-3 text-lg font-semibold">Alert History</h2>
        <div className="max-h-56 space-y-2 overflow-auto">
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400">No alerts yet.</p>
          ) : (
            alerts.slice().reverse().map((alert) => (
              <div key={alert.id} className="rounded bg-gray-700 px-3 py-2 text-sm">
                <p>{alert.message}</p>
                <p className="text-xs text-gray-300">{utils.formatTimestamp(alert.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AiServiceTest;
