import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, padding = 'md', style }) => {
  const paddingMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: paddingMap[padding],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};
