/**
 * Notification Drawer Component
 * Real-time notification drawer that appears on new notifications
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationDrawer.css';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  icon?: React.ReactNode;
}

export const NotificationDrawer: React.FC = () => {
  const [displayedNotifications, setDisplayedNotifications] = useState<
    NotificationItem[]
  >([]);
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];

      // Check if notification is already displayed
      if (!displayedNotifications.some((n) => n.id === latestNotification.id)) {
        const newItem: NotificationItem = {
          id: latestNotification.id,
          title: latestNotification.title,
          message: latestNotification.message,
          type: latestNotification.type,
          priority: latestNotification.priority,
          icon: getIconForType(latestNotification.type),
        };

        setDisplayedNotifications((prev) => [newItem, ...prev].slice(0, 3)); // Show max 3

        // Auto-remove after 5 seconds
        setTimeout(() => {
          setDisplayedNotifications((prev) =>
            prev.filter((n) => n.id !== latestNotification.id)
          );
        }, 5000);
      }
    }
  }, [notifications]);

  const handleDismiss = (notificationId: string) => {
    setDisplayedNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  const getIconForType = (type: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      INVOICE_ISSUED: <CheckCircle size={20} />,
      INVOICE_PAYMENT_REMINDER: <AlertCircle size={20} />,
      INVOICE_OVERDUE: <AlertCircle size={20} />,
      INVOICE_PAID: <CheckCircle size={20} />,
      LOCATION_ALERT: <Info size={20} />,
      GEOFENCE_ENTRY: <Info size={20} />,
      GEOFENCE_EXIT: <Info size={20} />,
      DELIVERY_UPDATE: <CheckCircle size={20} />,
    };
    return iconMap[type] || <Info size={20} />;
  };

  const getPriorityClass = (priority: string): string => {
    return `priority-${priority.toLowerCase()}`;
  };

  return (
    <div className="notification-drawer">
      {displayedNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-toast ${getPriorityClass(
            notification.priority
          )}`}
        >
          <div className="toast-icon">{notification.icon}</div>

          <div className="toast-content">
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
          </div>

          <button
            className="toast-dismiss"
            onClick={() => handleDismiss(notification.id)}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationDrawer;
