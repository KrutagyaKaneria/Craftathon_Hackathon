import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
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

  const [isRunning, setIsRunning] = useState(true);
  const [requestError, setRequestError] = useState('');
  const [fatigueDebug, setFatigueDebug] = useState(null);

  // Real Session Stats
  const [stats, setStats] = useState({ distance: 0, hours: 0, minutes: 0, seconds: 0 });
  const virtualSpeedRef = useRef(0);
  const [virtualSpeed, setVirtualSpeed] = useState(0);

  const driverId = verifiedDriver?._id || verifiedDriver?.id;
  const sessionId = session?._id || session?.id || session?.session_id;

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

  // RPM Calculation
  const idleRpm = 750;
  const maxRpm = 3800;
  const accelNorm = Math.max(0, Math.min(1, acceleration / 5));
  const calibratedRpm = Math.round(idleRpm + ((accelNorm ** 1.35) * (maxRpm - idleRpm)));

  // Redirect if session lost
  useEffect(() => {
    if (!verifiedDriver || !selectedVehicle || !session) {
      navigate('/');
    }
  }, [verifiedDriver, selectedVehicle, session, navigate]);

  // Session Timer & Distance
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setStats((prev) => {
          const nextSeconds = prev.seconds + 1;
          const nextMinutes = prev.minutes + Math.floor(nextSeconds / 60);
          const nextHours = prev.hours + Math.floor(nextMinutes / 60);

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
  }, [isRunning]);

  // Physics Engine for Pedals
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

  // Rash Detection Integration
  useEffect(() => {
    if (!isRunning || !driverId || !sessionId) return;
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
        console.error('Rash detection failure:', error);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning, driverId, sessionId]);

  // Socket.io for Real-time Alerts
  useEffect(() => {
    if (!verifiedDriver?.ownerId) return;

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      setWsConnected(true);
      console.log('🔌 Connected to Alert Socket');
      socket.emit('join_owner_room', verifiedDriver.ownerId);
    });

    socket.on('disconnect', () => setWsConnected(false));

    socket.on('new_alert', (data) => {
      console.log('🔔 Live alert received via Socket:', data);
      // Only process alerts for THIS session if applicable, or all alerts for the owner
      if (data.sessionId && data.sessionId !== sessionId) return;

      addAlert({
        type: data.type || 'system',
        severity: data.severity || 'low',
        message: data.message || `Remote alert: ${data.type}`,
        timestamp: data.timestamp
      });
    });

    return () => socket.disconnect();
  }, [verifiedDriver?.ownerId, sessionId, addAlert, setWsConnected]);

  // Camera Startup
  useEffect(() => {
    startCamera();
    startFatigueDetection();
    return () => {
      stopCamera();
      stopFatigueDetection();
    };
  }, [startCamera, stopCamera, startFatigueDetection, stopFatigueDetection]);

  // Alerts Notifications
  useEffect(() => {
    if (!toasts.length) return;
    const highToast = toasts.find((item) => item.severity === 'high');
    if (highToast) {
      utils.flashScreen();
      utils.playAlertSound();
    }
    const timer = setTimeout(() => dismissToast(toasts[0].id), 4000);
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

  if (!verifiedDriver || !selectedVehicle || !session) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans p-4">
      {/* HEADER SECTION */}
      <header className="max-w-[1600px] mx-auto flex items-center justify-between mb-6 px-6 py-4 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Guard<span className="text-blue-500">Dashboard</span>
          </h1>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center group">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Travelled Distance</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
              {stats.distance.toFixed(2)} <span className="text-sm opacity-50">KM</span>
            </p>
          </div>
          <div className="text-center group">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Session Duration</p>
            <p className="text-2xl font-mono font-bold text-white">
              {String(stats.hours).padStart(2, '0')}:{String(stats.minutes).padStart(2, '0')}:{String(stats.seconds).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Bus Number</span>
            <span className="text-lg font-black text-white italic">{selectedVehicle.vehicle_number}</span>
          </div>
          <button
            onClick={() => { reset(); navigate('/'); }}
            className="px-6 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 font-bold text-sm transition-all active:scale-95"
          >
            END TRIP
          </button>
        </div>
      </header>

      {/* MAIN DASHBOARD GRID */}
      <main className="max-w-[1600px] mx-auto grid grid-cols-[300px_1fr_300px] gap-6">

        {/* LEFT COLUMN: DRIVER & VEHICLE INFO */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl overflow-hidden relative">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Verified Driver</p>
            <div className="flex items-center gap-4">
              <img
                src={verifiedDriver.profilePhoto || "/default-avatar.png"}
                className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500"
                alt="Driver"
              />
              <div>
                <p className="text-xl font-black text-white uppercase italic">{verifiedDriver.firstName} {verifiedDriver.lastName}</p>
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  VERIFIED
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Bus Model</p>
            <p className="text-lg font-bold text-white uppercase italic truncate">
              {selectedVehicle.vehicle_name || selectedVehicle.model || "Volvo Metro"}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border shadow-xl transition-all ${getStatusColor(fatigueStatus)} uppercase italic`}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">Fatigue Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse bg-current`}></div>
              <p className="text-xl font-black tracking-wider">{fatigueStatus}</p>
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

        {/* CENTER COLUMN: LIVE FEED & METERS */}
        <div className="flex flex-col gap-6">
          {/* CAMERA FEED */}
          <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-zinc-800 bg-black shadow-2xl group transition-all duration-500 hover:border-zinc-700">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

            <div className="absolute top-4 left-6 flex items-center gap-3">
              <div className={`flex items-center gap-2 px-2 py-1 rounded bg-black/50 border border-white/10 backdrop-blur-sm`}>
                <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                <span className="text-[9px] font-black text-white tracking-widest uppercase">Live Surveillance</span>
              </div>
              <div className={`flex items-center gap-2 px-2 py-1 rounded bg-black/50 border border-white/10 backdrop-blur-sm`}>
                <span className="text-[9px] font-black text-white tracking-widest uppercase">ID: {sessionId?.slice(-8)}</span>
              </div>
            </div>

            {requestError && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="bg-red-600/90 backdrop-blur-md text-white font-bold py-3 px-6 rounded-2xl border border-red-500 shadow-2xl animate-shake">
                  {requestError}
                </p>
              </div>
            )}
          </div>

          {/* CONTROLS & GAUGES */}
          <div className="flex items-center justify-between px-10 py-8 bg-zinc-900/80 rounded-[40px] border border-zinc-800/80 shadow-2xl relative overflow-hidden">
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
                <div className="grid grid-cols-2 gap-2 mt-4 text-zinc-900 opacity-20">||||</div>
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
                <div className="grid grid-cols-2 gap-2 mt-4 text-zinc-900 opacity-20">||||</div>
                <span className="text-[#2b2b2b] font-black uppercase text-[12px] tracking-widest mt-auto mb-2">Gas</span>
              </div>
              <div className="w-6 h-10 bg-zinc-700 -mt-1 rounded-b-md"></div>
            </div>
          </div>

          <div className="flex-1 bg-zinc-900/80 rounded-3xl border border-zinc-800/80 shadow-2xl p-6 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Real-time Safety Alert Log
              </h3>
              <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SOCKET ACTIVE
              </div>
            </div>
            <div className="space-y-2 overflow-auto max-h-[160px] custom-scrollbar pr-2">
              {alerts.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-zinc-600 italic text-sm">
                  Monitoring active. No critical events detected.
                </div>
              ) : (
                alerts.slice().reverse().map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:translate-x-1 ${alert.severity === 'high' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-zinc-800/40 border-zinc-700/50'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${alert.severity === 'high' ? 'bg-red-500 text-white' : 'bg-zinc-700 text-zinc-300'
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

        {/* RIGHT COLUMN: AI ANALYSIS METRICS */}
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
                <p className="text-[8px] font-bold text-zinc-500 text-right uppercase tracking-[0.1em]">Safety Threshold</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl group hover:border-zinc-700 transition-all">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">System Diagnostic</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-zinc-500">Acceleration</span>
                <span className="text-white">{acceleration.toFixed(2)} G</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-zinc-500">Braking Pressure</span>
                <span className="text-white">{Math.abs(brake).toFixed(2)} bar</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-zinc-500">Detection Latency</span>
                <span className="text-emerald-400">24ms</span>
              </div>
            </div>
          </div>
        </div>
      </main>

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
export default Dashboard;