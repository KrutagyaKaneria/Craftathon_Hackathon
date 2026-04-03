import { useEffect, useState, useRef } from 'react';
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

  const gasPressed = useRef(false);
  const brakePressed = useRef(false);

  const [isGasActive, setIsGasActive] = useState(false);
  const [isBrakeActive, setIsBrakeActive] = useState(false);
  const [virtualSpeed, setVirtualSpeed] = useState(0);

  useEffect(() => {
    const physicsTimer = setInterval(() => {
      const state = useAppStore.getState();
      let newAcc = state.acceleration;
      let newBrake = state.brake;

      // Gas increases acceleration (RPM) quickly
      if (gasPressed.current) {
        if (newAcc < 5) newAcc = Math.min(5, newAcc + 0.15);
      } else {
        // Natural decay or forced braking decay
        const decay = brakePressed.current ? 0.3 : 0.15;
        if (newAcc > 0) newAcc = Math.max(0, newAcc - decay);
      }

      // Update independent Speedometer (rises very slowly, drops sharply on brake)
      setVirtualSpeed((prev) => {
        let nextSpeed = prev;
        if (brakePressed.current) {
          nextSpeed = Math.max(0, prev - 0.1);
        } else if (gasPressed.current) {
          nextSpeed = Math.min(5, prev + 0.02);
        } else {
          nextSpeed = Math.max(0, prev - 0.015);
        }
        return nextSpeed;
      });

      // Brake pedal pushes brake state to negative 5 (for AI detection)
      if (brakePressed.current) {
        if (newBrake > -5) newBrake = Math.max(-5, newBrake - 0.2);
      } else {
        if (newBrake < 0) newBrake = Math.min(0, newBrake + 0.15);
      }

      if (newAcc !== state.acceleration) state.setAcceleration(newAcc);
      if (newBrake !== state.brake) state.setBrake(newBrake);
    }, 16);

    return () => clearInterval(physicsTimer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') { gasPressed.current = true; setIsGasActive(true); }
      if (e.key === 'ArrowLeft') { brakePressed.current = true; setIsBrakeActive(true); }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowRight') { gasPressed.current = false; setIsGasActive(false); }
      if (e.key === 'ArrowLeft') { brakePressed.current = false; setIsBrakeActive(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const intervalId = setInterval(async () => {
      try {
        setRequestError('');
        const state = useAppStore.getState();
        const result = await aiService.detectRash({
          acceleration: state.acceleration,
          brake: state.brake,
          gyro: state.steering,
          driverId,
          sessionId,
        });
        if (result?.rash_driving?.rash) {
          state.addAlert({
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
  }, [isRunning, driverId, sessionId]);

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
            className="flex items-end justify-between px-8 pb-10 pt-10 rounded-b-xl relative overflow-hidden bg-gradient-to-t from-zinc-900 to-zinc-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.4)] border-t border-zinc-700"
          >
            {/* LEFT: BRAKE PEDAL */}
            <div
              className="relative flex flex-col items-center mt-8 w-[104px] h-[140px] cursor-pointer select-none touch-none z-30 ml-2"
              onMouseDown={(e) => { e.preventDefault(); brakePressed.current = true; setIsBrakeActive(true); }}
              onMouseUp={(e) => { e.preventDefault(); brakePressed.current = false; setIsBrakeActive(false); }}
              onMouseLeave={(e) => { e.preventDefault(); brakePressed.current = false; setIsBrakeActive(false); }}
              onTouchStart={() => { brakePressed.current = true; setIsBrakeActive(true); }}
              onTouchEnd={() => { brakePressed.current = false; setIsBrakeActive(false); }}
            >
              <div className={`relative w-full h-[110px] rounded-[10px] bg-gradient-to-b from-[#f2f2f2] to-[#b3b3b3] border-[2.5px] border-[#808080] shadow-[0_6px_12px_rgba(0,0,0,0.6)] transition-all flex flex-col items-center py-2 z-10 box-border ${isBrakeActive ? 'border-b-[3px] border-b-[#8c8c8c] translate-y-[5px]' : 'border-b-[8px] border-b-[#8c8c8c] translate-y-0'}`}>
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5 px-3 w-full place-items-center mb-1.5 mt-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`brk-${i}`} className="w-[18px] h-[18px] rounded-full bg-zinc-900 shadow-[inset_0_3px_5px_rgba(0,0,0,0.9)] border border-zinc-400/20" />
                  ))}
                </div>
                <span className="text-[#2b2b2b] font-black uppercase text-[15px] tracking-[0.1em] mt-auto mb-1.5" style={{ textShadow: "0 1px 1px rgba(255,255,255,0.9)" }}>Brake</span>
              </div>
              {/* Stem cylinder */}
              <div className="absolute bottom-0 w-7 h-14 bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-700 border-x-2 border-zinc-900 z-0 translate-y-6 shadow-xl"></div>
            </div>

            {/* MIDDLE SCENE */}
            <div className="flex-1 flex justify-center items-end gap-x-8 gap-y-6 relative h-full pb-6 z-30 flex-wrap sm:flex-nowrap">

              {/* RPM Meter */}
              <div className="relative flex flex-col items-center justify-center w-[160px] h-[160px] bg-zinc-950 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.7),inset_0_4px_12px_rgba(255,255,255,0.05)] border-[6px] border-zinc-600">
                <svg className="absolute inset-0 w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
                  <path d="M 18 82 A 44 44 0 1 1 82 82" fill="none" stroke="white" strokeWidth="4" />
                  <path d="M 86.5 45 A 44 44 0 0 1 82 82" fill="none" stroke="#e02828" strokeWidth="7" />
                  <path d="M 18 82 L 23 77 M 8 50 L 16 50 M 50 6 L 50 14 M 92 50 L 84 50 M 82 82 L 77 77" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="text-[#f2f2f2] font-black text-[24px] tracking-tight leading-none mb-1 shadow-sm" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                    {Math.round(acceleration * 1600)}
                  </div>
                  <div className="text-zinc-400 font-extrabold text-[12px] tracking-widest drop-shadow-md">RPM</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${-130 + (Math.abs(acceleration) / 5) * 260}deg)` }}>
                  {/* Realistic Red Needle */}
                  <div className="w-[4px] h-[56px] bg-red-600 absolute bottom-1/2 origin-bottom rounded-t-full shadow-[0_2px_6px_rgba(0,0,0,0.8)] border-[0.5px] border-red-800 flex justify-center">
                    <div className="w-[1.5px] h-full bg-red-400 absolute"></div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24px] h-[24px] bg-zinc-300 rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.7)] border-[3px] border-zinc-700 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
                </div>
              </div>

              {/* Boost Meter */}
              <div className="relative flex flex-col items-center justify-center w-[130px] h-[130px] bg-zinc-950 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.7),inset_0_4px_12px_rgba(255,255,255,0.05)] border-[5px] border-zinc-600 mb-2">
                <svg className="absolute inset-0 w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
                  <path d="M 18 82 A 44 44 0 1 1 82 82" fill="none" stroke="white" strokeWidth="3.5" />
                  <path d="M 86.5 45 A 44 44 0 0 1 82 82" fill="none" stroke="#e02828" strokeWidth="7" />
                  <path d="M 18 82 L 23 77 M 8 50 L 16 50 M 50 6 L 50 14 M 92 50 L 84 50 M 82 82 L 77 77" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
                <div className="absolute top-9 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="text-white font-black text-[22px] tracking-tighter leading-none" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                    {Math.round(virtualSpeed * 36)}
                  </div>
                  <div className="text-emerald-400 font-bold text-[9px] tracking-widest mt-0.5" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                    KM/H
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${-130 + (Math.abs(virtualSpeed) / 5) * 260}deg)` }}>
                  <div className="w-[3px] h-[46px] bg-red-600 absolute bottom-1/2 origin-bottom rounded-t-full shadow-[0_2px_4px_rgba(0,0,0,0.8)] border-[0.5px] border-red-800 flex justify-center">
                    <div className="w-[1px] h-full bg-red-400 absolute"></div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-zinc-300 rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.7)] border-[2.5px] border-zinc-700 flex items-center justify-center">
                  <div className="w-2 h-2 bg-zinc-900 rounded-full"></div>
                </div>
              </div>


            </div>

            {/* RIGHT: GAS PEDAL */}
            <div
              className="relative flex flex-col items-center mt-8 w-[104px] h-[140px] cursor-pointer select-none touch-none z-30 mr-2"
              onMouseDown={(e) => { e.preventDefault(); gasPressed.current = true; setIsGasActive(true); }}
              onMouseUp={(e) => { e.preventDefault(); gasPressed.current = false; setIsGasActive(false); }}
              onMouseLeave={(e) => { e.preventDefault(); gasPressed.current = false; setIsGasActive(false); }}
              onTouchStart={() => { gasPressed.current = true; setIsGasActive(true); }}
              onTouchEnd={() => { gasPressed.current = false; setIsGasActive(false); }}
            >
              <div className={`relative w-full h-[110px] rounded-[10px] bg-gradient-to-b from-[#f2f2f2] to-[#b3b3b3] border-[2.5px] border-[#808080] shadow-[0_6px_12px_rgba(0,0,0,0.6)] transition-all flex flex-col items-center py-2 z-10 box-border ${isGasActive ? 'border-b-[3px] border-b-[#8c8c8c] translate-y-[5px]' : 'border-b-[8px] border-b-[#8c8c8c] translate-y-0'}`}>
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5 px-3 w-full place-items-center mb-1.5 mt-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`gas-${i}`} className="w-[18px] h-[18px] rounded-full bg-zinc-900 shadow-[inset_0_3px_5px_rgba(0,0,0,0.9)] border border-zinc-400/20" />
                  ))}
                </div>
                <span className="text-[#2b2b2b] font-black uppercase text-[15px] tracking-[0.1em] mt-auto mb-1.5" style={{ textShadow: "0 1px 1px rgba(255,255,255,0.9)" }}>Gas</span>
              </div>
              {/* Stem cylinder */}
              <div className="absolute bottom-0 w-7 h-14 bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-700 border-x-2 border-zinc-900 z-0 translate-y-6 shadow-xl"></div>
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
