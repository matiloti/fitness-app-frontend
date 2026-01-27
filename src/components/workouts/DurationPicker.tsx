import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DurationPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: object;
}

const QUICK_PRESETS = [15, 30, 45, 60];

export function DurationPicker({
  value,
  onChange,
  min = 1,
  max = 300,
  step = 5,
  style,
}: DurationPickerProps) {
  const increment = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Quick Presets */}
      <View style={styles.presetsContainer}>
        {QUICK_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              value === preset && styles.presetButtonActive,
            ]}
            onPress={() => onChange(preset)}
            accessibilityLabel={`${preset} minutes`}
            accessibilityState={{ selected: value === preset }}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.presetText,
                value === preset && styles.presetTextActive,
              ]}
            >
              {preset}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stepper */}
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
          onPress={decrement}
          disabled={value <= min}
          accessibilityLabel="Decrease duration"
          accessibilityRole="button"
        >
          <Ionicons
            name="remove"
            size={24}
            color={value <= min ? '#C7C7CC' : '#007AFF'}
          />
        </TouchableOpacity>

        <View
          style={styles.valueContainer}
          accessibilityLabel={`Duration ${formatDuration(value)}`}
          accessibilityHint="Adjustable, use plus and minus buttons to change"
        >
          <Text style={styles.valueText}>{formatDuration(value)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]}
          onPress={increment}
          disabled={value >= max}
          accessibilityLabel="Increase duration"
          accessibilityRole="button"
        >
          <Ionicons
            name="add"
            size={24}
            color={value >= max ? '#C7C7CC' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 60,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#007AFF',
  },
  presetText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
  },
  stepperButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.5,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  valueText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default DurationPicker;
