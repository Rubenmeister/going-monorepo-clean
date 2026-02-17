import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes, borderRadius } from '@going-monorepo-clean/shared-ui';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  timeAgo: string;
}

export const NotificationsScreen = () => {
  const { auth, domain } = useMonorepoApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    if (!auth.user) return;
    setIsLoading(true);
    const result = await domain.notification.getByUser.execute(auth.user.id, 'token');
    if (result.isOk()) {
      setNotifications(result.value);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [auth.user]);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await domain.notification.markAsRead.execute(notificationId, 'token');
    if (result.isOk()) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => !item.isRead && handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationRow}>
        <View style={[styles.indicator, !item.isRead && styles.unreadIndicator]} />
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.timeAgo}>{item.timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <Text style={styles.headerCount}>
          {notifications.filter((n) => !n.isRead).length} sin leer
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No tienes notificaciones</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: { fontSize: fontSizes['2xl'], fontWeight: 'bold', color: colors.gray[900] },
  headerCount: { fontSize: fontSizes.sm, color: colors.gray[500], marginTop: 4 },
  list: { padding: spacing.md },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  notificationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    marginTop: 6,
    marginRight: spacing.sm,
  },
  unreadIndicator: { backgroundColor: colors.primary },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: fontSizes.base, color: colors.gray[700] },
  unreadTitle: { fontWeight: '600', color: colors.gray[900] },
  notificationBody: { fontSize: fontSizes.sm, color: colors.gray[500], marginTop: 4, lineHeight: 20 },
  timeAgo: { fontSize: fontSizes.xs, color: colors.gray[400], marginTop: spacing.xs },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: fontSizes.base, color: colors.gray[400] },
});
