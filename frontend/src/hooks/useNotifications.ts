/**
 * useNotifications Hook
 * Manages real-time notification updates via WebSocket
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

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
  data?: Record<string, any>;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Connect to notification gateway
    const socket = io(
      process.env.REACT_APP_API_URL || 'http://localhost:3001',
      {
        namespace: '/notifications',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    socketRef.current = socket;

    // Connection handlers
    socket.on('connection:success', () => {
      console.log('Connected to notification gateway');
      setIsConnected(true);

      // Subscribe to user's notifications
      socket.emit('subscribe', {
        userId: user.id,
        companyId: user.companyId,
      });
    });

    socket.on('subscribe:success', () => {
      console.log('Subscribed to notifications');
    });

    socket.on('subscribe:error', (error) => {
      console.error('Subscribe error:', error);
    });

    // Notification handlers
    socket.on('notification:new', (data: { notification: Notification }) => {
      setNotifications((prev) => [data.notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on('notification:read', (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notificationId
            ? { ...n, status: 'READ', readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on(
      'notification:status-update',
      (data: { notificationId: string; status: string }) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === data.notificationId ? { ...n, status: data.status } : n
          )
        );
      }
    );

    socket.on('disconnect', () => {
      console.log('Disconnected from notification gateway');
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.emit('unsubscribe', {
          userId: user.id,
          companyId: user.companyId,
        });
        socket.disconnect();
      }
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId: string) => {
      if (socketRef.current) {
        socketRef.current.emit('notification:mark-read', {
          notificationId,
          userId: user?.id,
        });
      }
    },
    [user]
  );

  // Request unread notifications
  const requestUnreadNotifications = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('notifications:request-unread', {
        userId: user?.id,
      });
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    notifications.forEach((n) => {
      if (n.status !== 'READ') {
        markAsRead(n.id);
      }
    });
  }, [notifications, markAsRead]);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestUnreadNotifications,
  };
};
