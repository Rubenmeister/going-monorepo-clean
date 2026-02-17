import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

const Colors = {
  primary: '#0033A0',
  primaryLight: '#1a4dcc',
  primaryDark: '#001f66',
  secondary: '#FF6B35',
  white: '#FFFFFF',
  gray200: '#E5E7EB',
  gray900: '#111827',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  onPress,
  children,
  style,
}) => {
  const baseStyles: ViewStyle = {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    opacity: loading || disabled ? 0.6 : 1,
  };

  const sizeStyles: ViewStyle = {
    sm: { paddingHorizontal: 16, paddingVertical: 8 },
    md: { paddingHorizontal: 24, paddingVertical: 12 },
    lg: { paddingHorizontal: 32, paddingVertical: 16 },
  }[size];

  const variantStyles: ViewStyle = {
    primary: { backgroundColor: Colors.primary },
    secondary: { backgroundColor: Colors.secondary },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    ghost: { backgroundColor: 'transparent' },
  }[variant];

  const textColor: TextStyle = {
    primary: { color: Colors.white },
    secondary: { color: Colors.white },
    outline: { color: Colors.primary },
    ghost: { color: Colors.primary },
  }[variant];

  return (
    <TouchableOpacity
      style={[
        baseStyles,
        sizeStyles,
        variantStyles,
        fullWidth && { width: '100%' },
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white} />
      ) : (
        <Text style={[{ fontWeight: '600', fontSize: 14 }, textColor]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
