import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useAuthStore from '@/store/authStore';

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: '#0f1728',
    borderTopWidth: 1,
    borderTopColor: 'rgba(65, 71, 91, 0.2)',
    height: 100,
    paddingTop: 12,
    paddingBottom: 20,
  },
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  useEffect(() => {
    // Redirect to login if not authenticated and auth initialization is complete
    if (!isInitializing && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isInitializing, router]);

  // Show nothing while initializing or not authenticated
  if (isInitializing || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3adffa',
        tabBarInactiveTintColor: '#6f758b',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'DASHBOARD',
          tabBarIcon: ({ color }) => <FontAwesome6 name="grip" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="drivers"
        options={{
          title: 'DRIVERS',
          tabBarIcon: ({ color }) => <FontAwesome6 name="people-group" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'VEHICLES',
          tabBarIcon: ({ color }) => <FontAwesome6 name="truck" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'ALERTS',
          tabBarIcon: ({ color }) => <FontAwesome6 name="triangle-exclamation" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'SESSIONS',
          tabBarIcon: ({ color }) => <FontAwesome6 name="clock" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
