import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './themed-text';

interface MetricCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  percentage?: number;
  status?: 'optimal' | 'warning' | 'critical';
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  unit,
  percentage,
  status = 'optimal',
  style,
}) => {
  const percentageColor =
    status === 'optimal'
      ? '#00D9FF'
      : status === 'warning'
        ? '#FFD700'
        : '#FF4444';

  return (
    <View style={[styles.card, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <ThemedText style={styles.title}>{title}</ThemedText>
      
      <View style={styles.valueContainer}>
        <ThemedText style={styles.value}>{value}</ThemedText>
        {unit && <ThemedText style={styles.unit}>{unit}</ThemedText>}
      </View>

      {percentage !== undefined && (
        <View style={styles.percentageBar}>
          <View
            style={[
              styles.percentageFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: percentageColor,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unit: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
    marginLeft: 4,
  },
  percentageBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    borderRadius: 2,
  },
});
