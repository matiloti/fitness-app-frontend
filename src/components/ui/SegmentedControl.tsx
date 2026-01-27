import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

// Shadow styles defined outside component to avoid NativeWind shadow-* class issues
// that cause "Couldn't find a navigation context" errors with expo-router
// See: https://github.com/nativewind/nativewind/issues/1516
const styles = StyleSheet.create({
  selectedOption: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View
      className="flex-row bg-gray-100 rounded-lg p-1"
      style={style}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            className="flex-1 py-2 px-4 rounded-md items-center justify-center"
            style={isSelected ? styles.selectedOption : undefined}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
          >
            <Text
              className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
