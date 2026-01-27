import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TrendDirection } from '../../types/analytics';

interface MetricData {
  value: number | null;
  change?: number | null;
  trend?: TrendDirection;
}

interface BodyCompCardProps {
  bodyFat?: MetricData;
  muscleMass?: MetricData;
  style?: object;
}

export function BodyCompCard({ bodyFat, muscleMass, style }: BodyCompCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <MetricItem
          label="Body Fat"
          value={bodyFat?.value}
          change={bodyFat?.change}
          trend={bodyFat?.trend}
          unit="%"
          // For body fat, decreasing is good
          invertColors
        />
        <View style={styles.divider} />
        <MetricItem
          label="Muscle"
          value={muscleMass?.value}
          change={muscleMass?.change}
          trend={muscleMass?.trend}
          unit="%"
        />
      </View>
    </View>
  );
}

interface MetricItemProps {
  label: string;
  value: number | null | undefined;
  change?: number | null;
  trend?: TrendDirection;
  unit: string;
  invertColors?: boolean;
}

function MetricItem({
  label,
  value,
  change,
  trend,
  unit,
  invertColors = false,
}: MetricItemProps) {
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
    if (!trend || trend === 'STABLE') return '#8E8E93';

    const isIncreasing = trend === 'INCREASING';
    const isGood = invertColors ? !isIncreasing : isIncreasing;

    return isGood ? '#34C759' : '#FF3B30';
  };

  const formatChange = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}${unit}`;
  };

  return (
    <View
      style={styles.metricItem}
      accessibilityLabel={`${label} ${value ?? 'not set'} ${unit}`}
    >
      <Text style={styles.metricValue}>
        {value !== null && value !== undefined ? value.toFixed(1) : '--'}
        <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {change !== null && change !== undefined && (
        <View style={styles.changeContainer}>
          <Ionicons
            name={getTrendIcon() as any}
            size={12}
            color={getTrendColor()}
          />
          <Text style={[styles.changeText, { color: getTrendColor() }]}>
            {formatChange(change)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  metricUnit: {
    fontSize: 17,
    fontWeight: '500',
    color: '#8E8E93',
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BodyCompCard;
