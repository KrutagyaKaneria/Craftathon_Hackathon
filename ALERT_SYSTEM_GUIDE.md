# Alert & Notification System - Implementation Guide

## Overview
The alert system has been completely redesigned to replace blocking popup alerts with a modern notification banner that comes from the top, can be swiped away, and provides persistent storage of all alerts with delete functionality.

---

## 🎯 What Changed

### 1. **Notification Banner (Top Notification)**
- **File**: `components/NotificationBanner.tsx`
- **Features**:
  - Slides down from top of screen (non-blocking)
  - Swipe up to dismiss
  - Click × button to delete permanently
  - Auto-dismisses after 5-8 seconds (configurable by severity)
  - Haptic feedback for high-risk alerts
  - Sound alert for high-risk alerts (beep sound)
  - Severity indicators: 🔴 High Risk, 🟡 Medium, 🔵 Low

### 2. **Alerts Store (State Management)**
- **File**: `store/alertsStore.ts`
- **Separated into two sections**:
  - **Alerts**: Persistent high-risk alerts that stay in the "Alerts" tab
  - **Notifications**: Temporary notifications that appear as top banner
- **Actions**:
  - `addAlert()` - Add to persistent alerts section
  - `addNotification()` - Add to notification banner
  - `dismissNotification()` - Dismiss top notification
  - `deleteAlert()` - Delete from alerts section
  - `deleteNotificationPermanently()` - Delete from DB and UI

### 3. **Alerts Tab Screen**
- **File**: `app/(tabs)/alerts.tsx`
- **Features**:
  - Filter by severity (High, Medium, Low, Resolved)
  - Resolve alerts (change status to resolved)
  - Delete alerts (removed from store and DB)
  - Real-time connection status
  - Eye closure duration tracking
  - Vehicle & driver info with photos
  - Telemetry data display

### 4. **Backend Alert System**
- **Alert Model**: `src/models/Alert.js`
  - Stores all alerts with timestamps
  - Tracks severity, resolution status
  - Links to driver/vehicle/session
  - Includes telemetry data

- **Alert Controller**: `src/controllers/alertController.js`
  - `GET /api/alerts` - Get all alerts
  - `GET /api/alerts/high-risk` - Get high-risk alerts only
  - `GET /api/alerts/:id` - Get specific alert
  - `POST /api/alerts` - Create new alert
  - `PUT /api/alerts/:id` - Update alert
  - `PUT /api/alerts/:id/resolve` - Mark as resolved
  - `DELETE /api/alerts/:id` - Delete alert

- **Alert Routes**: `src/routes/alertRoutes.js`
  - Registered at `/api/alerts` endpoint

### 5. **Layout Integration**
- **File**: `app/_layout.tsx`
- **Changes**:
  - Replaced blocking `AlertModal` with `NotificationBanner`
  - Connected to `alertsStore` for notification management
  - Non-blocking design allows users to work while taking action

---

## 📊 Alert Types & Severity

### High Severity (🔴)
- Eye closure > 2 seconds
- Aggressive acceleration/deceleration
- Extreme speed violations
- Sound alert + vibration

### Medium Severity (🟡)
- Eye closure 1-2 seconds
- Lane departure detection
- Minor vibration

### Low Severity (🔵)
- Informational alerts
- Status updates
- No vibration

---

## 🔊 Sound & Haptic Feedback

### Enabled for High-Risk Alerts:
- **Beep Sound**: Audio notification (can be customized)
- **Vibration Pattern**: `[0, 200, 100, 200]` - Double vibration
- **Medium Risk**: Single vibration `[0, 100]`
- **Low Risk**: No haptic feedback

### Sound File Location:
- Place alert beep MP3/WAV in `assets/sounds/alert-beep.mp3`
- Currently auto-loads from project assets

---

## 🔄 Alert Lifecycle

```
1. Alert Generated (Backend)
   ↓
2. Socket Event Emitted
   ↓
3. useAlerts Hook Receives Event
   ↓
4. Adds to Both:
   - Persistent Alerts (alertsStore)
   - Notifications (for top banner)
   ↓
5. NotificationBanner Shows (Auto-dismiss)
   ↓
6. User Can:
   - Swipe up to dismiss (from DB)
   - Click × to delete (from DB)
   - View in Alerts tab to resolve/delete
```

---

## 💾 Delete Functionality

### From Top Banner:
1. Notification appears at top
2. User clicks × button
3. Calls `onDelete()` callback
4. API DELETE request to `/api/alerts/:id`
5. Removed from DB and UI

### From Alerts Tab:
1. View alert in list
2. Click "Delete" button
3. Confirmation dialog
4. API DELETE request
5. Removed from store and DB

### From Notifications Manager:
1. All notifications stored in `notificationsStore.notifications[]`
2. Swipe up or click × to dismiss
3. Permanent delete removes from DB

---

## 🎨 UI Components

### NotificationBanner Props:
```typescript
interface NotificationBannerProps {
  notification: NotificationData | null
  onDismiss: () => void          // Swipe or auto-dismiss
  onDelete: (id: string) => void  // Delete permanently
}
```

### Notification Data:
```typescript
interface NotificationData {
  _id: string
  type: 'alert' | 'warning' | 'info' | 'success'
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  timestamp: string
  driverName?: string
  vehicleNumber?: string
  actionType?: string
}
```

---

## 📲 API Endpoints

### Delete Alert
```
DELETE /api/alerts/:id
Response: { success: true, data: {...}, message: 'Alert deleted successfully' }
```

### Get All Alerts
```
GET /api/alerts?ownerId=<id>
Response: {
  success: true,
  data: [...],
  stats: { total, highRisk, mediumRisk, resolved }
}
```

### Mark as Resolved
```
PUT /api/alerts/:id/resolve
Body: { resolvedBy: string, notes?: string }
```

---

## ✅ Quick Start

### 1. Sound File Setup
Place your alert beep sound at:
```
DriveGuard/assets/sounds/alert-beep.mp3
```

### 2. Test Notifications
In any screen:
```typescript
const addNotification = useAlertsStore((state) => state.addNotification);

addNotification({
  _id: 'test-1',
  title: 'High Risk Alert',
  message: 'Eye closure detected',
  severity: 'high',
  type: 'alert',
  timestamp: new Date().toISOString(),
  driverName: 'John Doe',
  vehicleNumber: 'ABC123'
});
```

### 3. Delete from Backend
```bash
curl -X DELETE http://localhost:5000/api/alerts/alert-id
```

---

## 🔧 Configuration

### Auto-dismiss Duration:
Edit `NotificationBanner.tsx` line ~45:
```typescript
const dismissDuration = notification?.severity === 'high' ? 8000 : 5000;
```

### Sound Settings:
Edit `NotificationBanner.tsx` line ~57:
```typescript
if (severity !== 'high') return; // Only play for high severity
```

### Haptic Patterns:
Edit `NotificationBanner.tsx` line ~68:
```typescript
if (severity === 'high') {
  Vibration.vibrate([0, 200, 100, 200]); // Double tap
}
```

---

## 🐛 Troubleshooting

**Sound not playing?**
- Check if sound file exists at `assets/sounds/alert-beep.mp3`
- Verify device has media volume enabled
- Check iOS/Android audio permissions

**Swipe not working?**
- Ensure PanResponder is properly configured
- Check if view is inside a ScrollView (may conflict)

**Notifications not appearing?**
- Verify socket events are being emitted
- Check `useAlerts` hook is connected to store
- Ensure `NotificationBanner` is in _layout.tsx

**Delete not working?**
- Check backend server is running on port 5000
- Verify API endpoint `/api/alerts/:id` is registered
- Check network requests in React Native debugger

---

## 📝 Notes for Development

1. **Notification vs Alert**:
   - Notification = Temporary top banner (auto-dismiss)
   - Alert = Persistent in Alerts tab (requires manual action)

2. **High-Risk Alerts**:
   - Show sound + vibration
   - Display longer (8s vs 5s)
   - Prominent red color

3. **Socket Integration**:
   - useAlerts hook now adds to both stores
   - Actions split between notifications and alerts automatically
   - Delete from UI updates DB in real-time

4. **Database Persistence**:
   - All alerts stored in MongoDB Alert collection
   - Delete removes from DB permanently
   - Can export/archive alerts later if needed

---

## 🎉 Done!

Your alert system now features:
- ✅ Top notifications (non-blocking)
- ✅ Swipe to dismiss
- ✅ Delete functionality
- ✅ Sound alerts for high-risk
- ✅ Haptic feedback
- ✅ Persistent alerts section
- ✅ Filter by severity
- ✅ Backend storage
- ✅ Real-time socket integration
