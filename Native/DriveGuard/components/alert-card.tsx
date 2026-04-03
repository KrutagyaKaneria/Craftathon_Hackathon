import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { DashboardAlert } from '../services/dashboardService';

interface AlertCardProps {
  alert: DashboardAlert;
  onAction?: () => void;
  actionText?: string;
  style?: ViewStyle;
}

const getSeverityColor = (severity: DashboardAlert['severity']) => {
  switch (severity) {
    case 'high':
      return '#FF6B6B';
    case 'medium':
      return '#FFD700';
    case 'low':
      return '#00D9FF';
    default:
      return '#FFFFFF';
  }
};

const getSeverityLabel = (severity: string): string => {
  const sevStr = String(severity);
  switch (sevStr) {
    case 'high':
      return 'HIGH SEVERITY';
    case 'medium':
      return 'MEDIUM SEVERITY';
    case 'low':
      return 'LOW SEVERITY';
    default:
      return sevStr.toUpperCase();
  }
};

const getAlertTypeLabel = (type: string): string => {
  const typeStr = String(type);
  switch (typeStr) {
    case 'driver_fatigue':
      return 'DRIVER FATIGUE';
    case 'hard_braking':
      return 'HARD BRAKING';
    case 'route_deviation':
      return 'ROUTE DEVIATION';
    case 'protocol_breach':
      return 'PROTOCOL BREACH';
    default:
      return typeStr.toUpperCase();
  }
};

const getTimeAgo = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return '< 1 minute ago';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAction,
  actionText = 'INVESTIGATE',
  style,
}) => {
  const severityColor = getSeverityColor(alert.severity);

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: severityColor },
        style,
      ]}
    >
      {/* Header: Severity and Time */}
      <View style={styles.header}>
        <View style={styles.severityBadge}>
          <View
            style={[
              styles.severityDot,
              { backgroundColor: severityColor },
            ]}
          />
          <ThemedText style={styles.severityText}>
            {getSeverityLabel(alert.severity)}
          </ThemedText>
        </View>
        <ThemedText style={styles.timeText}>
          {getTimeAgo(alert.timestamp)}
        </ThemedText>
      </View>

      {/* Alert Type and Description */}
      <ThemedText style={styles.alertType}>
        {getAlertTypeLabel(alert.type)}
      </ThemedText>
      
      <ThemedText style={styles.description}>
        {alert.description}
      </ThemedText>

      {/* Unit Info */}
      {alert.unitId && (
        <ThemedText style={styles.unitInfo}>
          Unit {alert.unitId}
        </ThemedText>
      )}

      {/* Action Button */}
      {onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: severityColor }]}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.actionText, { color: severityColor }]}>
            {actionText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  timeText: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.5,
  },
  alertType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    lineHeight: 16,
    marginBottom: 8,
  },
  unitInfo: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.5,
    marginBottom: 10,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
