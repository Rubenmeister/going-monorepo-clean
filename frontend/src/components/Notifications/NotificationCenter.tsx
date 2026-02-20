/**
 * Notification Center Component
 * Displays notifications history and unread count
 */

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, Archive } from 'lucide-react';
import { api } from '../../services/api';
import './NotificationCenter.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export const NotificationCenter: React.FC = () => {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading, error } = useQuery<NotificationListResponse>({
    queryKey: ['notifications', offset, limit],
    queryFn: () =>
      api.get(`/api/notifications?limit=${limit}&offset=${offset}`),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      api.put(`/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.put(`/api/notifications/mark-all-read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (data?.unreadCount === 0) return;
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      LOW: '#CBD5E0',
      NORMAL: '#4299E1',
      HIGH: '#ED8936',
      URGENT: '#F56565',
    };
    return colors[priority as keyof typeof colors] || colors.NORMAL;
  };

  const getStatusIcon = (status: string): string => {
    return status === 'READ' ? '✓' : '●';
  };

  return (
    <div className="notification-center">
      <div className="notification-header">
        <div className="notification-title">
          <Bell size={24} />
          <h2>Notifications</h2>
          {data?.unreadCount > 0 && (
            <span className="unread-badge">{data.unreadCount}</span>
          )}
        </div>

        {data?.unreadCount > 0 && (
          <button
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading && <div className="loading">Loading notifications...</div>}

      {error && (
        <div className="error">
          Failed to load notifications. Please try again.
        </div>
      )}

      {data?.notifications && data.notifications.length === 0 && (
        <div className="empty-state">
          <Bell size={48} />
          <p>No notifications yet</p>
        </div>
      )}

      {data?.notifications && data.notifications.length > 0 && (
        <>
          <div className="notification-list">
            {data.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.status.toLowerCase()}`}
                style={{
                  borderLeftColor: getPriorityColor(notification.priority),
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-status">
                  {getStatusIcon(notification.status)}
                </div>

                <div className="notification-content">
                  <div className="notification-header-row">
                    <h3>{notification.title}</h3>
                    <span className="notification-type">
                      {notification.type}
                    </span>
                  </div>

                  <p className="notification-message">{notification.message}</p>

                  <div className="notification-footer">
                    <time>
                      {new Date(notification.createdAt).toLocaleString()}
                    </time>

                    {notification.actionLabel && (
                      <span className="action-label">
                        {notification.actionLabel}
                      </span>
                    )}
                  </div>
                </div>

                {notification.status !== 'READ' && (
                  <button
                    className="read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    title="Mark as read"
                  >
                    ●
                  </button>
                )}
              </div>
            ))}
          </div>

          {data.total > limit && (
            <div className="pagination">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </button>

              <span>
                {offset + 1} - {Math.min(offset + limit, data.total)} of{' '}
                {data.total}
              </span>

              <button
                disabled={offset + limit >= data.total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
