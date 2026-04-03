import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { DashboardAlert } from '../services/dashboardService';
import { Theme } from '@/constants/styles';

interface AlertCardProps {
  alert: DashboardAlert;
  onAction?: () => void;
  actionText?: string;
  style?: ViewStyle;
}

const getSeverityColor = (severity: DashboardAlert['severity']) => {
  switch (severity) {
    case 'high':
      return Theme.colors.error;
    case 'medium':
      return '#FFD700';
    case 'low':
      return Theme.colors.accent;
    default:
      return Theme.colors.text;
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

    if (diffMins < 1) return '< 1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  } catch {
    return 'RECENT';
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
    <View style={[styles.card, style]}>
      {/* Ghost Border Indicator */}
      <View style={[styles.ghostBorder, { backgroundColor: severityColor }]} />
      
      <View style={styles.cardContent}>
        {/* Header: Severity and Time */}
        <View style={styles.header}>
          <View style={styles.severityBadge}>
            <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
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

        {/* Footer: Unit and Action */}
        <View style={styles.footer}>
          <ThemedText style={styles.unitInfo}>
            UNIT-{alert.unitId || 'UNKNOWN'}
          </ThemedText>
          
          {onAction && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: severityColor + '40' }]}
              onPress={onAction}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.actionText, { color: severityColor }]}>
                {actionText.toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  ghostBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.8,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 9,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 10,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.textMuted,
  },
  alertType: {
    fontSize: 14,
    fontFamily: Theme.fonts.headline,
    color: Theme.colors.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitInfo: {
    fontSize: 10,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.accent,
    letterSpacing: 1,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: Theme.roundness.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  actionText: {
    fontSize: 10,
    fontFamily: Theme.fonts.label,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
