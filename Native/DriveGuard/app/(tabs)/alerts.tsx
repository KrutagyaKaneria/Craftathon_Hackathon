import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StatusBar,
  FlatList,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import useAlertsStore, { RealTimeAlert } from '../../store/alertsStore';
import apiClient from '../../services/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1f',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 71, 91, 0.15)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6e84',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a3a6ff',
    letterSpacing: 1.5,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#dfe4fe',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#a5aac2',
    lineHeight: 16,
    marginBottom: 12,
  },
  telemetryRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  telemetryItem: {
    fontSize: 11,
    color: '#a5aac2',
    lineHeight: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(65, 71, 91, 0.3)',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#dfe4fe',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#a3a6ff',
    borderRadius: 24,
  },
  exportButtonText: {
    fontSize: 11,
    color: '#070d1f',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alertsList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  alertCard: {
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    gap: 12,
  },
  alertCardHigh: {
    borderColor: 'rgba(255, 110, 132, 0.4)',
    backgroundColor: 'rgba(255, 110, 132, 0.05)',
  },
  alertCardMedium: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  alertCardLow: {
    borderColor: 'rgba(109, 254, 156, 0.4)',
    backgroundColor: 'rgba(109, 254, 156, 0.05)',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  driverPhoto: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 110, 132, 0.3)',
    backgroundColor: 'rgba(28, 37, 62, 0.6)',
  },
  alertTitleSection: {
    flex: 1,
  },
  eventType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6e84',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  severityTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBadgeHigh: {
    backgroundColor: '#ff6e84',
  },
  severityBadgeMedium: {
    backgroundColor: '#ffd700',
  },
  severityBadgeLow: {
    backgroundColor: '#6dfe9c',
  },
  severityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#070d1f',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 12,
    color: '#ff6e84',
    fontWeight: '600',
  },
  driverVehicleRow: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 8,
  },
  infoColumn: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6f758b',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dfe4fe',
  },
  telemetrySection: {
    gap: 6,
    paddingVertical: 8,
  },
  telemetryLabel: {
    fontSize: 9,
    color: '#6f758b',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  telemetryData: {
    fontSize: 12,
    color: '#ff6e84',
    fontWeight: '700',
  },
  telemetryDataSecondary: {
    color: '#a5aac2',
    fontWeight: '600',
  },
  markResolvedButton: {
    backgroundColor: '#a3a6ff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  markResolvedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#070d1f',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  remoteIntercom: {
    fontSize: 11,
    color: '#6f758b',
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(65, 71, 91, 0.2)',
    marginTop: 8,
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDotConnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6dfe9c',
  },
  statusDotDisconnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6e84',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#a5aac2',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resolveButton: {
    backgroundColor: '#a3a6ff',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 110, 132, 0.2)',
    borderWidth: 1,
    borderColor: '#ff6e84',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resolveButtonText: {
    color: '#070d1f',
  },
  deleteButtonText: {
    color: '#ff6e84',
  },
});

export default function AlertsScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const alerts = useAlertsStore((state) => state.alerts);
  const isConnected = useAlertsStore((state) => state.isConnected);
  const addAlert = useAlertsStore((state) => state.addAlert);
  const setConnected = useAlertsStore((state) => state.setConnected);
  const markAsResolved = useAlertsStore((state) => state.markAsResolved);
  const deleteAlert = useAlertsStore((state) => state.deleteAlert);

  const connectWebSocket = () => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      // Replace with your actual backend WebSocket URL
      const WS_URL = 'ws://192.168.1.100:5000/ws/alerts'; // Update this with your actual backend
      console.log('🔗 Connecting to WebSocket:', WS_URL);

      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          if (data.type === 'alert' || data.driverName) {
            // Map incoming alert data to our format
            const newAlert: RealTimeAlert = {
              _id: data._id || `alert-${Date.now()}`,
              driverName: data.driverName || 'Unknown Driver',
              vehicleNumber: data.vehicleNumber || 'Unknown',
              vehicleModel: data.vehicleModel || 'Unknown',
              eventType: data.eventType || 'Alert',
              subtype: data.subtype,
              severity: (data.severity || 'medium') as 'high' | 'medium' | 'low',
              timestamp: data.timestamp || new Date().toISOString(),
              telemetryData: data.telemetryData,
              driverPhoto: data.driverPhoto,
              resolved: false,
            };

            console.log('🚨 New alert added:', newAlert.eventType);
            addAlert(newAlert);

            // Play sound for high severity
            if (newAlert.severity === 'high') {
              // You can add sound playing here using react-native-sound or similar
              console.log('🔔 High severity alert - would play sound');
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('⚠️ WebSocket disconnected');
        setConnected(false);
        attemptReconnect();
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      attemptReconnect();
    }
  };

  const attemptReconnect = () => {
    reconnectAttemptsRef.current += 1;
    const delayMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

    console.log(
      `🔄 Attempting to reconnect in ${delayMs}ms (attempt ${reconnectAttemptsRef.current})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delayMs);
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('✅ Alerts screen loaded. Socket status:', isConnected ? 'Connected' : 'Offline');
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [isAuthenticated, token, isConnected]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ff6e84';
      case 'medium':
        return '#ffd700';
      case 'low':
        return '#6dfe9c';
      default:
        return '#a5aac2';
    }
  };

  const handleMarkAsResolved = (alert: RealTimeAlert) => {
    markAsResolved(alert._id);
    Alert.alert('Success', `Alert "${alert.eventType}" marked as resolved`);
  };

  const handleDeleteAlert = (alert: RealTimeAlert) => {
    Alert.alert(
      'Delete Alert',
      `Delete "${alert.eventType}" alert from ${alert.driverName}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // Call backend API to delete
              await apiClient.delete(`/api/alerts/${alert._id}`);
              // Remove from store
              deleteAlert(alert._id);
              Alert.alert('Success', 'Alert deleted successfully');
            } catch (error: any) {
              console.error('Error deleting alert:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete alert');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1f" />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.indicatorDot} />
              <Text style={styles.headerTitle}>The Sentinel Protocol</Text>
            </View>
            <View
              style={[
                styles.connectionStatus,
                {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: 'rgba(28, 37, 62, 0.4)',
                  borderRadius: 12,
                },
              ]}
            >
              <View
                style={isConnected ? styles.statusDotConnected : styles.statusDotDisconnected}
              />
              <Text style={styles.statusText}>{isConnected ? 'Connected' : 'Offline'}</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>Safety Feed</Text>
          <Text style={styles.subtitle}>
            Real-time telemetry oversight // {isConnected ? '0.04ms' : 'Offline'} latency
          </Text>

          <View style={styles.controlsRow}>
            <Pressable style={styles.filterButton}>
              <FontAwesome6 name="sliders" size={12} color="#dfe4fe" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </Pressable>
            <Pressable style={styles.exportButton}>
              <FontAwesome6 name="download" size={12} color="#070d1f" />
              <Text style={styles.exportButtonText}>Export Log</Text>
            </Pressable>
          </View>
        </View>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 
              name={isConnected ? "inbox" : "wifi-slash"} 
              size={48} 
              color={isConnected ? "#a5aac2" : "#ff6e84"} 
            />
            <Text style={styles.emptyText}>
              {isConnected ? 'No alerts yet' : 'Socket Disconnected'}
            </Text>
            <Text style={{ color: '#a5aac2', fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
              {isConnected 
                ? 'All triggered alerts will appear here'
                : 'Reconnecting to server...'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            contentContainerStyle={styles.alertsList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.alertCard,
                  item.severity === 'high'
                    ? styles.alertCardHigh
                    : item.severity === 'medium'
                    ? styles.alertCardMedium
                    : styles.alertCardLow,
                ]}
              >
                {/* Photo and Title */}
                <View style={styles.alertHeader}>
                  <View style={styles.driverPhoto}>
                    {item.driverPhoto ? (
                      <Image
                        source={{ uri: item.driverPhoto }}
                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                      />
                    ) : (
                      <FontAwesome6 name="user" size={32} color="#a5aac2" />
                    )}
                  </View>
                  <View style={styles.alertTitleSection}>
                    <Text style={styles.eventType}>{item.eventType}</Text>
                    <View style={styles.severityTimestamp}>
                      <Pressable
                        style={[
                          styles.severityBadge,
                          item.severity === 'high'
                            ? styles.severityBadgeHigh
                            : item.severity === 'medium'
                            ? styles.severityBadgeMedium
                            : styles.severityBadgeLow,
                        ]}
                      >
                        <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
                      </Pressable>
                      <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
                    </View>
                  </View>
                </View>

                {/* Driver and Vehicle Info */}
                <View style={styles.driverVehicleRow}>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Driver</Text>
                    <Text style={styles.infoValue}>{item.driverName}</Text>
                  </View>
                  <View style={styles.infoColumn}>
                    <Text style={styles.infoLabel}>Vehicle</Text>
                    <Text style={styles.infoValue}>
                      {item.vehicleNumber} {item.vehicleModel ? `(${item.vehicleModel})` : ''}
                    </Text>
                  </View>
                </View>

                {/* Telemetry Data */}
                {item.telemetryData && (
                  <View style={styles.telemetrySection}>
                    <Text style={styles.telemetryLabel}>Telemetry Data</Text>
                    {Object.entries(item.telemetryData).map(([key, value]) => (
                      <Text key={key} style={styles.telemetryData}>
                        {key.replace(/([A-Z])/g, ' $1')}: {String(value)}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <Pressable
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => handleMarkAsResolved(item)}
                    disabled={item.resolved}
                  >
                    <FontAwesome6 name="check" size={11} color="#070d1f" />
                    <Text style={[styles.actionButtonText, styles.resolveButtonText]}>Resolve</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAlert(item)}
                  >
                    <FontAwesome6 name="trash" size={11} color="#ff6e84" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </Pressable>
                </View>

                {/* Footer */}
                <Text style={styles.remoteIntercom}>Remote Intercom</Text>
              </View>
            )}
          />
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
