import { useEffect, useRef } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';
import { socketService } from '@/services/socketService';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertModal } from '@/components/AlertModal';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializationRef = useRef(false);
  const navigationStartedRef = useRef<boolean>(false);
  const router = useRouter();
  const segments = useSegments();
  
  // Use individual selectors to avoid object recreation on every render
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  const { currentAlert, clearAlert } = useAlerts();

  // Initialize auth only once
  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      initializeAuth();
    }
  }, [initializeAuth]);

  // Handle socket connection based on auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('⚡ RootLayout: Authenticated, connecting socket...');
      socketService.connect(token);
    } else if (!isAuthenticated) {
      console.log('🔌 RootLayout: Not authenticated, disconnecting socket...');
      socketService.disconnect();
    }
  }, [isAuthenticated, token]);

  // Handle routing based on auth state (only after auth is done initializing)
  useEffect(() => {
    if (!isInitializing && !navigationStartedRef.current) {
      navigationStartedRef.current = true;
      
      // Give the Stack a chance to mount before navigating
      const timer = setTimeout(() => {
        const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

        if (!isAuthenticated && !inAuthGroup) {
          // Not authenticated and not in auth screens - go to login
          router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
          // Authenticated but in auth screens - go to app
          router.replace('/(tabs)');
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isInitializing, isAuthenticated, segments, router]);

  // Always render the Stack immediately
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="signup" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="(tabs)"
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="assign-vehicle"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <AlertModal 
        isVisible={!!currentAlert} 
        alert={currentAlert} 
        onClose={clearAlert} 
        onAcknowledge={() => {
          console.log('👍 Alert acknowledged');
          // Add any specific acknowledgement logic here if needed
        }}
      />
    </ThemeProvider>
  );
}
