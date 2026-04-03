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

  // Simulated metrics
  const [stats, setStats] = useState({ distance: 0, hours: 0, minutes: 0, seconds: 0 });

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
  const virtualSpeedRef = useRef(0);

  const idleRpm = 750;
  const maxRpm = 3800;
  const accelNorm = Math.max(0, Math.min(1, acceleration / 5));
  const calibratedRpm = Math.round(idleRpm + ((accelNorm ** 1.35) * (maxRpm - idleRpm)));

  // Simulated Stats Timer - Stable 1s interval
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setStats((prev) => {
          const nextSeconds = prev.seconds + 1;
          const nextMinutes = prev.minutes + Math.floor(nextSeconds / 60);
          const nextHours = prev.hours + Math.floor(nextMinutes / 60);
          
          // Distance calculation: speed * time
          // speed = virtualSpeedRef.current * 36 (km/h)
          // time = 1s = 1/3600 h
          // distance_inc = (virtualSpeedRef.current * 36) / 3600 = virtualSpeedRef.current / 100
          const distanceInc = virtualSpeedRef.current / 100;
          const nextDistance = prev.distance + distanceInc;

          return {
            distance: nextDistance,
            hours: nextHours,
            minutes: nextMinutes % 60,
            seconds: nextSeconds % 60,
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]); // ONLY depend on isRunning

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
        virtualSpeedRef.current = nextSpeed; // Update ref for stable interval access
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        gasPressed.current = true;
        brakePressed.current = false;
        setIsGasActive(true);
        setIsBrakeActive(false);
      }
      if (e.key === 'ArrowLeft') {
        brakePressed.current = true;
        gasPressed.current = false;
        setIsBrakeActive(true);
        setIsGasActive(false);
      }
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

  // Helper for status colors
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'alert': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'fatigue': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'danger': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans p-4">
      {/* HEADER SECTION */}
      <header className="max-w-[1600px] mx-auto flex items-center justify-between mb-6 px-6 py-4 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-red-500 rounded-full"></div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Driver <span className="text-red-500">Details</span>
          </h1>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center group">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-zinc-300 transition-colors">Travelled Distance</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              {stats.distance.toFixed(2)} <span className="text-sm opacity-50">KM</span>
            </p>
          </div>
          <div className="text-center group">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-zinc-300 transition-colors">Driving Hour</p>
            <p className="text-2xl font-mono font-bold text-white">
              {String(stats.hours).padStart(2, '0')}:{String(stats.minutes).padStart(2, '0')}:{String(stats.seconds).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button 
              onClick={startTest}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-900/20 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              START
            </button>
          ) : (
            <button 
              onClick={stopTest}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-red-900/20 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
              STOP
            </button>
          )}
          <button 
            onClick={() => { stopTest(); reset(); setStats({ distance: 0, hours: 0, minutes: 0, seconds: 0 }); setSessionId(`demo-session-${Date.now()}`); }}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition-all active:scale-95 border border-zinc-700"
          >
            RESET
          </button>
        </div>
      </header>

      {/* MAIN DASHBOARD GRID */}
      <main className="max-w-[1600px] mx-auto grid grid-cols-[300px_1fr_300px] gap-6">
        
        {/* LEFT COLUMN: KEY DETAIL CARDS */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Driver ID</p>
            <p className="text-lg font-bold text-white truncate group-hover:text-zinc-200 transition-colors uppercase italic">{driverId || "Anonymous"}</p>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Session ID</p>
            <p className="text-xs font-mono text-zinc-400 break-all opacity-80 group-hover:opacity-100 transition-opacity">
              {sessionId}
            </p>
          </div>
          <div className={`p-5 rounded-2xl border shadow-xl transition-all ${getStatusColor(fatigueStatus)}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">Fatigue Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse bg-current`}></div>
              <p className="text-xl font-black uppercase italic tracking-wider">{fatigueStatus}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Steering Angle</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-mono font-bold text-white">{steering.toFixed(1)}°</p>
              <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (Math.abs(steering) / 45) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="flex flex-col gap-6">
          {/* FACE SCREEN */}
          <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-zinc-800 bg-black shadow-2xl group transition-all duration-500 hover:border-zinc-700">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
            <div className="absolute top-4 left-6 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`}></div>
              <span className="text-[10px] font-black text-white/80 tracking-widest uppercase">Live Feed</span>
            </div>
            {requestError && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="bg-red-600/90 backdrop-blur-md text-white font-bold py-3 px-6 rounded-2xl border border-red-500 shadow-2xl animate-shake">
                  {requestError}
                </p>
              </div>
            )}
          </div>

          {/* CONTROLS ROW: PRESERVED PEDALS & METERS */}
          <div className="flex items-center justify-between px-10 py-8 bg-zinc-900/80 rounded-[40px] border border-zinc-800/80 shadow-2xl relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            {/* Brake Pedal */}
            <div
              className={`relative flex flex-col items-center w-[100px] cursor-pointer select-none transition-transform active:scale-95`}
              onMouseDown={(e) => { e.preventDefault(); brakePressed.current = true; gasPressed.current = false; setIsBrakeActive(true); setIsGasActive(false); }}
              onMouseUp={(e) => { e.preventDefault(); brakePressed.current = false; setIsBrakeActive(false); }}
              onMouseLeave={(e) => { e.preventDefault(); brakePressed.current = false; setIsBrakeActive(false); }}
              onTouchStart={() => { brakePressed.current = true; gasPressed.current = false; setIsBrakeActive(true); setIsGasActive(false); }}
              onTouchEnd={() => { brakePressed.current = false; setIsBrakeActive(false); }}
            >
              <div className={`relative w-full h-[110px] rounded-[15px] bg-gradient-to-b from-[#f2f2f2] to-[#b3b3b3] border-[2.5px] border-[#808080] shadow-[0_6px_12px_rgba(0,0,0,0.6)] transition-all flex flex-col items-center py-2 z-10 box-border ${isBrakeActive ? 'border-b-[3px] border-b-[#8c8c8c] translate-y-[5px]' : 'border-b-[8px] border-b-[#8c8c8c] translate-y-0'}`}>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-zinc-900 shadow-inner"></div>
                  ))}
                </div>
                <span className="text-[#2b2b2b] font-black uppercase text-[12px] tracking-widest mt-auto mb-2">Brake</span>
              </div>
              <div className="w-6 h-10 bg-zinc-700 -mt-1 rounded-b-md"></div>
            </div>

            {/* RPM Meter */}
            <div className="relative w-44 h-44 bg-zinc-950 rounded-full border-[6px] border-zinc-800 shadow-inner flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" stroke="#27272a" strokeWidth="6" />
                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="0 2" />
                <path d="M 75 30 A 40 40 0 0 1 80 80" fill="none" stroke="#ef4444" strokeWidth="6" />
              </svg>
              <div className="text-center z-10 translate-y-2">
                <p className="text-3xl font-mono font-black text-white">{calibratedRpm}</p>
                <p className="text-[10px] font-black text-zinc-500 tracking-[0.3em]">RPM</p>
              </div>
              <div 
                className="absolute w-1 h-[70px] bg-red-500 origin-bottom rounded-full shadow-lg transition-transform duration-75"
                style={{ bottom: '50%', transform: `rotate(${-120 + (accelNorm * 240)}deg)` }}
              ></div>
              <div className="w-4 h-4 bg-zinc-300 rounded-full shadow-lg border-2 border-zinc-900 z-20"></div>
            </div>

            {/* Speed Meter */}
            <div className="relative w-36 h-36 bg-zinc-950 rounded-full border-[6px] border-zinc-800 shadow-inner flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M 20 80 A 40 40 0 1 1 80 80" fill="none" stroke="#27272a" strokeWidth="5" />
                <path d="M 75 30 A 40 40 0 0 1 80 80" fill="none" stroke="#ef4444" strokeWidth="5" />
              </svg>
              <div className="text-center z-10 translate-y-2">
                <p className="text-2xl font-mono font-black text-emerald-400">{Math.round(virtualSpeed * 36)}</p>
                <p className="text-[8px] font-black text-zinc-500 tracking-[0.2em]">KM/H</p>
              </div>
              <div 
                className="absolute w-1 h-[55px] bg-red-500 origin-bottom rounded-full shadow-lg transition-transform duration-75"
                style={{ bottom: '50%', transform: `rotate(${-120 + ((virtualSpeed / 5) * 240)}deg)` }}
              ></div>
              <div className="w-3 h-3 bg-zinc-300 rounded-full shadow-lg border-2 border-zinc-900 z-20"></div>
            </div>

            {/* Gas Pedal */}
            <div
              className={`relative flex flex-col items-center w-[100px] cursor-pointer select-none transition-transform active:scale-95`}
              onMouseDown={(e) => { e.preventDefault(); gasPressed.current = true; brakePressed.current = false; setIsGasActive(true); setIsBrakeActive(false); }}
              onMouseUp={(e) => { e.preventDefault(); gasPressed.current = false; setIsGasActive(false); }}
              onMouseLeave={(e) => { e.preventDefault(); gasPressed.current = false; setIsGasActive(false); }}
              onTouchStart={() => { gasPressed.current = true; brakePressed.current = false; setIsGasActive(true); setIsBrakeActive(false); }}
              onTouchEnd={() => { gasPressed.current = false; setIsGasActive(false); }}
            >
              <div className={`relative w-full h-[110px] rounded-[15px] bg-gradient-to-b from-[#f2f2f2] to-[#b3b3b3] border-[2.5px] border-[#808080] shadow-[0_6px_12px_rgba(0,0,0,0.6)] transition-all flex flex-col items-center py-2 z-10 box-border ${isGasActive ? 'border-b-[3px] border-b-[#8c8c8c] translate-y-[5px]' : 'border-b-[8px] border-b-[#8c8c8c] translate-y-0'}`}>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-zinc-900 shadow-inner"></div>
                  ))}
                </div>
                <span className="text-[#2b2b2b] font-black uppercase text-[12px] tracking-widest mt-auto mb-2">Gas</span>
              </div>
              <div className="w-6 h-10 bg-zinc-700 -mt-1 rounded-b-md"></div>
            </div>
          </div>

          {/* ALERTS LOGS */}
          <div className="flex-1 bg-zinc-900/80 rounded-3xl border border-zinc-800/80 shadow-2xl p-6 flex flex-col min-h-[220px]">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 Alert Logs History
               </h3>
               <span className="text-[10px] font-mono text-zinc-600">{alerts.length} Records</span>
             </div>
             <div className="space-y-2 overflow-auto max-h-[160px] custom-scrollbar pr-2">
               {alerts.length === 0 ? (
                 <div className="h-24 flex items-center justify-center text-zinc-600 italic text-sm">
                   No critical safety events recorded.
                 </div>
               ) : (
                 alerts.slice().reverse().map((alert) => (
                   <div 
                    key={alert.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:translate-x-1 ${
                      alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-800/40 border-zinc-700/50'
                    }`}
                   >
                     <div className="flex items-center gap-4">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                         alert.severity === 'high' ? 'bg-red-500 text-white' : 'bg-zinc-700 text-zinc-300'
                       }`}>
                         {alert.type}
                       </span>
                       <p className="text-sm font-bold text-zinc-200">{alert.message}</p>
                     </div>
                     <span className="text-[10px] font-mono text-zinc-500">{utils.formatTimestamp(alert.timestamp)}</span>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FATIGUE METRICS */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Eye Aspect Ratio (EAR)</p>
            <p className="text-3xl font-mono font-black text-white">{fatigueDebug?.metrics?.ear ?? "0.00"}</p>
            <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
               <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (fatigueDebug?.metrics?.ear || 0) * 200)}%` }}
               ></div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Mouth Aspect Ratio (MAR)</p>
            <p className="text-3xl font-mono font-black text-white">{fatigueDebug?.metrics?.mar ?? "0.00"}</p>
            <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
               <div 
                className="h-full bg-fuchsia-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (fatigueDebug?.metrics?.mar || 0) * 100)}%` }}
               ></div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Fatigue Score</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.3)]">{fatigueDebug?.fatigue_score ?? "0"}</p>
              <div className="flex-1 space-y-1">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, fatigueDebug?.fatigue_score || 0)}%` }}
                  ></div>
                </div>
                <p className="text-[8px] font-bold text-zinc-500 text-right uppercase tracking-[0.2em]">Risk Level</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Last Detection Event</p>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-zinc-800 rounded-xl">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-black text-white uppercase italic tracking-tighter truncate">
                {fatigueDebug?.event?.replace('_', ' ') || "Scanning..."}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Global CSS for scrollbars and animations */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
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

export default AiServiceTest;

