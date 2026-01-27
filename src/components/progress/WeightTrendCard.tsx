import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TrendDirection } from '../../types/analytics';

interface WeightTrendCardProps {
  currentWeight: number | null;
  previousWeight?: number | null;
  change?: number | null;
  changePercent?: number | null;
  trend?: TrendDirection;
  unit?: string;
  onLogPress?: () => void;
  style?: object;
}

export function WeightTrendCard({
  currentWeight,
  previousWeight,
  change,
  changePercent,
  trend,
  unit = 'kg',
  onLogPress,
  style,
}: WeightTrendCardProps) {
  const getTrendIcon = (): string => {
    if (!trend) return 'remove';
    switch (trend) {
      case 'INCREASING':
        return 'arrow-up';
      case 'DECREASING':
        return 'arrow-down';
      case 'STABLE':
      default:
        return 'remove';
    }
  };

  const getTrendColor = (): string => {
    // For weight loss goals, decreasing is good (green)
    // This could be made configurable based on user's goal
    if (!trend) return '#8E8E93';
    switch (trend) {
      case 'DECREASING':
        return '#34C759'; // Green - losing weight (assuming loss goal)
      case 'INCREASING':
        return '#FF3B30'; // Red - gaining weight
      case 'STABLE':
      default:
        return '#8E8E93';
    }
  };

  const formatChange = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '--';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Metrics</Text>
        {onLogPress && (
          <TouchableOpacity
            style={styles.logButton}
            onPress={onLogPress}
            accessibilityLabel="Log body metrics"
            accessibilityHint="Open form to log weight and body composition"
          >
            <Text style={styles.logButtonText}>Log</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.mainMetric}>
          <Text
            style={styles.weightValue}
            accessibilityLabel={`Current weight ${currentWeight ?? 'not set'} ${unit}`}
          >
            {currentWeight !== null ? currentWeight.toFixed(1) : '--'}
          </Text>
          <Text style={styles.weightUnit}>{unit}</Text>
        </View>

        {change !== null && change !== undefined && (
          <View style={styles.changeContainer}>
            <Ionicons
              name={getTrendIcon() as any}
              size={16}
              color={getTrendColor()}
            />
            <Text style={[styles.changeText, { color: getTrendColor() }]}>
              {formatChange(change)} {unit}
            </Text>
            {changePercent !== null && changePercent !== undefined && (
              <Text style={[styles.changePercent, { color: getTrendColor() }]}>
                ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
              </Text>
            )}
          </View>
        )}

        {previousWeight !== null && previousWeight !== undefined && (
          <Text style={styles.previousText}>
            vs yesterday: {previousWeight.toFixed(1)} {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  logButtonText: {
    fontSize: 15,
    color: '#007AFF',
  },
  content: {
    alignItems: 'center',
  },
  mainMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
  },
  weightUnit: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '500',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  changeText: {
    fontSize: 15,
    fontWeight: '500',
  },
  changePercent: {
    fontSize: 13,
  },
  previousText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
});

export default WeightTrendCard;
