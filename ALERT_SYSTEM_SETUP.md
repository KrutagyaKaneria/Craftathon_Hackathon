# Alert System Migration Guide

## Summary of Changes

You requested to replace blocking popup alerts with:
- ✅ Top notifications that slide down
- ✅ Swipe to dismiss functionality
- ✅ Delete button to remove from database
- ✅ Sound alert (beep) for high-risk alerts
- ✅ Persistent Alerts tab to view all alerts
- ✅ Separate Notifications section

This has been fully implemented! Here's what to do next.

---

## 🚀 Quick Setup

### 1. **Sound File Setup** (REQUIRED)
Place your alert beep sound at:
```
DriveGuard/assets/sounds/alert-beep.mp3
```

You can use:
- A free beep sound from Freesound.org
- Generate using beep-generator services
- Use an online tool to create a simple sine wave beep

If no file exists, the notification will still work but without sound.

### 2. **Database Setup** (REQUIRED)
The Alert model will auto-create the MongoDB collection:
```
mongodb://localhost:27017/driveguard
└─ alerts collection
```

### 3. **Backend Restart**
```bash
cd Native/backend
npm run dev
```

This will:
- Register `/api/alerts` routes
- Create indices on alerts collection
- Ready to receive delete requests

### 4. **Test the System**
Go to any screen and add test buttons:

```typescript
import { testHighRiskNotification, testMultipleNotifications } from '@/services/testNotifications';

export default function YourScreen() {
  return (
    <>
      <Button 
        title="Test High Risk Alert" 
        onPress={testHighRiskNotification}
      />
      <Button 
        title="Test Notification Sequence" 
        onPress={testMultipleNotifications}
      />
    </>
  );
}
```

---

## 🎯 How to Use

### For Users
1. **Notification appears** → Slides down from top
2. **Actions available**:
   - **Swipe up** - Dismiss (stays in Alerts tab)
   - **Click ×** - Delete from database
   - **Wait 5-8s** - Auto-dismisses
3. **View in Alerts tab**:
   - See all historical alerts
   - Filter by severity
   - Mark as resolved
   - Delete permanently

### For Developers
Use the test notification service:

```typescript
import { 
  testHighRiskNotification,
  testMediumRiskNotification,
  testLowRiskNotification,
  testMultipleNotifications,
  testDeleteNotification,
  printSystemState
} from '@/services/testNotifications';

// Test any scenario
testHighRiskNotification();    // Sound + vibration
testMediumRiskNotification();  // Vibration only
testLowRiskNotification();     // Silent notification
testMultipleNotifications();   // Queue test
testDeleteNotification();      // Delete test
printSystemState();            // Debug state
```

---

## 📋 Files Changed/Created

### Created Files (NEW):
- ✅ `components/NotificationBanner.tsx` - Top notification UI
- ✅ `services/testNotifications.ts` - Testing utilities
- ✅ `backend/src/models/Alert.js` - Database schema
- ✅ `backend/src/controllers/alertController.js` - API logic
- ✅ `backend/src/routes/alertRoutes.js` - Routes
- ✅ `ALERT_SYSTEM_GUIDE.md` - User guide
- ✅ `ALERT_SYSTEM_ARCHITECTURE.md` - Technical docs

### Modified Files:
- ✅ `store/alertsStore.ts` - Added notifications + delete
- ✅ `app/(tabs)/alerts.tsx` - Added delete button
- ✅ `app/_layout.tsx` - Using NotificationBanner
- ✅ `hooks/useAlerts.ts` - Connects socket to store
- ✅ `backend/src/server.js` - Added alert routes

### Asset Directory:
- 📁 `assets/sounds/` - For alert beep (create and add mp3)

---

## 🔄 Migration Path

### OLD System (Blocking Modal)
```
Alert Event
  ↓
AlertModal Popup (blocks UI)
  ↓
User must acknowledge
  ↓
No storage
```

### NEW System (Non-blocking Banner)
```
Alert Event
  ↓
Top Notification Banner (doesn't block)
  ↓
User can:
  • Swipe up to dismiss
  • Click × to delete
  • Ignore and keep working
  ↓
Stored in Alerts tab persistently
  ↓
Can mark as resolved or delete later
```

---

## ✅ Testing Checklist

### Frontend Tests
- [ ] Notification banner appears at top
- [ ] Banner slides down smoothly
- [ ] Swipe up dismisses notification
- [ ] Click × deletes notification
- [ ] Auto-dismisses after 5-8 seconds
- [ ] Sound plays for high-risk (if file exists)
- [ ] Vibration/haptic feedback works

### Alerts Tab Tests
- [ ] Alerts tab shows all alerts
- [ ] Resolve button marks as resolved
- [ ] Delete button removes from database
- [ ] Filter by severity works
- [ ] High-risk (red), Medium (orange), Low (blue)
- [ ] Shows driver name, vehicle number
- [ ] Shows timestamp

### Backend Tests
```bash
# Get all alerts
curl http://localhost:5000/api/alerts?ownerId=69cfXXXX

# Delete specific alert
curl -X DELETE http://localhost:5000/api/alerts/ALERT_ID

# Mark as resolved
curl -X PUT http://localhost:5000/api/alerts/ALERT_ID/resolve \
  -H "Content-Type: application/json" \
  -d '{"resolvedBy":"admin"}'
```

### Integration Tests
- [ ] Socket emits alerts correctly
- [ ] useAlerts hook receives and processes
- [ ] Notifications appear in store
- [ ] Alerts appear in persistent storage
- [ ] Delete syncs with database
- [ ] Real-time updates across tabs

---

## 🎨 Customization

### Change Auto-dismiss Time
File: `components/NotificationBanner.tsx` line ~45
```typescript
const dismissDuration = notification?.severity === 'high' ? 8000 : 5000;
// Change to: const dismissDuration = 10000; // 10 seconds
```

### Change Notification Colors
File: `components/NotificationBanner.tsx` line ~150
```typescript
const severityColors = {
  high: '#FF3B30',    // Red
  medium: '#FF9500',  // Orange
  low: '#4285F4',     // Blue
};
```

### Change Haptic Feedback
File: `components/NotificationBanner.tsx` line ~68
```typescript
if (severity === 'high') {
  Vibration.vibrate([0, 200, 100, 200]); // Double tap
}
```

### Add Notification Sound
1. Get an MP3 beep file
2. Place at: `assets/sounds/alert-beep.mp3`
3. System auto-loads and plays

---

## 🐛 Troubleshooting

### "Notification not appearing"
```
1. Check socket connection: Backend emitting events?
2. Check useAlerts hook: Is it running?
3. Check NotificationBanner: Is it in _layout.tsx?
4. Check store: useAlertsStore.getState() - is notification added?
```

### "Sound not playing"
```
1. File exists? assets/sounds/alert-beep.mp3
2. Device volume? Turn up media volume
3. Severity? Only high-risk plays sound
4. Permissions? Check iOS/Android audio permissions
```

### "Delete not working"
```
1. Backend running? npm run dev in backend/
2. API registered? Check server.js has alertRoutes
3. MongoDB running? Check connection
4. Alert ID valid? Test with real IDs
```

### "Swipe not working"
```
1. Not in ScrollView? Move NotificationBanner out
2. Check gesture setup? Review PanResponder code
3. Test on device? Some emulators have gesture issues
```

---

## 📞 Support

### For Socket Issues
Check: `backend/src/utils/socketHandler.js`
- Verify event emission on alert creation
- Check socket namespaces

### For Database Issues
Check: `backend/src/models/Alert.js`
- Verify MongoDB connection
- Check indices are created
- Review schema fields

### For Frontend Issues
Check: `components/NotificationBanner.tsx`
- Review animation code
- Check gesture responder
- Verify store connection

---

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Notification slides down from top
2. ✅ Sound plays (if high-risk)
3. ✅ Vibration happens
4. ✅ Can swipe to dismiss
5. ✅ Can click × to delete
6. ✅ Alert appears in Alerts tab
7. ✅ Can delete from Alerts tab
8. ✅ Database updates correctly

---

## 📲 Live Testing in Alerts Tab

1. Open the app
2. Trigger an alert (or use test button)
3. See notification banner at top
4. Open Alerts tab
5. See alert in the list
6. Try:
   - Resolving it (button turns green with ✓)
   - Deleting it (removed from list)
   - Filtering by severity
   - Viewing details

---

## 🚨 Final Notes

- **No more blocking popups!** Users can keep working
- **Persistent storage** - Alerts stay in database
- **Sound alerts** for critical issues
- **Non-intrusive** - Swipe to dismiss
- **Flexible filtering** - View by severity
- **One-click delete** - Easy cleanup

---

Happy alert monitoring! 🚀

