import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RadioOption<T> {
  value: T;
  label: string;
  description?: string;
  sublabel?: string;
}

interface RadioGroupProps<T> {
  options: RadioOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  style?: ViewStyle;
  label?: string;
}

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  style,
  label,
}: RadioGroupProps<T>) {
  return (
    <View style={style} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            className={`flex-row items-center p-4 bg-white ${
              index < options.length - 1 ? 'border-b border-gray-100' : ''
            } ${isSelected ? 'bg-blue-50' : ''}`}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${option.label}${option.description ? `, ${option.description}` : ''}`}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}
            >
              {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
            </View>
            <View className="flex-1">
              <Text className={`text-base ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                {option.label}
              </Text>
              {option.description && (
                <Text className="text-sm text-gray-500 mt-0.5">{option.description}</Text>
              )}
              {option.sublabel && (
                <Text className="text-xs text-gray-400 mt-0.5">{option.sublabel}</Text>
              )}
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default RadioGroup;
