/**
 * Invoices Screen
 * Trip history, receipts, and billing information
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  Download,
  Share2,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
} from 'react-native-feather';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface Trip {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  amount: number;
  currency: string;
  duration: number;
  distance: number;
  status: 'completed' | 'cancelled';
  rating?: number;
}

export const InvoicesScreen: React.FC = () => {
  const [sortBy, setSortBy] = useState<'recent' | 'amount'>('recent');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'completed' | 'cancelled'
  >('all');

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips', sortBy, filterStatus],
    queryFn: () =>
      api.get<Trip[]>('/api/user/trips', {
        params: {
          sort: sortBy,
          status: filterStatus === 'all' ? undefined : filterStatus,
        },
      }),
  });

  const TripCard: React.FC<{ trip: Trip }> = ({ trip }) => (
    <TouchableOpacity style={styles.tripCard} activeOpacity={0.7}>
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDate}>
            {new Date(trip.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <View style={styles.tripRoute}>
            <MapPin width={14} height={14} color="#999" />
            <Text style={styles.tripAddress} numberOfLines={1}>
              {trip.startLocation}
            </Text>
          </View>
          <View style={styles.tripRoute}>
            <MapPin width={14} height={14} color="#FF6B6B" />
            <Text style={styles.tripAddress} numberOfLines={1}>
              {trip.endLocation}
            </Text>
          </View>
        </View>
        <View style={styles.tripAmount}>
          <Text style={styles.amount}>${trip.amount.toFixed(2)}</Text>
          <View
            style={[
              styles.statusBadge,
              trip.status === 'completed'
                ? styles.statusCompleted
                : styles.statusCancelled,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                trip.status === 'completed'
                  ? styles.statusCompletedText
                  : styles.statusCancelledText,
              ]}
            >
              {trip.status === 'completed' ? '✓' : '✕'} {trip.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.tripDetails}>
        <View style={styles.detailItem}>
          <Clock width={14} height={14} color="#666" />
          <Text style={styles.detailText}>{trip.duration} min</Text>
        </View>
        <Text style={styles.divider}>•</Text>
        <View style={styles.detailItem}>
          <MapPin width={14} height={14} color="#666" />
          <Text style={styles.detailText}>{trip.distance.toFixed(1)} km</Text>
        </View>
        {trip.rating && (
          <>
            <Text style={styles.divider}>•</Text>
            <Text style={styles.detailText}>⭐ {trip.rating}</Text>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.tripActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Download width={16} height={16} color="#007AFF" />
          <Text style={styles.actionText}>Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Share2 width={16} height={16} color="#007AFF" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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

  const tripList = trips?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <FileText width={24} height={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Trip History</Text>
        </View>
      </View>

      {/* Summary Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.summaryScroll}
        contentContainerStyle={styles.summaryContent}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Trips</Text>
          <Text style={styles.summaryValue}>{tripList.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>
            ${tripList.reduce((sum, trip) => sum + trip.amount, 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Distance</Text>
          <Text style={styles.summaryValue}>
            {tripList.reduce((sum, trip) => sum + trip.distance, 0).toFixed(1)}{' '}
            km
          </Text>
        </View>
      </ScrollView>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === 'all' && styles.filterTabActive,
          ]}
          onPress={() => setFilterStatus('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'all' && styles.filterTabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterStatus === 'cancelled' && styles.filterTabActive,
          ]}
          onPress={() => setFilterStatus('cancelled')}
        >
          <Text
            style={[
              styles.filterTabText,
              filterStatus === 'cancelled' && styles.filterTabTextActive,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trips List */}
      {tripList.length > 0 ? (
        <FlatList
          data={tripList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TripCard trip={item} />}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FileText width={48} height={48} color="#ddd" />
          <Text style={styles.emptyText}>No trips found</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#f0f0f0',
  },
  filterTabText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  tripAddress: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  tripAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusCancelled: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusCompletedText: {
    color: '#4CAF50',
  },
  statusCancelledText: {
    color: '#FF6B6B',
  },
  tripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    color: '#ddd',
    marginHorizontal: 6,
  },
  tripActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
