import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  Image,
  FlatList,
} from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import useAuthStore from '../../store/authStore';
import apiClient, { driversAPI } from '../../services/api';
import { convertImageToBase64, getBase64Size } from '../../utils/imageUtils';
import { useDriverAnalytics } from '../../hooks/useDriverAnalytics';
import { useSessionTelemetry } from '../../hooks/useSessionTelemetry';
import { useDynamicSafety } from '../../hooks/useDynamicSafety';
import { Theme } from '@/constants/styles';

/**
 * Driver Card Component - displays driver info with real analytics
 */
interface DriverCardItemProps {
  driver: any;
  expandedId: string | null;
  onExpand: (id: string) => void;
  onEdit: (driver: any) => void;
  onDelete: (driver: any) => void;
  onAssignVehicle: (driverId: string, driverName: string) => void;
  ownerId: string;
}

function DriverCardItem({
  driver,
  expandedId,
  onExpand,
  onEdit,
  onDelete,
  onAssignVehicle,
  ownerId,
}: DriverCardItemProps) {
  const { analytics, isLoading: analyticsLoading } = useDriverAnalytics(driver._id, ownerId);
  const { telemetry, isActive: telemetryActive } = useSessionTelemetry();
  const { safety } = useDynamicSafety();

  const isExpanded = expandedId === driver._id;
  const DriverStatusColor = driver.isActive ? Theme.colors.success : Theme.colors.error;

  // Calculate safety score: Use dynamic safety if available, fallback to analytics
  const displayedSafetyScore = safety?.safetyScore !== undefined ? safety.safetyScore : (analytics?.averageSafetyScore || 100);
  const alertCount = safety?.alertsCount || analytics?.totalAlerts || 0;

  // Format duty hours for display
  const dutyHoursDisplay = analytics
    ? analytics.totalDutyHours > 0
      ? `${Math.floor(analytics.totalDutyHours)}:${String(Math.round((analytics.totalDutyHours % 1) * 60)).padStart(2, '0')}h`
      : '00:00h'
    : '--:--h';

  // Get performance rating (1-5 stars converted to display) - with proper null/undefined check
  const ratingDisplay = analytics && typeof analytics.performanceRating === 'number' && analytics.performanceRating !== undefined
    ? analytics.performanceRating.toFixed(1)
    : '-.--';

  // Calculate perfect performance percentage
  const perfectPerfDisplay = (analytics?.perfectPerformancePercentage !== undefined && analytics?.perfectPerformancePercentage !== null)
    ? analytics.perfectPerformancePercentage
    : 0;

  // Get recent performance bars (last 7 sessions)
  const recentSessions = analytics?.recentPerformance?.slice(0, 7) || [];

  return (
    <Pressable
      key={driver._id}
      style={styles.driverCard}
      onPress={() => onExpand(driver._id)}
    >
      <View style={[styles.driverCardGhostBorder, { backgroundColor: DriverStatusColor }]} />
      <View style={styles.driverCardContent}>
        
        <View style={styles.driverHeader}>
          {driver.profilePhoto ? (
            <Image source={{ uri: driver.profilePhoto }} style={styles.driverProfileImage} />
          ) : (
            <View style={styles.driverProfileImage}>
              <FontAwesome6 name="user" size={20} color={Theme.colors.textSecondary} />
            </View>
          )}
          
          <View style={styles.driverMainInfo}>
            <Text style={styles.driverName}>{driver.firstName} {driver.lastName}</Text>
            <Text style={styles.driverRole}>{driver.email}</Text>
          </View>
          
          <View style={styles.statusIndicatorContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: DriverStatusColor }]} />
          </View>
        </View>

        <View style={styles.ratingDurationRow}>
          <View style={styles.ratingBadge}>
            <FontAwesome6 name="star" size={10} color={Theme.colors.textSecondary} />
            <Text style={styles.ratingText}>{ratingDisplay} / 5.0</Text>
          </View>
          <View style={styles.durationBadge}>
            <FontAwesome6 name="clock" size={10} color={Theme.colors.accent} />
            <Text style={styles.durationText}>{dutyHoursDisplay}</Text>
          </View>
        </View>

        <View style={styles.driverMetrics}>
          <View style={styles.metricBadge}>
            <FontAwesome6 name="phone" size={10} color={Theme.colors.textMuted} />
            <Text style={styles.metricText}>{driver.phone || 'NO_CONTACT'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <FontAwesome6 name="circle" size={6} color={DriverStatusColor} />
            <Text style={[styles.statusText, { color: DriverStatusColor }]}>
              {driver.isActive ? 'NORMAL_PROTOCOL' : 'CAUTION_FLAG'}
            </Text>
          </View>
        </View>

        {/* Expand Trigger */}
        <View style={styles.expandButton}>
          <FontAwesome6 name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={Theme.colors.textMuted} />
        </View>

        {/* Expanded Tactical Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {analyticsLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Theme.colors.accent} />
                <Text style={[styles.sectionLabel, { marginTop: 8 }]}>LOADING_ANALYTICS...</Text>
              </View>
            ) : analytics ? (
              <>
                <View style={styles.performanceSection}>
                  <Text style={styles.sectionLabel}>RECENT_PERFORMANCE</Text>
                  <View style={styles.performanceChart}>
                    {recentSessions.length > 0 ? (
                      recentSessions.map((session, i) => (
                        <View
                          key={i}
                          style={[
                            styles.performanceBar,
                            {
                              height: `${Math.max(30, (session.safetyScore || 100) / 100 * 80)}%`,
                              backgroundColor:
                                (session.safetyScore || 100) > 90
                                  ? Theme.colors.success
                                  : (session.safetyScore || 100) > 70
                                  ? Theme.colors.accent
                                  : Theme.colors.error,
                            },
                          ]}
                        />
                      ))
                    ) : (
                      <Text style={styles.metricText}>NO_SESSION_DATA</Text>
                    )}
                  </View>
                </View>

                <View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PERFECT_PERFORMANCE</Text>
                    <Text style={styles.detailValue}>{perfectPerfDisplay}%</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>TOTAL_ALERTS</Text>
                    <Text style={[styles.detailValue, { color: alertCount > 0 ? Theme.colors.error : Theme.colors.success }]}>
                      {alertCount}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>SAFETY_SCORE</Text>
                    <Text style={[
                      styles.detailValue,
                      {
                        color: displayedSafetyScore >= 75 ? Theme.colors.success :
                               displayedSafetyScore >= 50 ? Theme.colors.accent :
                               Theme.colors.error
                      }
                    ]}>
                      {displayedSafetyScore.toFixed(1)}%
                    </Text>
                  </View>

                  {/* Alert Breakdown (when alerts exist) */}
                  {safety && safety.alertsCount > 0 && (
                    <View style={styles.alertBreakdownRow}>
                      <Text style={styles.detailLabel}>ALERT_BREAKDOWN</Text>
                      <View style={styles.alertBadgesRow}>
                        {safety.highSeverityAlerts > 0 && (
                          <View style={[styles.alertBadge, { backgroundColor: 'rgba(255, 87, 87, 0.15)' }]}>
                            <Text style={{ fontSize: 8, color: '#ff5757', fontWeight: '700' }}>
                              🔴 High: {safety.highSeverityAlerts}
                            </Text>
                          </View>
                        )}
                        {safety.mediumSeverityAlerts > 0 && (
                          <View style={[styles.alertBadge, { backgroundColor: 'rgba(255, 193, 7, 0.15)' }]}>
                            <Text style={{ fontSize: 8, color: '#ffc107', fontWeight: '700' }}>
                              🟡 Medium: {safety.mediumSeverityAlerts}
                            </Text>
                          </View>
                        )}
                        {safety.lowSeverityAlerts > 0 && (
                          <View style={[styles.alertBadge, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                            <Text style={{ fontSize: 8, color: '#4caf50', fontWeight: '700' }}>
                              🟢 Low: {safety.lowSeverityAlerts}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>TOTAL_SESSIONS</Text>
                    <Text style={styles.detailValue}>{analytics?.totalSessions || 0}</Text>
                  </View>
                </View>

                {/* Real-time Session Telemetry Section */}
                {telemetryActive && telemetry && (
                  <View style={styles.telemetrySection}>
                    <Text style={styles.sectionLabel}>⚡ LIVE_SESSION_TELEMETRY</Text>
                    <View style={styles.telemetryGrid}>
                      <View style={styles.telemetryCard}>
                        <Text style={styles.telemetryLabel}>Distance</Text>
                        <Text style={styles.telemetryValue}>{(telemetry.distance || 0).toFixed(1)}</Text>
                        <Text style={styles.telemetryUnit}>km</Text>
                      </View>
                      <View style={styles.telemetryCard}>
                        <Text style={styles.telemetryLabel}>Duration</Text>
                        <Text style={styles.telemetryValue}>
                          {Math.floor((telemetry.duration || 0) / 60)}:{String((telemetry.duration || 0) % 60).padStart(2, '0')}
                        </Text>
                        <Text style={styles.telemetryUnit}>min</Text>
                      </View>
                      <View style={styles.telemetryCard}>
                        <Text style={styles.telemetryLabel}>Max Accel</Text>
                        <Text style={styles.telemetryValue}>{(telemetry.maxAcceleration || 0).toFixed(2)}</Text>
                        <Text style={styles.telemetryUnit}>m/s²</Text>
                      </View>
                      <View style={styles.telemetryCard}>
                        <Text style={styles.telemetryLabel}>Avg Speed</Text>
                        <Text style={styles.telemetryValue}>{(telemetry.avgSpeed || 0).toFixed(1)}</Text>
                        <Text style={styles.telemetryUnit}>km/h</Text>
                      </View>
                      <View style={styles.telemetryCard}>
                        <Text style={styles.telemetryLabel}>Max Speed</Text>
                        <Text style={styles.telemetryValue}>{(telemetry.maxSpeed || 0).toFixed(1)}</Text>
                        <Text style={styles.telemetryUnit}>km/h</Text>
                      </View>
                      <View style={styles.telemetryCard}>
                        <Text style={styles.telemetryLabel}>Max Braking</Text>
                        <Text style={styles.telemetryValue}>{(telemetry.maxBraking || 0).toFixed(2)}</Text>
                        <Text style={styles.telemetryUnit}>m/s²</Text>
                      </View>
                      <View style={[styles.telemetryCard, { gridColumn: 'span 2' }]}>
                        <Text style={styles.telemetryLabel}>Safety %</Text>
                        <Text style={[styles.telemetryValue, { 
                          color: (telemetry.safetyPercentage || 0) > 80 ? Theme.colors.success : 
                                  (telemetry.safetyPercentage || 0) > 60 ? Theme.colors.accent : Theme.colors.error 
                        }]}>
                          {(telemetry.safetyPercentage || 0).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonEdit]}
                    onPress={() => onEdit(driver)}
                  >
                    <FontAwesome6 name="pen" size={10} color={Theme.colors.textSecondary} />
                    <Text style={[styles.actionButtonText, { color: Theme.colors.textSecondary }]}>EDIT</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonAssign]}
                    onPress={() => onAssignVehicle(driver._id, `${driver.firstName} ${driver.lastName}`)}
                  >
                    <FontAwesome6 name="car" size={10} color={Theme.colors.accent} />
                    <Text style={[styles.actionButtonText, { color: Theme.colors.accent }]}>ASSIGN</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonDelete]}
                    onPress={() => onDelete(driver)}
                  >
                    <FontAwesome6 name="trash" size={10} color={Theme.colors.error} />
                    <Text style={[styles.actionButtonText, { color: Theme.colors.error }]}>DELETE</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={[styles.detailLabel, { textAlign: 'center', paddingVertical: 16 }]}>
                No analytics available
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.headline,
    color: Theme.colors.text,
    letterSpacing: 0.5,
  },
  statusIndicatorText: {
    fontSize: 9,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.accent,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    padding: 0,
    marginLeft: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.roundness.md,
  },
  filterButtonText: {
    fontSize: 11,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.accent,
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.lg,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  metricGhostBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  metricCardLabel: {
    fontSize: 9,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  metricCardValue: {
    fontSize: 24,
    fontFamily: Theme.fonts.display,
  },
  driversList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
  },
  driverCard: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  driverCardGhostBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  driverCardContent: {
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  driverProfileImage: {
    width: 50,
    height: 50,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMainInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontFamily: Theme.fonts.headline,
    color: Theme.colors.text,
    marginBottom: 2,
  },
  driverRole: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.textSecondary,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusIndicatorContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingDurationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.roundness.sm,
  },
  ratingText: {
    fontSize: 10,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.text,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: Theme.roundness.sm,
  },
  durationText: {
    fontSize: 10,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.accent,
  },
  driverMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 11,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(109, 254, 156, 0.1)',
    borderRadius: Theme.roundness.sm,
  },
  statusText: {
    fontSize: 9,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.success,
    letterSpacing: 0.5,
  },
  expandButton: {
    alignSelf: 'center',
    padding: 8,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
    paddingTop: 16,
    marginTop: 8,
    gap: 16,
  },
  performanceSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  performanceChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 60,
  },
  performanceBar: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerHighest,
    borderRadius: Theme.roundness.full,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.text,
  },
  alertBreakdownRow: {
    gap: 4,
    paddingVertical: 4,
  },
  alertBadgesRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  alertBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Theme.roundness.sm,
    borderWidth: 0.5,
  },
  telemetrySection: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  telemetryCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.roundness.md,
    padding: 8,
    alignItems: 'center',
    borderLeftWidth: 2,
    borderLeftColor: Theme.colors.accent,
  },
  telemetryLabel: {
    fontSize: 8,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  telemetryValue: {
    fontSize: 14,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  telemetryUnit: {
    fontSize: 7,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonEdit: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  actionButtonDelete: {
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  actionButtonAssign: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  actionButtonText: {
    fontSize: 10,
    fontFamily: Theme.fonts.label,
    letterSpacing: 0.5,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.textMuted,
    letterSpacing: 2,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 40, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.roundness.xl,
    borderTopRightRadius: Theme.roundness.xl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    fontSize: 20,
    fontFamily: Theme.fonts.headline,
    color: Theme.colors.text,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
    gap: 8,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Theme.colors.text,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: Theme.colors.onPrimary,
    fontFamily: Theme.fonts.label,
    fontSize: 14,
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: Theme.colors.textMuted,
    fontFamily: Theme.fonts.label,
    fontSize: 14,
  },
  imageSection: {
    marginBottom: 20,
    gap: 12,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: Theme.roundness.lg,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePickerOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerOption: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerOptionText: {
    color: Theme.colors.text,
    fontFamily: Theme.fonts.label,
    fontSize: 12,
  },
});

export default function DriversScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  // React Hook Form for Add Driver
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const ownerId = user?.ownerId;

  const fetchDriversRef = useRef(false);

  // Fetch drivers on mount
  useEffect(() => {
    if (!fetchDriversRef.current && isAuthenticated && token && ownerId) {
      fetchDriversRef.current = true;
      fetchDrivers();
    }
  }, [isAuthenticated, token, ownerId]);

  // Filter drivers based on search
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(
        (driver) =>
          driver.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
          driver.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
          driver.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  }, [searchText, drivers]);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      if (!ownerId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      // Use protected API route that automatically filters by authenticated owner
      console.log('📱 Fetching drivers for authenticated owner:', ownerId);
      const drivers = await driversAPI.getOwnDrivers();
      setDrivers(drivers || []);
      setFilteredDrivers(drivers || []);
    } catch (error: any) {
      console.error('❌ Error fetching drivers:', error);
      Alert.alert('Error', error.message || 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDrivers();
    setIsRefreshing(false);
  };

  const onSubmitNewDriver = async (data: any) => {
    try {
      if (!selectedImage?.assets?.[0]) {
        Alert.alert('Error', 'Please select an image');
        return;
      }
      if (!data.firstName || !data.email || !data.password) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);
      const imageUri = selectedImage.assets[0].uri;
      const base64Image = await convertImageToBase64(imageUri);
      const imageSizeMB = getBase64Size(base64Image);

      if (imageSizeMB > 2) {
        Alert.alert('Warning', `Image size is ${imageSizeMB.toFixed(2)}MB. Please select a smaller image for better performance.`);
        setIsSubmitting(false);
        return;
      }

      const driverData = {
        ownerId,
        firstName: data.firstName,
        lastName: data.lastName || '',
        email: data.email,
        phone: data.phone || '',
        password: data.password,
        profilePhoto: base64Image,
      };

      const response = await apiClient.post('/api/drivers', driverData, {
        params: { ownerId },
        headers: { 'Content-Type': 'application/json' },
      });

      Alert.alert('Success', 'Driver added successfully!');
      reset();
      setSelectedImage(null);
      setIsModalVisible(false);
      await fetchDrivers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission', 'Camera permission is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.4,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission', 'Gallery permission is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.4,
        });
      }

      if (!result.canceled) {
        setSelectedImage(result);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleEditDriver = (driver: any) => {
    setEditingDriverId(driver._id);
    setEditFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone || '',
      password: '',
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateDriver = async () => {
    if (!editFormData.firstName || !editFormData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await apiClient.put(`/api/drivers/${editingDriverId}`, {
        ownerId,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Driver updated successfully!');
        setEditFormData({ firstName: '', lastName: '', email: '', phone: '', password: '' });
        setIsEditModalVisible(false);
        setEditingDriverId(null);
        await fetchDrivers();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = (driver: any) => {
    Alert.alert('Delete Driver', `Are you sure you want to delete ${driver.firstName} ${driver.lastName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const response = await apiClient.delete(`/api/drivers/${driver._id}`, {
              params: { ownerId }
            });
            if (response.data.success) {
              Alert.alert('Success', 'Driver deleted successfully!');
              await fetchDrivers();
            }
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete driver');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (!isAuthenticated || !token) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centerContent}>
          <FontAwesome6 name="lock" size={48} color={Theme.colors.accent} />
          <Text style={styles.emptyText}>Authentication required</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Theme.colors.accent} />}
      >
        {/* Command Center Header */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>Personnel Directory</Text>
            <Text style={styles.statusIndicatorText}>SYSTEM OPERATIONAL</Text>
          </View>
          <Text style={styles.subtitle}>
            Real-time monitoring of fleet operators. Tactical data stream synchronized with core protocol.
          </Text>
        </View>

        {/* Sentinel Protocol Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricGhostBorder, { backgroundColor: Theme.colors.accent }]} />
            <Text style={styles.metricCardLabel}>ACTIVE_UNITS</Text>
            <Text style={[styles.metricCardValue, { color: Theme.colors.accent }]}>{drivers.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricGhostBorder, { backgroundColor: Theme.colors.success }]} />
            <Text style={styles.metricCardLabel}>SAFE_OPERATORS</Text>
            <Text style={[styles.metricCardValue, { color: Theme.colors.success }]}>
              {Math.round((drivers.filter(d => d.isActive).length / Math.max(drivers.length, 1)) * 100)}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricGhostBorder, { backgroundColor: Theme.colors.text }]} />
            <Text style={styles.metricCardLabel}>IN_TRANSIT</Text>
            <Text style={[styles.metricCardValue, { color: Theme.colors.text }]}>
              {drivers.filter(d => d.isActive).length}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricGhostBorder, { backgroundColor: Theme.colors.error }]} />
            <Text style={styles.metricCardLabel}>ALERTS_ACTIVE</Text>
            <Text style={[styles.metricCardValue, { color: Theme.colors.error }]}>
              0{drivers.filter(d => !d.isActive).length}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <FontAwesome6 name="magnifying-glass" size={14} color={Theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Identify operator..."
              placeholderTextColor={Theme.colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <FontAwesome6 name="xmark" size={14} color={Theme.colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterButton}>
            <FontAwesome6 name="sliders" size={12} color={Theme.colors.accent} />
            <Text style={styles.filterButtonText}>FLT</Text>
          </Pressable>
        </View>

        {/* Drivers List */}
        {isLoading && filteredDrivers.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Theme.colors.accent} />
            <Text style={styles.loadingText}>SYNCHRONIZING...</Text>
          </View>
        ) : filteredDrivers.length === 0 ? (
          <View style={styles.centerContent}>
            <FontAwesome6 name="user-astronaut" size={48} color={Theme.colors.textMuted} />
            <Text style={styles.emptyText}>
              {searchText ? 'NO OPERATORS FOUND' : 'NO OPERATORS ASSIGNED'}
            </Text>
          </View>
        ) : (
          <View style={styles.driversList}>
            {filteredDrivers.map((driver, index) => (
              <DriverCardItem
                key={driver._id}
                driver={driver}
                expandedId={expandedId}
                onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                onEdit={handleEditDriver}
                onDelete={handleDeleteDriver}
                onAssignVehicle={(driverId, driverName) =>
                  router.push({ pathname: '/assign-vehicle', params: { driverId, driverName } })
                }
                ownerId={ownerId}
              />
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Primary Global Action */}
      <Pressable
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <FontAwesome6 name="plus" size={24} color={Theme.colors.background} />
      </Pressable>

      {/* ADD DRIVER MODAL */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setIsModalVisible(false); reset(); setSelectedImage(null); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add New Operator</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <View style={styles.imageSection}>
                <Text style={styles.formLabel}>OPERATOR PROFILE *</Text>
                <View style={styles.imagePreview}>
                  {selectedImage && selectedImage.assets && selectedImage.assets[0] ? (
                    <Image source={{ uri: selectedImage.assets[0].uri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <View style={{ alignItems: 'center', gap: 12 }}>
                      <FontAwesome6 name="camera" size={32} color={Theme.colors.textMuted} />
                      <Text style={{ color: Theme.colors.textMuted, fontFamily: Theme.fonts.technical, fontSize: 10 }}>AWAITING PROTOCOL</Text>
                    </View>
                  )}
                </View>

                <View style={styles.imagePickerOptions}>
                  <Pressable style={styles.imagePickerOption} onPress={() => handlePickImage('camera')} disabled={isSubmitting}>
                    <FontAwesome6 name="camera" size={14} color={Theme.colors.accent} />
                    <Text style={styles.imagePickerOptionText}>CAMERA</Text>
                  </Pressable>
                  <Pressable style={styles.imagePickerOption} onPress={() => handlePickImage('gallery')} disabled={isSubmitting}>
                    <FontAwesome6 name="image" size={14} color={Theme.colors.text} />
                    <Text style={styles.imagePickerOptionText}>GALLERY</Text>
                  </Pressable>
                </View>
              </View>

              <Controller control={control} name="firstName" rules={{ required: 'Required' }} render={({ field: { onChange, value } }) => (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>FIRST NAME *</Text>
                  <TextInput style={styles.formInput} placeholder="Enter name" placeholderTextColor={Theme.colors.textMuted} value={value} onChangeText={onChange} />
                  {errors.firstName && (<Text style={{ color: Theme.colors.error, fontSize: 10, fontFamily: Theme.fonts.technical }}>{errors.firstName.message}</Text>)}
                </View>
              )}/>

              <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>LAST NAME</Text>
                  <TextInput style={styles.formInput} placeholder="Enter surname" placeholderTextColor={Theme.colors.textMuted} value={value} onChangeText={onChange} />
                </View>
              )}/>

              <Controller control={control} name="email" rules={{ required: 'Required' }} render={({ field: { onChange, value } }) => (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>CREDENITAL / EMAIL *</Text>
                  <TextInput style={styles.formInput} placeholder="Enter operator email" placeholderTextColor={Theme.colors.textMuted} value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" />
                  {errors.email && (<Text style={{ color: Theme.colors.error, fontSize: 10, fontFamily: Theme.fonts.technical }}>{errors.email.message}</Text>)}
                </View>
              )}/>

              <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>SECURE LINE / PHONE</Text>
                  <TextInput style={styles.formInput} placeholder="Enter comm channel" placeholderTextColor={Theme.colors.textMuted} value={value} onChangeText={onChange} keyboardType="phone-pad" />
                </View>
              )}/>

              <Controller control={control} name="password" rules={{ required: 'Required', minLength: 6 }} render={({ field: { onChange, value } }) => (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>ACCESS KEY / PASSWORD *</Text>
                  <TextInput style={styles.formInput} placeholder="Min 6 characters" placeholderTextColor={Theme.colors.textMuted} value={value} onChangeText={onChange} secureTextEntry />
                  {errors.password && (<Text style={{ color: Theme.colors.error, fontSize: 10, fontFamily: Theme.fonts.technical }}>Missing security requirements</Text>)}
                </View>
              )}/>

              <Pressable style={styles.submitButton} onPress={handleSubmit(onSubmitNewDriver)} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator size="small" color={Theme.colors.onPrimary} /> : <Text style={styles.submitButtonText}>AUTHORIZE DRIVER</Text>}
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={() => { setIsModalVisible(false); reset(); setSelectedImage(null); }} disabled={isSubmitting}>
                <Text style={styles.cancelButtonText}>ABORT</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT DRIVER MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Modify Clearance</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>FIRST NAME *</Text>
              <TextInput style={styles.formInput} placeholder="Name" placeholderTextColor={Theme.colors.textMuted} value={editFormData.firstName} onChangeText={(text) => setEditFormData({ ...editFormData, firstName: text })} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>LAST NAME</Text>
              <TextInput style={styles.formInput} placeholder="Last name" placeholderTextColor={Theme.colors.textMuted} value={editFormData.lastName} onChangeText={(text) => setEditFormData({ ...editFormData, lastName: text })} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>CREDENTIAL *</Text>
              <TextInput style={styles.formInput} placeholder="Email" placeholderTextColor={Theme.colors.textMuted} value={editFormData.email} onChangeText={(text) => setEditFormData({ ...editFormData, email: text })} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>SECURE LINE</Text>
              <TextInput style={styles.formInput} placeholder="Phone" placeholderTextColor={Theme.colors.textMuted} value={editFormData.phone} onChangeText={(text) => setEditFormData({ ...editFormData, phone: text })} />
            </View>

            <Pressable style={styles.submitButton} onPress={handleUpdateDriver} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator size="small" color={Theme.colors.onPrimary} /> : <Text style={styles.submitButtonText}>UPDATE PROTOCOL</Text>}
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => setIsEditModalVisible(false)} disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>ABORT</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
