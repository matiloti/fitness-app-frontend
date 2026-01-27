import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-blue-500 active:bg-blue-600',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-gray-100 active:bg-gray-200 border border-gray-300',
    text: 'text-gray-900',
  },
  ghost: {
    container: 'bg-transparent active:bg-gray-100',
    text: 'text-blue-500',
  },
  destructive: {
    container: 'bg-red-500 active:bg-red-600',
    text: 'text-white',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: 'py-2 px-4 rounded-lg',
    text: 'text-sm',
  },
  md: {
    container: 'py-3 px-6 rounded-xl',
    text: 'text-base',
  },
  lg: {
    container: 'py-4 px-8 rounded-xl',
    text: 'text-lg',
  },
};

const disabledStyles = {
  container: 'bg-gray-200',
  text: 'text-gray-400',
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const containerClasses = [
    'flex-row items-center justify-center',
    fullWidth ? 'w-full' : '',
    isDisabled ? disabledStyles.container : variantStyle.container,
    sizeStyle.container,
  ]
    .filter(Boolean)
    .join(' ');

  const textClasses = [
    'font-semibold',
    isDisabled ? disabledStyles.text : variantStyle.text,
    sizeStyle.text,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TouchableOpacity
      className={containerClasses}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={style}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? 'white' : '#007AFF'}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text className={textClasses} style={[icon ? { marginHorizontal: 8 } : {}, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;
