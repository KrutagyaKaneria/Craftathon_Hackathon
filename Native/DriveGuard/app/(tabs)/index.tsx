import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolateColor
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MetricCard } from '@/components/metric-card';
import { AlertCard } from '@/components/alert-card';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAuth } from '@/hooks/useAuth';
import { Theme } from '@/constants/styles';

const { width } = Dimensions.get('window');

// Status Pulse Component
const StatusPulse = () => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: pulse.value * 0.5 + 0.3,
      transform: [{ scale: pulse.value * 0.5 + 1 }],
      backgroundColor: Theme.colors.accent,
    };
  });

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseDot, animatedStyle]} />
      <View style={[styles.innerDot, { backgroundColor: Theme.colors.accent }]} />
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const fetchInitiatedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'logs'>('telemetry');
  
  // Store selectors
  const dashboard = useDashboardStore((state) => state.dashboard);
  const alerts = useDashboardStore((state) => state.alerts);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const isRefreshing = useDashboardStore((state) => state.isRefreshing);
  const error = useDashboardStore((state) => state.error);
  const lastRefreshTime = useDashboardStore((state) => state.lastRefreshTime);
  const fetchDashboard = useDashboardStore((state) => state.fetchDashboard);
  const refreshDashboard = useDashboardStore((state) => state.refreshDashboard);
  const acknowledgeAlert = useDashboardStore((state) => state.acknowledgeAlert);

  useEffect(() => {
    if (!fetchInitiatedRef.current) {
      fetchInitiatedRef.current = true;
      fetchDashboard();
    }
  }, []);

  const onRefresh = useCallback(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const handleAlertAction = useCallback((id: string) => acknowledgeAlert(id), [acknowledgeAlert]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  }, [logout, router]);

  if (isLoading && !dashboard) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.accent} />
          <ThemedText style={styles.loadingText}>SYNCHRONIZING SYSTEM...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Premium Editorial Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandSection}>
            <FontAwesome6 name="shield-halved" size={22} color={Theme.colors.accent} solid />
            <ThemedText style={styles.brandText}>THE SENTINEL PROTOCOL</ThemedText>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <FontAwesome6 name="power-off" size={18} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Theme.colors.accent} />
        }
      >
        {/* Hero Section: The Vigilant Co-Pilot */}
        <View style={styles.heroSection}>
          <View style={styles.statusRow}>
            <StatusPulse />
            <ThemedText style={styles.statusLabel}>LIVE AI MONITORING ACTIVE</ThemedText>
          </View>

          <ThemedText style={styles.greeting}>Good Morning,</ThemedText>
          <ThemedText style={styles.commanderName}>Commander</ThemedText>
          
          <ThemedText style={styles.subGreeting}>
            Fleet readiness is currently at <ThemedText style={{ color: Theme.colors.accent, fontFamily: Theme.fonts.technical }}>{dashboard?.fleetReadiness || 0}%</ThemedText>. 
            No unauthorized protocol bypasses detected in the current sector.
          </ThemedText>
        </View>

        {/* Safety HUD: Glassmorphism */}
        {dashboard && (
          <View style={styles.hudContainer}>
            <View style={styles.glassCard}>
              <View style={styles.hudHeader}>
                <ThemedText style={styles.hudTitle}>OVERALL SAFETY SCORE</ThemedText>
                <View style={styles.hudBadge}>
                  <ThemedText style={styles.hudBadgeText}>OPTIMAL</ThemedText>
                </View>
              </View>

              <View style={styles.scoreContainer}>
                <ThemedText style={styles.scoreValue}>
                  {Math.round(dashboard.safetyRating)}
                </ThemedText>
                <ThemedText style={styles.scoreUnit}>%</ThemedText>
              </View>

              <View style={styles.hudMetricsRow}>
                <View style={styles.hudMiniMetric}>
                  <ThemedText style={styles.miniLabel}>FLEET UPTIME</ThemedText>
                  <ThemedText style={styles.miniValue}>98.2%</ThemedText>
                </View>
                <View style={styles.hudDivider} />
                <View style={styles.hudMiniMetric}>
                  <ThemedText style={styles.miniLabel}>OPS STABILITY</ThemedText>
                  <ThemedText style={styles.miniValue}>ALPHA-1</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Technical Data Grid: No Lines, Just Surfaces */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionLabel}>OPERATIONAL TELEMETRY</ThemedText>
          <View style={styles.metricsGrid}>
            {dashboard && (
              <>
                <MetricCard
                  title="Units Deployed"
                  value={dashboard.activeDrivers}
                  unit={`/ ${dashboard.totalDrivers}`}
                  percentage={(dashboard.activeDrivers / dashboard.totalDrivers) * 100}
                  icon={<FontAwesome6 name="user-astronaut" size={16} color={Theme.colors.accent} />}
                />
                <MetricCard
                  title="Asset Readiness"
                  value={dashboard.totalVehicles}
                  unit="Active"
                  percentage={dashboard.fleetReadiness}
                  status={dashboard.fleetReadiness >= 80 ? 'optimal' : 'warning'}
                  icon={<FontAwesome6 name="truck-ramp-box" size={16} color={Theme.colors.accent} />}
                />
                <MetricCard
                  title="Energy Efficiency"
                  value={dashboard.fuelEfficiency.toFixed(1)}
                  unit="KM/L AVG"
                  percentage={dashboard.fuelEfficiency * 10}
                  icon={<FontAwesome6 name="bolt-lightning" size={16} color={Theme.colors.accent} />}
                />
              </>
            )}
          </View>
        </View>

        {/* Intelligence Feed */}
        <View style={styles.sectionContainer}>
          <View style={styles.intelligenceHeader}>
            <ThemedText style={styles.sectionLabel}>CRITICAL INTELLIGENCE</ThemedText>
            {alerts && alerts.length > 0 && (
              <View style={styles.alertCounter}>
                <ThemedText style={styles.alertCounterText}>{alerts.filter(a => a.severity === 'high').length} PRIORITY</ThemedText>
              </View>
            )}
          </View>

          {alerts && alerts.length > 0 ? (
            alerts.slice(0, 3).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={() => handleAlertAction(alert.id)}
                actionText={alert.severity === 'high' ? 'ENGAGE' : 'ACKNOWLEDGE'}
              />
            ))
          ) : (
            <View style={styles.emptyIntelligence}>
              <ThemedText style={styles.emptyText}>SECURE SECTOR. NO CRITICAL ALERTS.</ThemedText>
            </View>
          )}
        </View>

        {/* System Logs Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDecoration} />
          <ThemedText style={styles.lastSync}>
            SYSTEM LAST SYNCHRONIZED: {lastRefreshTime ? new Date(lastRefreshTime).toLocaleTimeString() : 'PENDING'}
          </ThemedText>
          <ThemedText style={styles.protocolVersion}>ENCRYPTION: AES-256 | PROTOCOL: SENTINEL-V4</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderBottomWidth: 0.5,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    letterSpacing: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontFamily: Theme.fonts.technical,
    fontSize: 12,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusLabel: {
    fontFamily: Theme.fonts.label,
    fontSize: 9,
    color: Theme.colors.accent,
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  pulseContainer: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  greeting: {
    fontFamily: Theme.fonts.body,
    fontSize: 24,
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  commanderName: {
    fontFamily: Theme.fonts.display,
    fontSize: 42,
    color: Theme.colors.text,
    marginBottom: 16,
  },
  subGreeting: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    opacity: 0.8,
  },
  hudContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  glassCard: {
    borderRadius: Theme.roundness.xl,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hudTitle: {
    fontFamily: Theme.fonts.label,
    fontSize: 10,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
  },
  hudBadge: {
    backgroundColor: Theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hudBadgeText: {
    fontFamily: Theme.fonts.label,
    fontSize: 8,
    fontWeight: '700',
    color: Theme.colors.onSuccess,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  scoreValue: {
    fontFamily: Theme.fonts.display,
    fontSize: 64,
    color: Theme.colors.text,
  },
  scoreUnit: {
    fontFamily: Theme.fonts.title,
    fontSize: 24,
    color: Theme.colors.accent,
    marginLeft: 4,
  },
  hudMetricsRow: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
  },
  hudMiniMetric: {
    flex: 1,
  },
  hudDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  miniLabel: {
    fontFamily: Theme.fonts.label,
    fontSize: 9,
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  miniValue: {
    fontFamily: Theme.fonts.technical,
    fontSize: 16,
    color: Theme.colors.text,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: Theme.fonts.label,
    fontSize: 11,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 20,
    opacity: 0.6,
  },
  metricsGrid: {
    gap: 4, // Tight layout for sectional feel
  },
  intelligenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertCounter: {
    backgroundColor: 'rgba(186, 26, 26, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 20,
  },
  alertCounterText: {
    fontFamily: Theme.fonts.label,
    fontSize: 9,
    color: Theme.colors.error,
    fontWeight: '700',
  },
  emptyIntelligence: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 24,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Theme.fonts.technical,
    fontSize: 11,
    color: Theme.colors.textMuted,
    opacity: 0.5,
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 8,
  },
  footerDecoration: {
    width: 40,
    height: 2,
    backgroundColor: Theme.colors.outlineVariant,
    marginBottom: 12,
  },
  lastSync: {
    fontFamily: Theme.fonts.technical,
    fontSize: 9,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  protocolVersion: {
    fontFamily: Theme.fonts.technical,
    fontSize: 8,
    color: Theme.colors.textMuted,
    opacity: 0.3,
  }
});
