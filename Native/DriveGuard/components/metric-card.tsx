import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './themed-text';
import { Theme } from '@/constants/styles';

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
      ? Theme.colors.accent
      : status === 'warning'
        ? '#FFD700'
        : Theme.colors.error;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.contentRow}>
        <View style={styles.innerContent}>
          <ThemedText style={styles.title}>{title.toUpperCase()}</ThemedText>
          
          <View style={styles.valueContainer}>
            <ThemedText style={styles.value}>{value}</ThemedText>
            {unit && <ThemedText style={styles.unit}>{unit}</ThemedText>}
          </View>
        </View>
        
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      {percentage !== undefined && (
        <View style={styles.percentageBarContainer}>
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.lg,
    padding: 16,
    marginBottom: 12,
    // Triple Diffusion Shadow Effect (Simulated via layering in React Native)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  innerContent: {
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  title: {
    fontSize: 10,
    fontFamily: Theme.fonts.label,
    color: Theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontFamily: Theme.fonts.display,
    color: Theme.colors.text,
  },
  unit: {
    fontSize: 12,
    fontFamily: Theme.fonts.technical,
    color: Theme.colors.textMuted,
    marginLeft: 6,
  },
  percentageBarContainer: {
    marginTop: 4,
  },
  percentageBar: {
    height: 3,
    backgroundColor: Theme.colors.outline,
    borderRadius: Theme.roundness.full,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    borderRadius: Theme.roundness.full,
  },
});
