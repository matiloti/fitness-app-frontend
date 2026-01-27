import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsRowProps {
  title: string;
  value?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  style?: ViewStyle;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  title,
  value,
  subtitle,
  icon,
  iconColor = '#6B7280',
  onPress,
  showChevron = true,
  destructive = false,
  style,
  isFirst = false,
  isLast = false,
}: SettingsRowProps) {
  const content = (
    <View
      className={`flex-row items-center py-3 px-4 bg-white ${
        !isLast ? 'border-b border-gray-100' : ''
      } ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''}`}
      style={style}
    >
      {icon && (
        <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      )}
      <View className="flex-1">
        <Text
          className={`text-base ${destructive ? 'text-red-500' : 'text-gray-900'}`}
        >
          {title}
        </Text>
        {subtitle && <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>}
      </View>
      {value && (
        <Text className="text-base text-gray-500 mr-2" numberOfLines={1}>
          {value}
        </Text>
      )}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}${value ? `, current value: ${value}` : ''}`}
        accessibilityHint="Double tap to change"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default SettingsRow;
