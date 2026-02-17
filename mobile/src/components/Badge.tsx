import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const Colors = {
  primary: { bg: '#0033A0', text: '#FFFFFF' },
  success: { bg: '#10B981', text: '#FFFFFF' },
  warning: { bg: '#F59E0B', text: '#FFFFFF' },
  error: { bg: '#EF4444', text: '#FFFFFF' },
  info: { bg: '#3B82F6', text: '#FFFFFF' },
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', size = 'md', children }) => {
  const variantColors = Colors[variant];

  const sizeStyles = {
    sm: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 },
    md: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
  }[size];

  return (
    <View
      style={[
        {
          backgroundColor: variantColors.bg,
          borderRadius: 20,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          alignSelf: 'flex-start',
        },
      ]}
    >
      <Text style={{ color: variantColors.text, fontWeight: '600', fontSize: sizeStyles.fontSize }}>
        {children}
      </Text>
    </View>
  );
};
