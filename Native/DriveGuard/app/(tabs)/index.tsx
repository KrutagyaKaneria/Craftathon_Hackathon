import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MetricCard } from '@/components/metric-card';
import { AlertCard } from '@/components/alert-card';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

// Icon components - simplified (you can replace with icon library)
const FleetIcon = () => (
  <View style={{ width: 24, height: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4 }} />
);

const DriverIcon = () => (
  <View style={{ width: 24, height: 24, backgroundColor: 'rgba(0, 217, 255, 0.2)', borderRadius: 4 }} />
);

const TruckIcon = () => (
  <View style={{ width: 24, height: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 4 }} />
);

const GaugeIcon = () => (
  <View style={{ width: 24, height: 24, backgroundColor: 'rgba(255, 215, 0, 0.2)', borderRadius: 4 }} />
);

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const fetchInitiatedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'logs'>('telemetry');
  
  // Store hooks - use individual selectors to prevent infinite loops
  const dashboard = useDashboardStore((state) => state.dashboard);
  const alerts = useDashboardStore((state) => state.alerts);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const isRefreshing = useDashboardStore((state) => state.isRefreshing);
  const error = useDashboardStore((state) => state.error);
  const lastRefreshTime = useDashboardStore((state) => state.lastRefreshTime);
  const fetchDashboard = useDashboardStore((state) => state.fetchDashboard);
  const refreshDashboard = useDashboardStore((state) => state.refreshDashboard);
  const acknowledgeAlert = useDashboardStore((state) => state.acknowledgeAlert);

  // Fetch dashboard only once on mount
  useEffect(() => {
    if (!fetchInitiatedRef.current) {
      fetchInitiatedRef.current = true;
      fetchDashboard();
    }
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    refreshDashboard();
  }, []);

  // Handle alert action
  const handleAlertAction = useCallback(
    (alertId: string) => {
      acknowledgeAlert(alertId);
    },
    []
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
          style: 'destructive',
        },
      ]
    );
  }, []);

  if (isLoading && !dashboard) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D9FF" />
          <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error && !dashboard) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Unable to Load Dashboard</ThemedText>
          <ThemedText style={styles.errorMessage}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboard()}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with notification and menu */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <FontAwesome6 name="shield" size={24} color="#A8B4FF" solid style={{ marginRight: 8 }} />
            <ThemedText style={styles.logoText}>THE SENTINEL PROTOCOL</ThemedText>
          </View>
          <TouchableOpacity 
            onPress={handleLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FontAwesome6 name="bell" size={20} color="#00D9FF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#00D9FF"
            title="Pull to refresh"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.statusBadge}>
            <ThemedText style={styles.statusText}>SYSTEM STATUS: ACTIVE</ThemedText>
            <View style={styles.statusDot} />
          </View>

          <ThemedText style={styles.greeting}>Good Morning,</ThemedText>
          <ThemedText style={styles.greetingName}>Commander</ThemedText>

          {dashboard && (
            <ThemedText style={styles.subGreeting}>
              Fleet synchronization is at {Math.round(dashboard.safetyRating)}%. No critical bypasses detected in the last 6 operational hours.
            </ThemedText>
          )}
        </View>

        {/* Main Metrics */}
        {dashboard && (
          <>
            {/* Safety Rating */}
            <View style={styles.metricsSection}>
              <ThemedText style={styles.sectionTitle}>OVERALL SAFETY RATING</ThemedText>
              <View style={styles.largeMetricCard}>
                <View style={styles.circularProgress}>
                  <ThemedText style={styles.progressValue}>
                    {Math.round(dashboard.safetyRating)}%
                  </ThemedText>
                  <ThemedText style={styles.progressLabel}>OPTIMAL</ThemedText>
                </View>
                <View style={styles.metricsRow}>
                  <View style={styles.miniMetric}>
                    <ThemedText style={styles.miniLabel}>UPTIME</ThemedText>
                    <ThemedText style={styles.miniValue}>82%</ThemedText>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.miniMetric}>
                    <ThemedText style={styles.miniLabel}>SAFETY</ThemedText>
                    <ThemedText style={styles.miniValue}>95%</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Fleet Readiness */}
            <MetricCard
              icon={<TruckIcon />}
              title="Fleet Readiness"
              value={dashboard.totalVehicles}
              unit="/ 100 units"
              percentage={dashboard.fleetReadiness}
              status={dashboard.fleetReadiness >= 80 ? 'optimal' : 'warning'}
            />

            {/* Active Drivers */}
            <MetricCard
              icon={<DriverIcon />}
              title="Active Drivers"
              value={dashboard.activeDrivers}
              unit="Online"
              percentage={(dashboard.activeDrivers / dashboard.totalDrivers) * 100}
              status="optimal"
            />

            {/* Fuel Efficiency */}
            <MetricCard
              icon={<GaugeIcon />}
              title="Fuel Efficiency"
              value={dashboard.fuelEfficiency.toFixed(1)}
              unit="km/L Avg"
              percentage={dashboard.fuelEfficiency * 10}
              status={dashboard.fuelEfficiency > 8 ? 'optimal' : 'warning'}
            />
          </>
        )}

        {/* Live Telemetry Feed Section */}
        <View style={styles.telemetrySection}>
          <View style={styles.telemetryTabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'telemetry' && styles.activeTab]}
              onPress={() => setActiveTab('telemetry')}
            >
              <ThemedText style={[styles.tabText, activeTab === 'telemetry' && styles.activeTabText]}>
                LIVE TELEMETRY FEED
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
              onPress={() => setActiveTab('logs')}
            >
              <ThemedText style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
                VIEW SYSTEM LOGS
              </ThemedText>
            </TouchableOpacity>
          </View>

          {activeTab === 'telemetry' && (
            <View style={styles.tabContent}>
              {dashboard?.recentAlerts && dashboard.recentAlerts.slice(0, 2).map((item, idx) => (
                <View key={idx} style={styles.telemetryItem}>
                  <View style={styles.telemetryIcon}>
                    <FontAwesome6 name={idx === 0 ? 'satellite' : 'key'} size={14} color="#00D9FF" />
                  </View>
                  <View style={styles.telemetryContent}>
                    <ThemedText style={styles.telemetryLabel}>
                      {idx === 0 ? 'SET LINK ACTIVE' : 'PROTOCOL CHECK'}
                    </ThemedText>
                    <ThemedText style={styles.telemetryValue}>
                      {idx === 0 ? 'Sector 7-G Synchronized' : 'Sentinel Core Encrypted'}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'logs' && (
            <View style={styles.tabContent}>
              <ThemedText style={styles.logMessage}>
                System logs are currently being processed. Check back soon for updates.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Critical Intelligence Section */}
        {alerts && alerts.length > 0 && (
          <View style={styles.criticalSection}>
            <View style={styles.criticalHeader}>
              <ThemedText style={styles.criticalTitle}>Critical Intelligence</ThemedText>
              <View style={styles.priorityBadge}>
                <ThemedText style={styles.priorityText}>
                  {alerts.filter((a) => a.severity === 'high').length} PRIORITY ALERTS
                </ThemedText>
              </View>
            </View>

            {alerts.slice(0, 5).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={() => handleAlertAction(alert.id)}
                actionText={
                  alert.severity === 'high'
                    ? 'EMERGENCY CALL'
                    : alert.severity === 'medium'
                      ? 'INVESTIGATE'
                      : 'ACKNOWLEDGE'
                }
              />
            ))}
          </View>
        )}

        {/* Last Refresh Time */}
        {lastRefreshTime && (
          <View style={styles.footerInfo}>
            <ThemedText style={styles.footerText}>
              Last updated: {new Date(lastRefreshTime).toLocaleTimeString()}
            </ThemedText>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1428',
  },
  header: {
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8B4FF',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00D9FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#00D9FF',
    fontWeight: '600',
    fontSize: 14,
  },
  headerSection: {
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00D9FF',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D9FF',
  },
  greeting: {
    fontSize: 26,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#00D9FF',
    marginBottom: 12,
  },
  subGreeting: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
    lineHeight: 16,
  },
  metricsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.5,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  largeMetricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00D9FF',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniMetric: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  miniLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.6,
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  telemetrySection: {
    marginVertical: 24,
  },
  telemetryTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 255, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00D9FF',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.5,
  },
  activeTabText: {
    color: '#00D9FF',
    opacity: 1,
  },
  tabContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 12,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  telemetryIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  telemetryContent: {
    flex: 1,
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.6,
    marginBottom: 2,
  },
  telemetryValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  logMessage: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 16,
  },
  criticalSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  criticalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  criticalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priorityBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  footerInfo: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.4,
  },
});
