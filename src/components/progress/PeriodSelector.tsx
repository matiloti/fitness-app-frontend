import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import type { Period } from '../../types/analytics';

interface PeriodOption {
  value: Period;
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
];

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  options?: PeriodOption[];
  style?: object;
}

export function PeriodSelector({
  value,
  onChange,
  options = PERIOD_OPTIONS,
  style,
}: PeriodSelectorProps) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="tablist"
      accessibilityLabel="Time period"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${option.label} ${getFullPeriodName(option.value)}`}
          >
            <Text
              style={[
                styles.pillText,
                isSelected && styles.pillTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getFullPeriodName(period: Period): string {
  switch (period) {
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
    case '1y':
      return 'Last year';
    case 'all':
      return 'All time';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: '#007AFF',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
});

export default PeriodSelector;
