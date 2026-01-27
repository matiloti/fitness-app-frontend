import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  default: 'bg-white rounded-xl',
  elevated: 'bg-white rounded-xl shadow-md',
  outlined: 'bg-white rounded-xl border border-gray-200',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  variant = 'default',
  padding = 'md',
  style,
  children,
  ...props
}: CardProps) {
  const classes = [variantStyles[variant], paddingStyles[padding]].filter(Boolean).join(' ');

  return (
    <View className={classes} style={style} {...props}>
      {children}
    </View>
  );
}

export default Card;
