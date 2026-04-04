import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
  PanResponder,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';

export interface NotificationData {
  _id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  driverName?: string;
  vehicleNumber?: string;
  actionType?: string;
}

interface NotificationBannerProps {
  notification: NotificationData | null;
  onDismiss: () => void;
  onDelete: (notificationId: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  onDelete,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Auto-dismiss after 5 seconds for medium/low severity, 8s for high
  const dismissDuration = notification?.severity === 'high' ? 8000 : 5000;

  useEffect(() => {
    if (notification) {
      playNotificationSound(notification.severity);
      playHapticFeedback(notification.severity);
      showNotification();
      const timer = setTimeout(() => {
        hideNotification();
      }, dismissDuration);
      return () => clearTimeout(timer);
    }
  }, [notification?._id]);

  // Pan responder for swipe gesture
  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, { dy }) => Math.abs(dy) > 5,
      onPanResponderMove: (evt, { dy }) => {
        if (dy < 0) {
          translateY.setValue(dy);
        }
      },
      onPanResponderRelease: (evt, { dy, vy }) => {
        if (dy < -50 || vy < -0.5) {
          // Swiped up - dismiss
          hideNotification();
        } else {
          // Return to normal position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }, []);

  const playNotificationSound = async (severity: string) => {
    try {
      // Only play sound for high severity alerts
      if (severity !== 'high') return;

      // Clean up previous sound
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (e) {
          // Ignore unload errors
        }
      }

      // Try to load and play sound - gracefully handle if file doesn't exist
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/alert-beep.mp3'),
          { shouldPlay: true }
        );
        soundRef.current = sound;
      } catch (soundError) {
        // Sound file not found - that's okay, just continue
        // User can add sound file later at: assets/sounds/alert-beep.mp3
        console.log('💡 Sound file not found. Add alert-beep.mp3 to assets/sounds/ to enable audio alerts');
      }
    } catch (error) {
      // Silently fail if audio is not available
      console.log('⚠️ Audio not available:', error);
    }
  };

  const playHapticFeedback = (severity: string) => {
    try {
      if (severity === 'high') {
        Vibration.vibrate([0, 200, 100, 200]);
      } else if (severity === 'medium') {
        Vibration.vibrate([0, 100]);
      }
    } catch (error) {
      console.log('Haptic vibration not available');
    }
  };

  const showNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!notification) return null;

  const severityColors = {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#4285F4',
  };

  const severityIcons = {
    high: 'alert-circle',
    medium: 'warning',
    low: 'information-circle',
  };

  const bgColor = severityColors[notification.severity];
  const icon = severityIcons[notification.severity];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity: opacityAnim,
        },
      ]}
      {...panResponder.current?.panHandlers}
    >
      <View style={[styles.banner, { backgroundColor: bgColor }]}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#fff" />
        </View>

        <View style={styles.content}>
          <ThemedText style={[styles.title, { color: '#fff' }]} type="defaultSemiBold">
            {notification.title}
          </ThemedText>
          <ThemedText style={[styles.message, { color: '#fff' }]} numberOfLines={1}>
            {notification.message}
          </ThemedText>
          {notification.vehicleNumber && (
            <ThemedText style={[styles.meta, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
              {notification.vehicleNumber} • {notification.driverName}
            </ThemedText>
          )}
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              onDelete(notification._id);
              hideNotification();
            }}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipe hint text */}
      <ThemedText style={styles.swipeHint}>Swipe up to dismiss • Tap × to delete</ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    opcacity: 0.9,
  },
  meta: {
    fontSize: 10,
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: 8,
  },
  deleteButton: {
    padding: 6,
  },
  swipeHint: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default NotificationBanner;
