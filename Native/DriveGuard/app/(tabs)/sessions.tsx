import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import useSessionsStore from '../../store/sessionsStore';
import apiClient from '../../services/api';
import type { Session } from '../../store/sessionsStore';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1f',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 71, 91, 0.15)',
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  brandAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a3a6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 11,
    color: '#a3a6ff',
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  newsBadge: {
    fontSize: 10,
    color: '#a5aac2',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#dfe4fe',
    letterSpacing: 0.5,
  },
  activeUnitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  activeAvatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a3a6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#070d1f',
  },
  activeUnitsBadge: {
    backgroundColor: 'rgba(58, 223, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(58, 223, 250, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeUnitsText: {
    fontSize: 10,
    color: '#3adffa',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 71, 91, 0.15)',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
  },
  tabActive: {
    backgroundColor: 'rgba(163, 166, 255, 0.2)',
    borderColor: '#a3a6ff',
  },
  tabText: {
    fontSize: 11,
    color: '#a5aac2',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#a3a6ff',
  },
  feedLabel: {
    fontSize: 12,
    color: '#a5aac2',
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sessionsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  sessionCard: {
    backgroundColor: 'rgba(28, 37, 62, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.2)',
    padding: 16,
    marginHorizontal: 4,
  },
  sessionCardActive: {
    backgroundColor: 'rgba(28, 37, 62, 0.8)',
    borderColor: 'rgba(58, 223, 250, 0.3)',
  },
  sessionCardCritical: {
    backgroundColor: 'rgba(255, 110, 132, 0.05)',
    borderColor: 'rgba(255, 110, 132, 0.2)',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  driverPhoto: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#a3a6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverPhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dfe4fe',
    marginBottom: 2,
  },
  vehicleNumber: {
    fontSize: 11,
    color: '#6f758b',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  safetyScoreBadge: {
    backgroundColor: 'rgba(109, 254, 156, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  safetyScoreText: {
    fontSize: 10,
    color: '#6dfe9c',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alertBadge: {
    backgroundColor: 'rgba(255, 110, 132, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 10,
    color: '#ff6e84',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  interactiveTimeline: {
    marginBottom: 12,
    gap: 8,
  },
  timelineLabel: {
    fontSize: 9,
    color: '#6f758b',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timelineBar: {
    height: 16,
    backgroundColor: 'rgba(65, 71, 91, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  timelineProgress: {
    height: '100%',
    backgroundColor: '#a3a6ff',
    borderRadius: 8,
  },
  timelineStats: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineStat: {
    flex: 1,
  },
  timelineStatLabel: {
    fontSize: 9,
    color: '#6f758b',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timelineStatValue: {
    fontSize: 11,
    color: '#dfe4fe',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusBadgeNormal: {
    backgroundColor: 'rgba(109, 254, 156, 0.15)',
  },
  statusBadgeCritical: {
    backgroundColor: 'rgba(255, 110, 132, 0.15)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusBadgeTextNormal: {
    color: '#6dfe9c',
  },
  statusBadgeTextCritical: {
    color: '#ff6e84',
  },
  statusBadgeTextWarning: {
    color: '#ffd700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(65, 71, 91, 0.2)',
    borderRadius: 8,
    padding: 10,
  },
  metricLabel: {
    fontSize: 9,
    color: '#6f758b',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dfe4fe',
  },
  metricUnit: {
    fontSize: 9,
    color: '#a5aac2',
    marginTop: 2,
  },
  initiateCallButton: {
    backgroundColor: '#a3a6ff',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  initiateCallText: {
    color: '#070d1f',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expandButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(65, 71, 91, 0.2)',
    gap: 12,
  },
  pulseMetrics: {
    backgroundColor: 'rgba(65, 71, 91, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginHorizontal: 16,
  },
  pulseTitle: {
    fontSize: 12,
    color: '#a5aac2',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  globalSafetyIndex: {
    marginBottom: 14,
  },
  indexValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3adffa',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(65, 71, 91, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3adffa',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dfe4fe',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#6f758b',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  aiInsightsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(65, 71, 91, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 166, 255, 0.3)',
    padding: 14,
  },
  aiInsightsTitle: {
    fontSize: 11,
    color: '#a3a6ff',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiInsightsText: {
    fontSize: 11,
    color: '#a5aac2',
    lineHeight: 16,
  },
  auditLogsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  auditLogsTitle: {
    fontSize: 11,
    color: '#a5aac2',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  auditLog: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 71, 91, 0.15)',
  },
  auditLogDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6e84',
    marginTop: 4,
  },
  auditLogText: {
    flex: 1,
  },
  auditLogTitle: {
    fontSize: 11,
    color: '#dfe4fe',
    fontWeight: '600',
  },
  auditLogTime: {
    fontSize: 9,
    color: '#6f758b',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#6f758b',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function SessionsScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const ownerId = user?.ownerId;

  const sessions = useSessionsStore((state) => state.sessions);
  const activeSessions = useSessionsStore((state) => state.activeSessions);
  const isLoading = useSessionsStore((state) => state.isLoading);
  const setSessions = useSessionsStore((state) => state.setSessions);
  const setLoading = useSessionsStore((state) => state.setLoading);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high-risk'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSessionsRef = useRef(false);

  // Fetch sessions on mount
  useEffect(() => {
    if (!fetchSessionsRef.current && isAuthenticated && token && ownerId) {
      fetchSessionsRef.current = true;
      fetchSessions();
    }
  }, [isAuthenticated, token, ownerId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      console.log('Fetching sessions for owner:', ownerId);
      const response = await apiClient.get('/api/sessions', {
        params: { ownerId }
      });
      if (response.data.success) {
        setSessions(response.data.data || []);
        console.log('Sessions fetched:', response.data.data?.length);
      }
    } catch (error: any) {
      console.error('Error fetching sessions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSessions();
    setIsRefreshing(false);
  };

  const getStatusColor = (session: Session): 'normal' | 'critical' | 'warning' => {
    if (session.alert?.severity === 'high' || session.safetyScore < 60) return 'critical';
    if (session.alert?.severity === 'medium' || session.safetyScore < 80) return 'warning';
    return 'normal';
  };

  const getFilteredSessions = () => {
    if (filter === 'high-risk') {
      return sessions.filter((s) => s.safetyScore < 80 || s.alertsCount > 0);
    }
    return sessions;
  };

  const filteredSessions = getFilteredSessions();
  const displayedSessions = activeSessions.length > 0 && filter === 'all' ? activeSessions : filteredSessions;

  if (!isAuthenticated || !token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="lock" size={48} color="#00d9ff" />
          <Text style={styles.emptyText}>Authentication required</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a3a6ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1f" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#a3a6ff"
            colors={['#a3a6ff']}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerSection}>
          {/* Branding */}
          <View style={styles.brandingRow}>
            <View style={styles.brandAvatar}>
              <FontAwesome6 name="shield" size={14} color="#070d1f" />
            </View>
            <Text style={styles.brandText}>THE SENTINEL PROTOCOL</Text>
          </View>

          <Text style={styles.newsBadge}>SURVEILLANCE NEWS</Text>

          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Monitoring Sessions</Text>
          </View>

          {/* Active Units */}
          <View style={styles.activeUnitsRow}>
            <View style={styles.activeAvatars}>
              {activeSessions.slice(0, 3).map((session, index) => (
                <View key={index} style={styles.avatar}>
                  <FontAwesome6 name="user" size={14} color="#070d1f" />
                </View>
              ))}
              {activeSessions.length > 3 && (
                <View style={styles.avatar}>
                  <Text style={{ color: '#070d1f', fontSize: 12, fontWeight: 'bold' }}>
                    +{activeSessions.length - 3}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.activeUnitsBadge}>
              <FontAwesome6 name="circle" size={6} color="#3adffa" />
              <Text style={styles.activeUnitsText}>{activeSessions.length} ACTIVE UNITS</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>ALL</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, filter === 'high-risk' && styles.tabActive]}
            onPress={() => setFilter('high-risk')}
          >
            <Text style={[styles.tabText, filter === 'high-risk' && styles.tabTextActive]}>
              HIGH RISK
            </Text>
          </Pressable>
        </View>

        {/* Live Feed Label */}
        <Text style={styles.feedLabel}>Live Feed Stream</Text>

        {/* Sessions List */}
        {displayedSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="inbox" size={48} color="#666" />
            <Text style={styles.emptyText}>No sessions available</Text>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {displayedSessions.map((session) => {
              const statusType = getStatusColor(session);
              const isExpanded = expandedId === session._id;

              return (
                <View
                  key={session._id}
                  style={[
                    styles.sessionCard,
                    session.status === 'active' && styles.sessionCardActive,
                    statusType === 'critical' && styles.sessionCardCritical,
                  ]}
                >
                  {/* Driver Header */}
                  <View style={styles.sessionHeader}>
                    <View style={styles.driverPhoto}>
                      {session.driverPhoto ? (
                        <Image
                          source={{ uri: session.driverPhoto }}
                          style={styles.driverPhotoImage}
                        />
                      ) : (
                        <FontAwesome6 name="user" size={24} color="#070d1f" />
                      )}
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{session.driverName}</Text>
                      <Text style={styles.vehicleNumber}>{session.vehicleNumber}</Text>
                    </View>
                    <View style={styles.safetyScoreBadge}>
                      <Text style={styles.safetyScoreText}>{session.safetyScore}% SAFETY</Text>
                    </View>
                  </View>

                  {/* Alert Badge if present */}
                  {session.alert && (
                    <View style={styles.alertBadge}>
                      <Text style={styles.alertText}>
                        {session.alert.type} (LEVEL {session.alert.level || 1})
                      </Text>
                    </View>
                  )}

                  {/* Interactive Timeline */}
                  <View style={styles.interactiveTimeline}>
                    <Text style={styles.timelineLabel}>
                      {session.alert ? 'INTERACTIVE SAFETY TIMELINE' : 'SESSION TIMELINE'}
                    </Text>
                    <View style={styles.timelineBar}>
                      <View
                        style={[
                          styles.timelineProgress,
                          {
                            width:
                              session.status === 'active'
                                ? '45%'
                                : `${Math.min(100, (session.duration / 480) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.timelineStats}>
                      <View style={styles.timelineStat}>
                        <Text style={styles.timelineStatLabel}>START</Text>
                        <Text style={styles.timelineStatValue}>
                          {new Date(session.startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={styles.timelineStat}>
                        <Text style={styles.timelineStatLabel}>DURATION</Text>
                        <Text style={styles.timelineStatValue}>
                          {Math.floor(session.duration / 60)}h {session.duration % 60}m
                        </Text>
                      </View>
                      <View style={styles.timelineStat}>
                        <Text style={styles.timelineStatLabel}>STATUS</Text>
                        <Text style={styles.timelineStatValue}>
                          {session.status === 'active' ? 'CURRENT' : 'ENDED'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      statusType === 'normal'
                        ? styles.statusBadgeNormal
                        : statusType === 'critical'
                        ? styles.statusBadgeCritical
                        : styles.statusBadgeWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        statusType === 'normal'
                          ? styles.statusBadgeTextNormal
                          : statusType === 'critical'
                          ? styles.statusBadgeTextCritical
                          : styles.statusBadgeTextWarning,
                      ]}
                    >
                      {statusType === 'critical' ? 'CRITICAL' : statusType === 'warning' ? 'WARNING' : 'ON TRACK'}
                    </Text>
                  </View>

                  {/* Metrics Row */}
                  {(statusType === 'critical' || statusType === 'warning') && (
                    <View style={styles.metricsRow}>
                      {session.heartRate && (
                        <View style={styles.metricBox}>
                          <Text style={styles.metricLabel}>Heart Rate</Text>
                          <Text style={styles.metricValue}>{session.heartRate}</Text>
                          <Text style={styles.metricUnit}>BPM</Text>
                        </View>
                      )}
                      {session.eyeTracking && (
                        <View style={styles.metricBox}>
                          <Text style={styles.metricLabel}>Eye Tracking</Text>
                          <Text style={styles.metricValue}>{session.eyeTracking}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Last Break */}
                  {session.lastBreak && (
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Last Break</Text>
                      <Text style={styles.metricValue}>{session.lastBreak}</Text>
                    </View>
                  )}

                  {/* Initiate Call Button for Critical */}
                  {statusType === 'critical' && (
                    <Pressable style={styles.initiateCallButton}>
                      <FontAwesome6 name="phone" size={14} color="#070d1f" />
                      <Text style={styles.initiateCallText}>INITIATE CALL</Text>
                    </Pressable>
                  )}

                  {/* Expand Button */}
                  <Pressable
                    style={styles.expandButton}
                    onPress={() => setExpandedId(isExpanded ? null : session._id)}
                  >
                    <FontAwesome6
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#a5aac2"
                    />
                  </Pressable>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.timelineLabel}>Session Details</Text>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Vehicle Model</Text>
                        <Text style={styles.metricValue}>{session.vehicleModel}</Text>
                      </View>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Distance Covered</Text>
                        <Text style={styles.metricValue}>
                          {Math.floor(Math.random() * 150)}.{Math.floor(Math.random() * 100)} km
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* System Pulse */}
        <View style={styles.pulseMetrics}>
          <Text style={styles.pulseTitle}>System Pulse</Text>
          <Text style={styles.pulseTitle}>Global Safety Index</Text>

          <View style={styles.globalSafetyIndex}>
            <Text style={styles.indexValue}>
              {sessions.length > 0
                ? (sessions.reduce((sum, s) => sum + s.safetyScore, 0) / sessions.length).toFixed(1)
                : '0.0'}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      sessions.length > 0
                        ? `${(sessions.reduce((sum, s) => sum + s.safetyScore, 0) / sessions.length) * 1}%`
                        : '0%',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activeSessions.length}</Text>
              <Text style={styles.statLabel}>ACTIVE SESSIONS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {sessions.reduce((sum, s) => sum + s.alertsCount, 0)}
              </Text>
              <Text style={styles.statLabel}>TOTAL ALERT OPS</Text>
            </View>
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.aiInsightsCard}>
          <View style={styles.aiInsightsTitle}>
            <FontAwesome6 name="wand-magic-sparkles" size={11} color="#a3a6ff" />
            <Text style={{ color: '#a3a6ff', fontSize: 11, fontWeight: '700' }}>AI Insights</Text>
          </View>
          <Text style={styles.aiInsightsText}>
            Session density is increasing in Zone 04. Automated fatigue checks suggested for units starting before 05:00.
            3 vehicles require sensor recalibration.
          </Text>
          <Pressable style={{ marginTop: 8 }}>
            <Text style={{ color: '#a3a6ff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              OPTIMIZE ROUTES
            </Text>
          </Pressable>
        </View>

        {/* Audit Logs */}
        <View style={styles.auditLogsSection}>
          <Text style={styles.auditLogsTitle}>AUDIT LOGS</Text>

          <View style={styles.auditLog}>
            <View style={styles.auditLogDot} />
            <View style={styles.auditLogText}>
              <Text style={styles.auditLogTitle}>Session #882 Alert Flagged</Text>
              <Text style={styles.auditLogTime}>2 seconds ago • DRIVER_ALERT</Text>
            </View>
          </View>

          <View style={styles.auditLog}>
            <View style={styles.auditLogDot} />
            <View style={styles.auditLogText}>
              <Text style={styles.auditLogTitle}>Session #881 Completed</Text>
              <Text style={styles.auditLogTime}>14 minutes ago • DRIVER_JOHN_K</Text>
            </View>
          </View>

          <View style={styles.auditLog}>
            <View style={styles.auditLogDot} />
            <View style={styles.auditLogText}>
              <Text style={styles.auditLogTitle}>Auto-pilot Handoff</Text>
              <Text style={styles.auditLogTime}>28 minutes ago • UNIT-922</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
