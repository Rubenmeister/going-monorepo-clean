import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width: w = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.base,
        { width: w as any, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

// ── Skeleton compuestos listos para usar ──────────────────────────────────

export function SkeletonTripCard() {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} />
        </View>
        <Skeleton width={60} height={22} borderRadius={11} />
      </View>
      <View style={{ gap: 8, marginTop: 12 }}>
        <Skeleton height={12} />
        <Skeleton width="80%" height={12} />
      </View>
      <View style={cardStyles.footer}>
        <Skeleton width={80} height={12} />
        <Skeleton width={50} height={12} />
      </View>
    </View>
  );
}

export function SkeletonTripDetail() {
  return (
    <View style={{ padding: 20, gap: 20 }}>
      {/* Hero status */}
      <Skeleton height={80} borderRadius={16} />
      {/* Route */}
      <View style={{ gap: 10 }}>
        <Skeleton width="30%" height={11} />
        <Skeleton height={14} />
        <Skeleton width="75%" height={14} />
      </View>
      {/* Grid */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Skeleton width="48%" height={70} borderRadius={12} />
        <Skeleton width="48%" height={70} borderRadius={12} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Skeleton width="48%" height={70} borderRadius={12} />
        <Skeleton width="48%" height={70} borderRadius={12} />
      </View>
      {/* Driver */}
      <View style={cardStyles.driverRow}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="70%" height={11} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonPaymentCard() {
  return (
    <View style={cardStyles.payCard}>
      <Skeleton width={40} height={40} borderRadius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </View>
      <Skeleton width={32} height={32} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmer: {
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  driverRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, backgroundColor: '#F9FAFB',
  },
  payCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
});
