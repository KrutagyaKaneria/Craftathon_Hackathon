# Real-Time Alert System Integration Guide

## Overview
This system enables real-time data sharing between the web app and native mobile app through Socket.io, with priority-based alert handling.

## Architecture Flow

```
┌─────────────────────┐
│   Web App Frontend  │
│   (Dashboard)       │
└──────────┬──────────┘
           │
           │ Sends:
           │ - Sensor data (acceleration, brake, steering)
           │ - Fatigue detection results
           │ - Rash driving alerts
           │
           ▼
┌─────────────────────────┐
│  Backend Socket.io      │
│  (Port 5000)            │
│  - Receives telemetry   │
│  - Routes by owner ID   │
│  - Prioritizes alerts   │
└──────────┬──────────────┘
           │
           │ Emits:
           │ - new_alert (prioritized)
           │ - session_summary
           │ - vehicle_status_updated
           │
           ▼
┌─────────────────────┐
│  Mobile App         │
│  (DriveGuard)       │
│  - Receives alerts  │
│  - Displays in UI   │
│  - Shows priority   │
└─────────────────────┘
```

## Implementation Details

### 1. **Web App Telemetry Service** (`telemetryService.js`)
Handles all data emissions to the backend:

#### Methods:
- `sendSensorData()` - Sends acceleration, brake, steering, speed
- `sendFatigueAlert()` - Sends detected fatigue with severity
- `sendRashDrivingAlert()` - Sends rash driving events with confidence
- `sendCombinedAnalysis()` - Sends complete session analysis
- `sendSessionSummary()` - Sends end-of-session statistics

**Usage:**
```javascript
import { telemetryService } from '../services/telemetryService.js';

// Send fatigue alert
telemetryService.sendFatigueAlert(driverId, sessionId, {
  status: 'drowsy',
  event: 'yawning',
  confidence: 0.92
});

// Send rash driving
telemetryService.sendRashDrivingAlert(driverId, sessionId, {
  event: 'hard_braking',
  acceleration: 0,
  brake: -4.5,
  steering: 0
});
```

### 2. **Alert Priority System**

Severity levels are automatically assigned based on event type:

```javascript
HIGH:    'drowsy', 'yawning', 'hard_braking', 'speeding'
MEDIUM:  'hard_acceleration', 'sharp_turn', 'distracted', 'no_face'
LOW:     Default for unknown events
```

### 3. **Backend Processing** (`socketHandler.js`)

**Incoming Events:**
- `telemetry_data` - Continuous sensor readings
- `driver_event` - Fatigue/rash driving alerts
- `driver_analysis` - Combined analysis
- `session_end` - Session summary

**Outgoing Events (to specific owner):**
- `new_alert` - With priority-based severity
- `session_summary` - Final statistics
- `vehicle_status_updated` - Vehicle state

### 4. **Frontend Alert Handling** (`useSocket.js`)

Alerts are received and:
1. Formatted with type, severity, message
2. Added to Zustand store (`appStore.js`)
3. Trigger notifications if high priority:
   - Alert sound plays
   - Screen flashes red
   
### 5. **Mobile App Reception** (`socketService.ts`)

Listens for:
- `new_alert` - Displays in alerts section
- `session_summary` - Shows end-of-session stats
- Filters and displays based on severity

## Data Structures

### Telemetry Data Payload
```javascript
{
  driver_id: string,
  session_id: string,
  timestamp: ISO string,
  metrics: {
    acceleration: number (-5 to 5),
    brake: number (-5 to 0),
    steering: number (-1 to 1),
    speed: number (0-5)
  }
}
```

### Driver Event (Fatigue/Rash) Payload
```javascript
{
  driver_id: string,
  session_id: string,
  timestamp: ISO string,
  event_type: 'fatigue_detection' | 'rash_driving',
  status: string,
  severity: 'high' | 'medium' | 'low',
  data: {
    event: string,
    confidence: number (0-1),
    // event-specific data
  }
}
```

### Alert Sent to Owner
```javascript
{
  type: string (event_type),
  event: string (specific event),
  severity: 'high' | 'medium' | 'low',
  timestamp: ISO string,
  driver_id: string,
  session_id: string,
  driver_name: string,
  vehicle_number: string,
  data: object
}
```

## Testing the Flow

### 1. **Start Backend**
```bash
cd Native/backend
npm run dev
```
Should see: `🔌 Socket.io initialized`

### 2. **Start Web App**
```bash
cd web-app/frontend
npm run dev
```

### 3. **Connect Mobile App**
- The app will authenticate automatically with `ownerId`
- Should see: `👤 Authenticated for owner room`

### 4. **Trigger Events in Web App**
- Start dashboard, enable camera
- When fatigue detected: Alert emitted
- Mobile app receives: `🔔 Received new alert via WebSocket`
- Alert appears in mobile app with priority color

### Example Console Output

**Web App:**
```
📊 Sent sensor telemetry: {...}
😴 Sent fatigue alert: {...severity: 'high'...}
```

**Backend:**
```
📊 Received telemetry from driver: {...}
🔔 Received fatigue_detection event: drowsy
🚨 Alert [high] for owner ...: fatigue_detection - drowsy
📣 Forwarding high alert to owner room: owner:...
```

**Mobile App:**
```
✅ Connected to WebSocket server
🔓 WebSocket authenticated: {...}
🔔 Received new alert via WebSocket: {...severity: 'high'...}
```

## Key Features

✅ **Real-time Transmission** - Latency < 100ms
✅ **Priority-Based Alerts** - Automatic severity assignment
✅ **Owner Isolation** - Each owner only sees their data
✅ **Session Tracking** - All events linked to session_id
✅ **Scalable** - Can handle multiple drivers/owners
✅ **Fallback Support** - Works with JWT or ownerId

## Running Telemetry Service

The service automatically initializes when you connect to Socket.io:

```javascript
// In useSocket.js
telemetryService.setSocket(socket);

// Now all telemetry methods work
telemetryService.sendFatigueAlert(driverId, sessionId, fatigueData);
```

## Alert Display Priority

**High Severity Alerts:**
- ⚠️ Display immediately
- 🔊 Play alert sound
- 🟥 Flash screen red
- 📱 Show in alerts section

**Medium Severity Alerts:**
- ⚠️ Display in alerts section
- 🔔 Notification badge

**Low Severity Alerts:**
- ℹ️ Display in alerts history only

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Socket not connecting | Check backend running on :5000 |
| Alerts not received | Verify `ownerId` matches in DB |
| Console errors | Check import paths for telemetryService |
| No telemetry sent | Ensure WebSocket connected first |

## Future Enhancements

- [ ] Persistent alert storage in MongoDB
- [ ] Alert acknowledgment tracking
- [ ] Custom alert thresholds per owner
- [ ] Alert analytics dashboard
- [ ] Multi-device alert synchronization
- [ ] Cloud storage for session analytics
