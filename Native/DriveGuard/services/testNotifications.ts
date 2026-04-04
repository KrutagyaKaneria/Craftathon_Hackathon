/**
 * Test Notification System
 * 
 * Run this code in any component to trigger test notifications
 * Useful for testing the notification banner and alert system
 */

import useAlertsStore from '@/store/alertsStore';

/**
 * Example 1: Trigger a high-risk notification
 */
export const testHighRiskNotification = () => {
  const addNotification = useAlertsStore.getState().addNotification;
  const addAlert = useAlertsStore.getState().addAlert;

  const notification = {
    _id: `test-high-${Date.now()}`,
    type: 'alert' as const,
    severity: 'high' as const,
    title: '🔴 HIGH RISK ALERT',
    message: 'Eye closure detected for 3 seconds',
    timestamp: new Date().toISOString(),
    driverName: 'John Doe',
    vehicleNumber: 'ABC-123',
    actionType: 'eye_closure',
  };

  // Add to notifications (shows as top banner)
  addNotification(notification as any);

  // Also add to persistent alerts
  addAlert({
    _id: notification._id,
    driverName: notification.driverName,
    vehicleNumber: notification.vehicleNumber,
    eventType: 'Eye Closure',
    subtype: 'Eyes closed for 3 seconds',
    severity: 'high',
    timestamp: notification.timestamp,
    telemetryData: { eyeClosureDuration: '3 seconds' },
    resolved: false,
  });

  console.log('✅ High-risk test notification triggered');
};

/**
 * Example 2: Trigger a medium-risk notification
 */
export const testMediumRiskNotification = () => {
  const addNotification = useAlertsStore.getState().addNotification;

  const notification = {
    _id: `test-medium-${Date.now()}`,
    type: 'warning' as const,
    severity: 'medium' as const,
    title: '🟡 WARNING: Rash Driving',
    message: 'High acceleration detected',
    timestamp: new Date().toISOString(),
    driverName: 'Jane Smith',
    vehicleNumber: 'XYZ-789',
    actionType: 'rash_driving',
  };

  addNotification(notification as any);
  console.log('✅ Medium-risk test notification triggered');
};

/**
 * Example 3: Trigger a low-risk information notification
 */
export const testLowRiskNotification = () => {
  const addNotification = useAlertsStore.getState().addNotification;

  const notification = {
    _id: `test-low-${Date.now()}`,
    type: 'info' as const,
    severity: 'low' as const,
    title: '🔵 INFO: Speed Limit Zone',
    message: 'Entering 50 km/h zone',
    timestamp: new Date().toISOString(),
    driverName: 'Mike Wilson',
    vehicleNumber: 'DEF-456',
  };

  addNotification(notification as any);
  console.log('✅ Low-risk test notification triggered');
};

/**
 * Example 4: Test multiple notifications in sequence
 */
export const testMultipleNotifications = async () => {
  console.log('🧪 Starting notification sequence test...');
  
  testHighRiskNotification();
  
  // Wait 3 seconds between notifications
  await new Promise((resolve) => setTimeout(resolve, 3000));
  testMediumRiskNotification();
  
  await new Promise((resolve) => setTimeout(resolve, 3000));
  testLowRiskNotification();
  
  console.log('✅ All test notifications queued');
};

/**
 * Example 5: Test delete notification
 */
export const testDeleteNotification = () => {
  const notifications = useAlertsStore.getState().notifications;
  const deleteNotificationPermanently = useAlertsStore.getState().deleteNotificationPermanently;

  if (notifications.length > 0) {
    const firstNotifId = notifications[0]._id;
    deleteNotificationPermanently(firstNotifId);
    console.log(`✅ Deleted notification: ${firstNotifId}`);
  } else {
    console.warn('⚠️ No notifications to delete');
  }
};

/**
 * Example 6: Get all current alerts and notifications
 */
export const printSystemState = () => {
  const alerts = useAlertsStore.getState().alerts;
  const notifications = useAlertsStore.getState().notifications;
  const currentNotification = useAlertsStore.getState().currentNotification;

  console.log('📊 Alert System State:');
  console.log('  Persistent Alerts:', alerts.length);
  console.log('  Notifications Queue:', notifications.length);
  console.log('  Current Banner Notification:', currentNotification?._id || 'None');
  
  if (alerts.length > 0) {
    console.log('  Latest Alert:', alerts[0]);
  }
};

// ============================================
// Usage in a component:
// ============================================

/*
import { TestButton } from './TestButton';

export default function SomeScreen() {
  return (
    <>
      {/* Test buttons for development * /}
      <TestButton 
        title="Test High Risk" 
        onPress={testHighRiskNotification} 
      />
      <TestButton 
        title="Test Medium Risk" 
        onPress={testMediumRiskNotification} 
      />
      <TestButton 
        title="Test Low Risk" 
        onPress={testLowRiskNotification} 
      />
      <TestButton 
        title="Test Sequence" 
        onPress={testMultipleNotifications} 
      />
      <TestButton 
        title="Delete First Notif" 
        onPress={testDeleteNotification} 
      />
      <TestButton 
        title="Print State" 
        onPress={printSystemState} 
      />
    </>
  );
}
*/

export default {
  testHighRiskNotification,
  testMediumRiskNotification,
  testLowRiskNotification,
  testMultipleNotifications,
  testDeleteNotification,
  printSystemState,
};
