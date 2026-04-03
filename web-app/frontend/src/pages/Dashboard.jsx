import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore.js';
import { useCamera } from '../hooks/useCamera.js';
import useSocket from '../hooks/useSocket.js';
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

  const [isRunning, setIsRunning] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [fatigueDebug, setFatigueDebug] = useState(null);
  const [stats, setStats] = useState({ distance: 0, hours: 0, minutes: 0, seconds: 0 });
  const [virtualSpeed, setVirtualSpeed] = useState(0);
  
  const gasPressed = useRef(false);
  const brakePressed = useRef(false);
  const virtualSpeedRef = useRef(0);

  const driverId = verifiedDriver?._id || verifiedDriver?.id;
  const sessionId = session?._id || session?.session_id;

  // Real-time WebSocket connection
  useSocket(verifiedDriver?.ownerId);

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

  const idleRpm = 750;
  const maxRpm = 3800;
  const accelNorm = Math.max(0, Math.min(1, acceleration / 5));
  const calibratedRpm = Math.round(idleRpm + ((accelNorm ** 1.35) * (maxRpm - idleRpm)));

  useEffect(() => {
    if (!verifiedDriver || !selectedVehicle || !session) {
      navigate('/');
      return;
    }
    // Auto-start systems
    const autoStart = async () => {
      await startCamera();
      startFatigueDetection();
      setIsRunning(true);
    };
    autoStart();

    return () => {
      stopFatigueDetection();
      stopCamera();
    };
  }, [verifiedDriver, selectedVehicle, session, navigate]);

  // Simulated Stats Timer
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setStats((prev) => {
          const nextSeconds = prev.seconds + 1;
          const nextMinutes = prev.minutes + Math.floor(nextSeconds / 60);
          const nextHours = prev.hours + Math.floor(nextMinutes / 60);
          const distanceInc = virtualSpeedRef.current / 100;
          return {
            distance: prev.distance + distanceInc,
            hours: nextHours,
            minutes: nextMinutes % 60,
            seconds: nextSeconds % 60,
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Physics Engine
  useEffect(() => {
    const physicsTimer = setInterval(() => {
      const state = useAppStore.getState();
      let newAcc = state.acceleration;
      let newBrake = state.brake;

      if (gasPressed.current && !brakePressed.current) {
        if (newAcc < 5) {
          const normalized = newAcc / 5;
          const resistance = 1 - (normalized ** 1.8);
          const step = 0.035 + (0.08 * Math.max(0.08, resistance));
          newAcc = Math.min(5, newAcc + step);
        }
      } else {
        const decay = brakePressed.current ? 0.3 : 0.15;
        if (newAcc > 0) newAcc = Math.max(0, newAcc - decay);
      }

      setVirtualSpeed((prev) => {
        let nextSpeed = prev;
        if (brakePressed.current) {
          nextSpeed = Math.max(0, prev - 0.1);
        } else if (gasPressed.current) {
          nextSpeed = Math.min(5, prev + 0.02);
        } else {
          nextSpeed = Math.max(0, prev - 0.015);
        }
        virtualSpeedRef.current = nextSpeed;
        return nextSpeed;
      });

      if (brakePressed.current) {
        if (newAcc > 0) newAcc = Math.max(0, newAcc - 0.45);
        if (newBrake > -5) newBrake = Math.max(-5, newBrake - 0.2);
      } else {
        if (newBrake < 0) newBrake = Math.min(0, newBrake + 0.15);
      }

      if (newAcc !== state.acceleration) state.setAcceleration(newAcc);
      if (newBrake !== state.brake) state.setBrake(newBrake);
    }, 16);

    return () => clearInterval(physicsTimer);
  }, []);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        gasPressed.current = true;
        brakePressed.current = false;
      }
      if (e.key === 'ArrowLeft') {
        brakePressed.current = true;
        gasPressed.current = false;
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowRight') gasPressed.current = false;
      if (e.key === 'ArrowLeft') brakePressed.current = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Rash Driving Detection
  useEffect(() => {
    if (!isRunning) return;
    const intervalId = setInterval(async () => {
      try {
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
        console.error('Rash detection error:', error);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning, driverId, sessionId]);

  // Global Effects: Toast alerts, screen flash, sounds
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'alert': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'fatigue': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'danger': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const handleEndSession = () => {
    stopFatigueDetection();
    stopCamera();
    reset();
    navigate('/');
  };

  if (!verifiedDriver || !selectedVehicle || !session) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans p-4 overflow-hidden h-screen flex flex-col">
      {/* HEADER SECTION */}
      <header className="max-w-[1600px] w-full mx-auto flex items-center justify-between mb-6 px-6 py-4 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <img 
            src={verifiedDriver.profilePhoto || '/default-avatar.png'} 
            alt={verifiedDriver.firstName}
            className="w-12 h-12 rounded-full object-cover border-2 border-red-500 shadow-lg shadow-red-500/20"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
              Driver <span className="text-red-500">{verifiedDriver.firstName}</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{selectedVehicle.vehicle_number} • {selectedVehicle.vehicle_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center group">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-zinc-300 transition-colors">Distance</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              {stats.distance.toFixed(2)} <span className="text-sm opacity-50">KM</span>
            </p>
          </div>
          <div className="text-center group">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-zinc-300 transition-colors">Session Duration</p>
            <p className="text-2xl font-mono font-bold text-white">
              {String(stats.hours).padStart(2, '0')}:{String(stats.minutes).padStart(2, '0')}:{String(stats.seconds).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4 bg-zinc-950/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-black text-zinc-400 tracking-tighter uppercase">{wsConnected ? 'Network Connected' : 'Offline'}</span>
          </div>
          <button 
            onClick={handleEndSession}
            className="px-6 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white font-bold text-sm transition-all active:scale-95 border border-red-500/30 flex items-center gap-2 group"
          >
            END SESSION
          </button>
        </div>
      </header>

      {/* MAIN DASHBOARD GRID */}
      <main className="max-w-[1600px] w-full mx-auto grid grid-cols-[300px_1fr_300px] gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: KEY DETAIL CARDS */}
        <div className="space-y-4 overflow-auto custom-scrollbar pr-2 pb-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Session Identifier</p>
            <p className="text-xs font-mono text-zinc-400 break-all opacity-80 group-hover:opacity-100 transition-opacity">
              {sessionId}
            </p>
          </div>
          <div className={`p-5 rounded-2xl border shadow-xl transition-all ${getStatusColor(fatigueStatus)} flex flex-col items-center justify-center py-8`}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">Fatigue Monitoring</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse bg-current`}></div>
              <p className="text-3xl font-black uppercase italic tracking-wider">{fatigueStatus}</p>
            </div>
            {requestError && <p className="text-[10px] text-red-500 mt-2 font-bold animate-pulse">{requestError}</p>}
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Steering Angle</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-white">{steering.toFixed(1)}°</span>
                <div className="flex gap-1">
                  <button onClick={() => setSteering(Math.max(-45, steering - 5))} className="p-2 bg-zinc-800 hover:bg-blue-600 rounded-lg text-xs font-black transition-colors">L</button>
                  <button onClick={() => setSteering(Math.min(45, steering + 5))} className="p-2 bg-zinc-800 hover:bg-blue-600 rounded-lg text-xs font-black transition-colors">R</button>
                </div>
              </div>
              <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (Math.abs(steering) / 45) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl">
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Active Alerts Log</p>
             <div className="space-y-3 overflow-auto max-h-[250px] custom-scrollbar pr-2">
                {alerts.length === 0 ? (
                  <p className="text-zinc-600 italic text-xs py-10 text-center">No alerts recorded.</p>
                ) : (
                  alerts.slice().reverse().map((alert) => (
                    <div key={alert.id} className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${alert.severity === 'high' ? 'bg-red-500' : 'bg-zinc-700'}`}>{alert.type}</span>
                        <span className="text-[8px] text-zinc-600 font-mono">{utils.formatTimestamp(alert.timestamp)}</span>
                      </div>
                      <p className="text-xs font-bold text-zinc-300 leading-tight">{alert.message}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="flex flex-col gap-6 min-h-0 overflow-hidden">
          {/* FACE SCREEN */}
          <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-zinc-800 bg-black shadow-2xl group transition-all duration-500 hover:border-zinc-700 flex-1">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            <div className="absolute top-4 left-6 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`}></div>
              <span className="text-[10px] font-black text-white/80 tracking-widest uppercase">Safety Monitoring Feed</span>
            </div>
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="bg-red-600/90 backdrop-blur-md text-white font-bold py-3 px-6 rounded-2xl border border-red-500 shadow-2xl">
                  {cameraError}
                </p>
              </div>
            )}
          </div>

          {/* CONTROLS ROW */}
          <div className="px-10 py-8 bg-zinc-900/80 rounded-[40px] border border-zinc-800/80 shadow-2xl relative overflow-hidden flex items-center justify-between shrink-0">
            {/* Decal Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            {/* Brake Pedal */}
            <div
              className={`relative flex flex-col items-center w-[90px] cursor-pointer select-none transition-transform`}
              onMouseDown={(e) => { e.preventDefault(); brakePressed.current = true; gasPressed.current = false; }}
              onMouseUp={(e) => { e.preventDefault(); brakePressed.current = false; }}
              onMouseLeave={(e) => { e.preventDefault(); brakePressed.current = false; }}
            >
              <div className={`relative w-full h-[100px] rounded-[15px] bg-gradient-to-b from-[#f2f2f2] to-[#b3b3b3] border-[2.5px] border-[#808080] shadow-[0_4px_8px_rgba(0,0,0,0.6)] flex flex-col items-center py-2 z-10 box-border ${brakePressed.current ? 'border-b-[3px] translate-y-[4px]' : 'border-b-[8px] translate-y-0'}`}>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-zinc-900 shadow-inner"></div>)}
                </div>
                <span className="text-[#2b2b2b] font-black uppercase text-[10px] tracking-widest mt-auto mb-2">Brake</span>
              </div>
            </div>

            {/* RPM Meter */}
            <div className="relative w-40 h-40 bg-zinc-950 rounded-full border-[6px] border-zinc-800 shadow-inner flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" stroke="#27272a" strokeWidth="6" />
                <path d="M 75 30 A 40 40 0 0 1 80 80" fill="none" stroke="#ef4444" strokeWidth="6" />
              </svg>
              <div className="text-center z-10 translate-y-2">
                <p className="text-3xl font-mono font-black text-white">{calibratedRpm}</p>
                <p className="text-[10px] font-black text-zinc-500 tracking-[0.3em]">RPM</p>
              </div>
              <div className="absolute w-1 h-[65px] bg-red-500 origin-bottom rounded-full shadow-lg transition-transform duration-75" style={{ bottom: '50%', transform: `rotate(${-120 + (accelNorm * 240)}deg)` }}></div>
            </div>

            {/* Speed Meter */}
            <div className="relative w-32 h-32 bg-zinc-950 rounded-full border-[5px] border-zinc-800 shadow-inner flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" stroke="#27272a" strokeWidth="5" />
                <path d="M 75 30 A 40 40 0 0 1 80 80" fill="none" stroke="#ef4444" strokeWidth="5" />
              </svg>
              <div className="text-center z-10 translate-y-2">
                <p className="text-2xl font-mono font-black text-emerald-400">{Math.round(virtualSpeed * 36)}</p>
                <p className="text-[8px] font-black text-zinc-500 tracking-[0.2em]">KM/H</p>
              </div>
              <div className="absolute w-1 h-[50px] bg-red-500 origin-bottom rounded-full shadow-lg transition-transform duration-75" style={{ bottom: '50%', transform: `rotate(${-120 + ((virtualSpeed / 5) * 240)}deg)` }}></div>
            </div>

            {/* Gas Pedal */}
            <div
              className={`relative flex flex-col items-center w-[90px] cursor-pointer select-none transition-transform`}
              onMouseDown={(e) => { e.preventDefault(); gasPressed.current = true; brakePressed.current = false; }}
              onMouseUp={(e) => { e.preventDefault(); gasPressed.current = false; }}
              onMouseLeave={(e) => { e.preventDefault(); gasPressed.current = false; }}
            >
              <div className={`relative w-full h-[100px] rounded-[15px] bg-gradient-to-b from-[#f2f2f2] to-[#b3b3b3] border-[2.5px] border-[#808080] shadow-[0_4px_8px_rgba(0,0,0,0.6)] flex flex-col items-center py-2 z-10 box-border ${gasPressed.current ? 'border-b-[3px] translate-y-[4px]' : 'border-b-[8px] translate-y-0'}`}>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-zinc-900 shadow-inner"></div>)}
                </div>
                <span className="text-[#2b2b2b] font-black uppercase text-[10px] tracking-widest mt-auto mb-2">Gas</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI TELEMETRY */}
        <div className="space-y-4 overflow-auto custom-scrollbar pr-2 pb-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Eye Aspect Ratio (EAR)</p>
            <p className="text-3xl font-mono font-black text-white">{fatigueDebug?.metrics?.ear ?? "0.00"}</p>
            <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${Math.min(100, (fatigueDebug?.metrics?.ear || 0) * 200)}%` }}></div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Mouth Aspect Ratio (MAR)</p>
            <p className="text-3xl font-mono font-black text-white">{fatigueDebug?.metrics?.mar ?? "0.00"}</p>
            <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
               <div className="h-full bg-fuchsia-500 transition-all duration-300" style={{ width: `${Math.min(100, (fatigueDebug?.metrics?.mar || 0) * 100)}%` }}></div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Safety Score</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-red-500 italic drop-shadow-[0_0_12px_rgba(239,68,68,0.3)]">{fatigueDebug?.fatigue_score ?? "0"}</p>
              <div className="flex-1 space-y-1">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min(100, fatigueDebug?.fatigue_score || 0)}%` }}></div>
                </div>
                <p className="text-[8px] font-bold text-zinc-500 text-right uppercase tracking-widest">Risk Level</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Detailed Event</p>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${fatigueDebug?.status === 'drowsy' ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-sm font-black text-white uppercase italic tracking-tighter truncate">
                {fatigueDebug?.event?.replace('_', ' ') || "Scanning Face..."}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Global CSS */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;