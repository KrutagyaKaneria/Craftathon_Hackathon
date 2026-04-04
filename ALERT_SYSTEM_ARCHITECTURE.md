# Alert System - Complete Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React Native)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Socket Event                                                         │
│  (new_alert)                                                          │
│      ↓                                                                 │
│  ┌─────────────────┐                                                  │
│  │   useAlerts     │  Hook that listens to socket events              │
│  │     Hook        │                                                  │
│  └────────┬────────┘                                                  │
│           │                                                           │
│   ┌───────┴──────────┐                                               │
│   ↓                  ↓                                                │
│  AddAlert      AddNotification                                       │
│  (persistent)   (top banner)                                         │
│   │                 │                                                │
│   ↓                 ↓                                                │
│  ┌──────────────────────────────┐                                   │
│  │     alertsStore (Zustand)    │                                   │
│  ├──────────────────────────────┤                                   │
│  │ alerts[]                     │  (Alerts tab)                    │
│  │ notifications[]              │  (Queue for banner)              │
│  │ currentNotification          │  (Current banner)                │
│  └────┬──────────────────────┬──┘                                   │
│       │                      │                                      │
│   ┌───┴───┐           ┌─────┴────────┐                             │
│   ↓       ↓           ↓              ↓                             │
│ Alerts  Delete   NotificationBanner  _layout.tsx                 │
│ Tab     API             (UI)         (Provider)                   │
│                                                                    │
│ 🎨 UI COMPONENTS:                                                 │
│ • NotificationBanner - Top sliding notification                   │
│ • AlertCard - Alert item in Alerts tab                            │
│ • Severity badge - Color coded (Red/Orange/Blue)                  │
│                                                                    │
└────────────────────────────────────┬──────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    ↓                                ↓
            ┌───────────────┐          ┌──────────────────────┐
            │   API Calls   │          │  Socket.io Events    │
            │ DELETE,PUT    │          │  (Real-time)         │
            └───────┬───────┘          └──────┬───────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ↓
        ┌────────────────────────────────────────────────┐
        │         Backend (Node.js/Express)              │
        ├────────────────────────────────────────────────┤
        │                                                │
        │  Alert Routes (/api/alerts)                   │
        │  ├─ GET /alerts - Get all                     │
        │  ├─ GET /alerts/:id - Get one                 │
        │  ├─ DELETE /alerts/:id - Delete alert        │
        │  ├─ PUT /alerts/:id - Update alert           │
        │  └─ PUT /alerts/:id/resolve - Mark resolved  │
        │                                                │
        │  Alert Controller                            │
        │  ├─ getAllAlerts()                            │
        │  ├─ getAlertById()                            │
        │  ├─ createAlert()                             │
        │  ├─ updateAlert()                             │
        │  ├─ deleteAlert()                             │
        │  └─ markAsResolved()                          │
        │                                                │
        └────────────────┬─────────────────────────────┘
                         ↓
        ┌────────────────────────────┐
        │   MongoDB (Alert Collection)│
        ├────────────────────────────┤
        │ • _id                       │
        │ • ownerId (multi-tenant)    │
        │ • driverName, vehicleNumber │
        │ • eventType, severity       │
        │ • timestamp, resolved       │
        │ • telemetryData            │
        │ • (more fields...)         │
        └────────────────────────────┘
```

---

## 📱 User Interaction Flows

### Flow 1: Alert Notification
```
1. Driver triggers alert event (eyes close 3s)
2. Backend AI service detects it
3. Socket emits 'new_alert' event
4. useAlerts hook receives event
5. Adds to both:
   - alerts[] (for persistent storage)
   - notifications[] (for queue)
6. Sets currentNotification in store
7. NotificationBanner re-renders with notification
8. Banner slides down from top
9. Sound plays + vibration (if high-risk)
10. User sees: Title + Message + Vehicle info
11. User action:
    a) SWIPE UP → Auto-dismisses notification (stays in alerts tab)
    b) CLICK × → Delete permanently (removes from DB too)
    c) Wait 5-8s → Auto-dismisses
```

### Flow 2: Delete from Banner
```
User sees notification
    ↓
Clicks × button
    ↓
onDelete() called
    ↓
DELETE /api/alerts/:id
    ↓
Backend removes from DB
    ↓
deleteNotificationPermanently()
    ↓
Removed from notifications queue
    ↓
RemovedFromcurrentNotification
    ↓
Banner disappears
    ↓
Next notification shows (if queued)
```

### Flow 3: Delete from Alerts Tab
```
User opens Alerts tab
    ↓
Sees list of all alerts
    ↓
Swipe down to see details
    ↓
Click "Delete" button
    ↓
Confirmation dialog
    ↓
Yes → DELETE /api/alerts/:id
    ↓
Backend deletes from MongoDB
    ↓
deleteAlert() in store
    ↓
Alert removed from list
```

### Flow 4: Resolve Alert
```
User opens Alerts tab
    ↓
Clicks "Resolve" button
    ↓
markAsResolved(alertId)
    ↓
Alert marked resolved: true
    ↓
Alert fades out (opacity 0.7)
    ↓
✓ Checkmark badge shows
    ↓
Can filter by: All / High / Medium / Low / Resolved
```

---

## 🔊 Sound & Haptic Pattern

### Sound Playback
```
HIGH SEVERITY ALERT
├─ Audio: alert-beep.mp3
├─ Duration: ~500ms-1s
├─ Volume: Device media volume
└─ Platform: iOS + Android

MEDIUM/LOW
└─ No sound (vibration only)
```

### Haptic Feedback
```
HIGH RISK: [0, 200, 100, 200]
├─ 0ms wait
├─ 200ms vibrate
├─ 100ms pause
└─ 200ms vibrate (double tap effect)

MEDIUM: [0, 100]
├─ 0ms wait
└─ 100ms vibrate (single tap)

LOW: No vibration
```

---

## 🔄 Data Models

### Notification (Frontend)
```typescript
{
  _id: string              // Unique ID
  type: 'alert'|'warning'|'info'|'success'
  severity: 'high'|'medium'|'low'
  title: string            // "🔴 HIGH RISK ALERT"
  message: string          // "Eye closure detected for 3s"
  timestamp: string        // ISO date
  driverName?: string      // "John Doe"
  vehicleNumber?: string   // "ABC-123"
  actionType?: string      // "eye_closure"
  dismissedAt?: string     // When user swiped up
}
```

### Alert (Database)
```javascript
{
  _id: ObjectId
  ownerId: string          // Multi-tenant key
  driverId: ObjectId
  vehicleId: ObjectId
  sessionId: ObjectId
  driverName: string
  vehicleNumber: string
  vehicleModel: string
  eventType: string        // "eye_closure", "rash_driving", etc.
  subtype: string          // "Eyes closed for 3 seconds"
  severity: "high"|"medium"|"low"
  timestamp: Date
  telemetryData: Object    // { eyeClosureDuration: "3s" }
  driverPhoto: string      // URL or base64
  resolved: boolean
  resolvedAt: Date
  resolvedBy: string
  notes: string
  createdAt: Date
  updatedAt: Date
}
```

---

## 🐛 Debugging & Testing

### Test High-Risk Alert
```typescript
import { testHighRiskNotification } from '@/services/testNotifications';

// In your component
<Button 
  title="Test Alert"
  onPress={testHighRiskNotification}
/>
```

### Monitor Store State
```typescript
import { testNotifications } from '@/services/testNotifications';

const { printSystemState } = testNotifications;
printSystemState(); // Logs current state to console
```

### Check Alert in Alerts Tab
1. Open Alerts tab
2. Should see your test alert in the list
3. Click "Delete" to test deletion
4. Should make API call and remove from list

---

## ⚠️ Common Issues & Fixes

### Issue: Notification not appearing
**Possible causes:**
- Socket event not being emitted
- useAlerts hook not connected to store
- NotificationBanner not in _layout.tsx

**Fix:**
1. Check backend socket emission
2. Verify useAlerts is called in app
3. Verify NotificationBanner is in Stack

### Issue: Sound not playing
**Possible causes:**
- Sound file missing
- Device media volume is 0
- App doesn't have audio permissions
- Only triggered for high-risk (by design)

**Fix:**
1. Place `alert-beep.mp3` in `assets/sounds/`
2. Check device volume
3. Test with high-severity alert

### Issue: Delete not working
**Possible causes:**
- Backend server not running
- Alert API not registered
- Alert ID format mismatch

**Fix:**
1. Check backend running on 5000
2. Verify routes registered: `app.use('/api/alerts', alertRoutes)`
3. Test with curl: `curl -X DELETE http://localhost:5000/api/alerts/test-id`

### Issue: Swipe not working
**Possible causes:**
- PanResponder conflict with parent ScrollView
- Gesture responder priority issue

**Fix:**
1. Check NotificationBanner isn't nested in ScrollView
2. Ensure PanResponder is created correctly
3. Test drag gesture on different parts of notification

---

## 📊 Performance Metrics

- **Banner slides down**: 300ms animation
- **Auto-dismiss delay**: 5-8 seconds
- **Delete API call**: ~200-500ms
- **Store state update**: <50ms
- **UI re-render**: <100ms

---

## ✅ Checklist for Production

- [ ] Alert model deployed to MongoDB
- [ ] Alert controller & routes added to backend
- [ ] Server.js updated with alert routes
- [ ] Socket events emitting alerts correctly
- [ ] NotificationBanner component working
- [ ] Sound file placed in assets/sounds/
- [ ] Haptic feedback tested on device
- [ ] Delete API tested with Postman
- [ ] Alerts tab displaying correctly
- [ ] Filtering by severity working
- [ ] Resolve button marking alerts resolved
- [ ] UI responsive on all screen sizes

---

## 📚 Related Files

- `components/NotificationBanner.tsx` - UI component
- `store/alertsStore.ts` - State management
- `app/(tabs)/alerts.tsx` - Alerts tab screen
- `app/_layout.tsx` - Root layout with banner
- `hooks/useAlerts.ts` - Socket event listener
- `backend/src/models/Alert.js` - MongoDB schema
- `backend/src/controllers/alertController.js` - CRUD logic
- `backend/src/routes/alertRoutes.js` - API endpoints
- `services/testNotifications.ts` - Testing utilities

