/**
 * Dashboard Screen
 * Main user dashboard with trip overview, stats, and quick actions
 */

import React from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  MapPin,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowRight,
  Plus,
  Settings,
} from 'react-native-feather';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface DashboardStats {
  totalTrips: number;
  totalDistance: number;
  totalSpent: number;
  averageRating: number;
  upcomingTrips: number;
}

export const DashboardScreen: React.FC<{
  onNavigate?: (screen: string) => void;
}> = ({ onNavigate }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/api/user/dashboard-stats'),
  });

  const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    unit?: string;
    color: string;
  }> = ({ icon, label, value, unit, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>
          {value}
          {unit && <Text style={styles.statUnit}> {unit}</Text>}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back! 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate?.('settings')}>
            <Settings width={24} height={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('location-tracking')}
          >
            <View style={styles.actionIcon}>
              <MapPin width={20} height={20} color="#fff" />
            </View>
            <Text style={styles.actionText}>Request Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('wallet')}
          >
            <View style={styles.actionIcon}>
              <DollarSign width={20} height={20} color="#fff" />
            </View>
            <Text style={styles.actionText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate?.('invoices')}
          >
            <View style={styles.actionIcon}>
              <Clock width={20} height={20} color="#fff" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          <StatCard
            icon={<TrendingUp width={20} height={20} color="#FF6B6B" />}
            label="Total Trips"
            value={stats?.data?.totalTrips?.toString() || '0'}
            color="#FF6B6B"
          />
          <StatCard
            icon={<MapPin width={20} height={20} color="#4ECDC4" />}
            label="Distance Traveled"
            value={stats?.data?.totalDistance?.toFixed(1) || '0'}
            unit="km"
            color="#4ECDC4"
          />
          <StatCard
            icon={<DollarSign width={20} height={20} color="#45B7D1" />}
            label="Total Spent"
            value={`$${(stats?.data?.totalSpent || 0).toFixed(2)}`}
            color="#45B7D1"
          />
        </View>

        {/* Upcoming Trips */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            <TouchableOpacity onPress={() => onNavigate?.('invoices')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {(stats?.data?.upcomingTrips || 0) > 0 ? (
            <View style={styles.tripCard}>
              <View style={styles.tripInfo}>
                <Text style={styles.tripRoute}>
                  Downtown → Airport Terminal
                </Text>
                <Text style={styles.tripTime}>Today at 4:30 PM</Text>
              </View>
              <ArrowRight width={20} height={20} color="#007AFF" />
            </View>
          ) : (
            <Text style={styles.noTripsText}>No upcoming trips scheduled</Text>
          )}
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Your Rating</Text>
          <View style={styles.ratingDisplay}>
            <Text style={styles.ratingValue}>
              {(stats?.data?.averageRating || 0).toFixed(1)}
            </Text>
            <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
          </View>
          <Text style={styles.ratingNote}>
            Based on {stats?.data?.totalTrips || 0} trips
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statUnit: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'normal',
  },
  upcomingSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  tripCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tripTime: {
    fontSize: 12,
    color: '#999',
  },
  noTripsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingStars: {
    fontSize: 16,
    marginTop: 4,
  },
  ratingNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
