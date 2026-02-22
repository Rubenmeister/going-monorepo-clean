/**
 * Notifications Screen
 * User notifications and activity feed
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
import { Bell, Trash2, Archive, Check } from 'react-native-feather';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

interface Notification {
  id: string;
  type: 'ride' | 'payment' | 'promotion' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export const NotificationsScreen: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () =>
      api.get<Notification[]>('/api/notifications', {
        params: { filter: filter === 'unread' ? { read: false } : {} },
      }),
  });

  const { mutate: markAsRead } = useMutation({
    mutationFn: (notificationId: string) =>
      api.put(`/api/notifications/${notificationId}/read`),
  });

  const { mutate: deleteNotification } = useMutation({
    mutationFn: (notificationId: string) =>
      api.delete(`/api/notifications/${notificationId}`),
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return '🚗';
      case 'payment':
        return '💳';
      case 'promotion':
        return '🎉';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ride':
        return '#007AFF';
      case 'payment':
        return '#4CAF50';
      case 'promotion':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const NotificationItem: React.FC<{ item: Notification }> = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read && styles.notificationRead]}
      onPress={() => !item.read && markAsRead(item.id)}
    >
      <View style={styles.notificationLeft}>
        <Text style={styles.notificationIcon}>
          {getNotificationIcon(item.type)}
        </Text>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
      <View style={styles.notificationActions}>
        {!item.read && (
          <View
            style={[
              styles.unreadBadge,
              { backgroundColor: getNotificationColor(item.type) },
            ]}
          />
        )}
        <TouchableOpacity
          onPress={() => deleteNotification(item.id)}
          style={styles.actionButton}
        >
          <Trash2 width={16} height={16} color="#999" />
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

  const notificationList = notifications?.data || [];
  const unreadCount = notificationList.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Bell width={24} height={24} color="#007AFF" />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadCount}>
            <Text style={styles.unreadCountText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.tabText, filter === 'all' && styles.tabTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'unread' && styles.tabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.tabText,
              filter === 'unread' && styles.tabTextActive,
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {notificationList.length > 0 ? (
        <FlatList
          data={notificationList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Bell width={48} height={48} color="#ddd" />
          <Text style={styles.emptyText}>
            {filter === 'unread'
              ? 'No unread notifications'
              : 'No notifications yet'}
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  unreadCount: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#f0f0f0',
  },
  tabText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationRead: {
    opacity: 0.7,
    borderLeftColor: '#ddd',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});
