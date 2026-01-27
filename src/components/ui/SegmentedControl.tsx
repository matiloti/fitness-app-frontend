import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

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
            className={`flex-1 py-2 px-4 rounded-md items-center justify-center ${
              isSelected ? 'bg-white shadow-sm' : ''
            }`}
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
