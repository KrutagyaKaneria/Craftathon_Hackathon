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
  const [fatigueDebug, setFatigueDebug] = useState(null);

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
    onFatigueUpdate: (fatigue) => {
      setFatigueDebug(fatigue);
      setRequestError('');
    },
    onFatigueError: (error) => {
      setRequestError(error.message || 'Fatigue request failed');
    },
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
        <h1 className="text-2xl font-bold">Driver Test Interface</h1>
        <Link className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600" to="/">
          Back to Full Flow
        </Link>
      </div>

      <div className="mx-auto mb-6 flex max-w-7xl flex-wrap items-center gap-3">
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

      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-xl border border-zinc-400 bg-zinc-200 text-zinc-900 shadow-2xl">
          <div className="p-8">
            <div className="mx-auto w-full max-w-xl rounded-md border-2 border-zinc-600 bg-zinc-100 p-4">
              <h2 className="mb-3 text-center text-5xl font-medium text-zinc-800">Face Camera</h2>
              <div className="mx-auto aspect-[4/3] max-w-[520px] overflow-hidden rounded-sm border border-zinc-500 bg-zinc-300">
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-3 items-end gap-6 px-8 pb-8 pt-6"
            style={{ background: 'radial-gradient(circle at 20% 20%, #8a7355 0%, #735f46 45%, #5f4c39 100%)' }}
          >
            <div className="rounded-md border-2 border-zinc-500 bg-gradient-to-b from-zinc-200 to-zinc-400 p-3 shadow">
              <div className="mb-3 grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <span key={`brk-hole-${idx}`} className="h-4 w-4 rounded-full bg-zinc-700" />
                ))}
              </div>
              <p className="text-center text-2xl font-black tracking-wide text-zinc-800">BRAKE</p>
              <p className="mt-1 text-center text-sm font-semibold text-zinc-700">{brake.toFixed(1)}</p>
              <input
                type="range"
                min="-5"
                max="0"
                step="0.1"
                value={brake}
                onChange={(e) => setBrake(parseFloat(e.target.value))}
                className="mt-2 w-full"
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-full border-4 border-cyan-300 bg-cyan-600/80 shadow-inner" />
                <div className="h-24 w-24 rounded-full border-4 border-zinc-300 bg-zinc-700 p-2 shadow">
                  <div className="relative h-full w-full rounded-full border-2 border-zinc-200">
                    <div className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-full rotate-12 rounded bg-zinc-100" />
                  </div>
                </div>
                <div className="h-24 w-24 rounded-full border-4 border-zinc-300 bg-zinc-700 p-2 shadow">
                  <div className="relative h-full w-full rounded-full border-2 border-zinc-200">
                    <div className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-full rotate-12 rounded bg-zinc-100" />
                  </div>
                </div>
              </div>
              <div className="w-full rounded-full border-2 border-zinc-300 bg-zinc-900/70 px-4 py-3">
                <p className="mb-2 text-center text-lg font-bold text-zinc-100">TURN / GYRO</p>
                <p className="mb-2 text-center text-sm font-semibold text-zinc-200">{steering.toFixed(1)}</p>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={steering}
                  onChange={(e) => setSteering(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSteering(Math.max(-2, steering - 0.1))}
                    className="rounded bg-blue-700 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setSteering(Math.min(2, steering + 0.1))}
                    className="rounded bg-blue-700 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-md border-2 border-zinc-500 bg-gradient-to-b from-zinc-200 to-zinc-400 p-3 shadow">
              <div className="mb-3 grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <span key={`gas-hole-${idx}`} className="h-4 w-4 rounded-full bg-zinc-700" />
                ))}
              </div>
              <p className="text-center text-2xl font-black tracking-wide text-zinc-800">GAS</p>
              <p className="mt-1 text-center text-sm font-semibold text-zinc-700">{acceleration.toFixed(1)}</p>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={acceleration}
                onChange={(e) => setAcceleration(parseFloat(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
          </div>
        </div>

        {/* Debug + request context below, so it doesn't distort the main panel */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
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
            <h2 className="mb-3 text-lg font-semibold">Fatigue Debug</h2>
            {!fatigueDebug ? (
              <p className="text-sm text-gray-400">No fatigue response yet. Start test and face camera.</p>
            ) : (
              <div className="space-y-1 text-sm">
                <p>Status: <span className="font-semibold">{fatigueDebug.status}</span></p>
                <p>Score: {fatigueDebug.fatigue_score}</p>
                <p>Event: {fatigueDebug.event || 'none'}</p>
                <p>EAR: {fatigueDebug.metrics?.ear ?? '-'}</p>
                <p>MAR: {fatigueDebug.metrics?.mar ?? '-'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-gray-800 p-5">
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
    </div>
  );
};

export default AiServiceTest;
