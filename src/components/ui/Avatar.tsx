import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  showEditBadge?: boolean;
  style?: ViewStyle;
}

const sizeMap = {
  sm: { container: 40, text: 14, icon: 20, badge: 16 },
  md: { container: 56, text: 20, icon: 28, badge: 20 },
  lg: { container: 80, text: 28, icon: 36, badge: 24 },
  xl: { container: 100, text: 36, icon: 44, badge: 28 },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  uri,
  name,
  size = 'md',
  onPress,
  showEditBadge = false,
  style,
}: AvatarProps) {
  const dimensions = sizeMap[size];

  const content = (
    <View
      className="relative items-center justify-center bg-gray-200 rounded-full overflow-hidden"
      style={[{ width: dimensions.container, height: dimensions.container }, style]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dimensions.container, height: dimensions.container }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <>
          {name ? (
            <Text
              className="font-semibold text-gray-600"
              style={{ fontSize: dimensions.text }}
            >
              {getInitials(name)}
            </Text>
          ) : (
            <Ionicons name="person" size={dimensions.icon} color="#9CA3AF" />
          )}
        </>
      )}
      {showEditBadge && (
        <View
          className="absolute bottom-0 right-0 bg-blue-500 rounded-full items-center justify-center border-2 border-white"
          style={{
            width: dimensions.badge,
            height: dimensions.badge,
          }}
        >
          <Ionicons name="camera" size={dimensions.badge * 0.5} color="white" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${name || 'User'} avatar${showEditBadge ? ', tap to change photo' : ''}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default Avatar;
