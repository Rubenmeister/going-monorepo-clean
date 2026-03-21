/**
 * Notification Settings Component
 * User preferences and notification channel management
 */

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Bell, Mail, MessageSquare, Eye } from 'lucide-react';
import { api } from '../../services/api';
import './NotificationSettings.css';

interface NotificationPreferences {
  id: string;
  enablePush: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  enableInApp: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursEnabled: boolean;
  doNotDisturb: boolean;
  unsubscribedTypes: string[];
}

const NOTIFICATION_TYPES = [
  { id: 'INVOICE_ISSUED', label: 'Invoice Issued' },
  { id: 'INVOICE_PAYMENT_REMINDER', label: 'Payment Reminder' },
  { id: 'INVOICE_OVERDUE', label: 'Invoice Overdue' },
  { id: 'INVOICE_PAID', label: 'Payment Received' },
  { id: 'LOCATION_ALERT', label: 'Location Alert' },
  { id: 'GEOFENCE_ENTRY', label: 'Geofence Entry' },
  { id: 'GEOFENCE_EXIT', label: 'Geofence Exit' },
  { id: 'DRIVER_ASSIGNMENT', label: 'Driver Assignment' },
  { id: 'TRIP_STARTED', label: 'Trip Started' },
  { id: 'TRIP_COMPLETED', label: 'Trip Completed' },
  { id: 'DELIVERY_UPDATE', label: 'Delivery Update' },
];

export const NotificationSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [localPrefs, setLocalPrefs] = useState<
    Partial<NotificationPreferences>
  >({});

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: () => api.get('/api/notifications/preferences/current'),
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) =>
      api.put('/api/notifications/preferences/current', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  const handleChannelToggle = async (
    channel: 'push' | 'email' | 'sms' | 'inApp',
    enabled: boolean
  ) => {
    const updates: any = {};

    switch (channel) {
      case 'push':
        updates.enablePush = enabled;
        break;
      case 'email':
        updates.enableEmail = enabled;
        break;
      case 'sms':
        updates.enableSms = enabled;
        break;
      case 'inApp':
        updates.enableInApp = enabled;
        break;
    }

    setLocalPrefs((prev) => ({ ...prev, ...updates }));
    updateMutation.mutate(updates);
  };

  const handleTypeToggle = async (typeId: string) => {
    const isSubscribed = !localPrefs.unsubscribedTypes?.includes(typeId);

    const updates: any = {
      unsubscribedTypes: isSubscribed
        ? [...(localPrefs.unsubscribedTypes || []), typeId]
        : (localPrefs.unsubscribedTypes || []).filter((id) => id !== typeId),
    };

    setLocalPrefs((prev) => ({ ...prev, ...updates }));
    updateMutation.mutate(updates);
  };

  const handleQuietHoursChange = async (start: string, end: string) => {
    const updates = {
      quietHoursStart: start,
      quietHoursEnd: end,
      quietHoursEnabled: true,
    };

    setLocalPrefs((prev) => ({ ...prev, ...updates }));
    updateMutation.mutate(updates);
  };

  const handleDoNotDisturb = async (enabled: boolean) => {
    const updates = { doNotDisturb: enabled };
    setLocalPrefs((prev) => ({ ...prev, ...updates }));
    updateMutation.mutate(updates);
  };

  if (isLoading) {
    return <div className="settings-loading">Loading preferences...</div>;
  }

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <Settings size={24} />
        <h2>Notification Settings</h2>
      </div>

      {/* Notification Channels */}
      <section className="settings-section">
        <h3>Notification Channels</h3>

        <div className="channel-grid">
          <div className="channel-item">
            <div className="channel-header">
              <Bell size={20} />
              <span>Push Notifications</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localPrefs.enablePush ?? true}
                onChange={(e) => handleChannelToggle('push', e.target.checked)}
                disabled={updateMutation.isPending}
              />
              <span className="toggle-slider" />
            </label>
            <p>Receive push notifications on your devices</p>
          </div>

          <div className="channel-item">
            <div className="channel-header">
              <Mail size={20} />
              <span>Email</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localPrefs.enableEmail ?? true}
                onChange={(e) => handleChannelToggle('email', e.target.checked)}
                disabled={updateMutation.isPending}
              />
              <span className="toggle-slider" />
            </label>
            <p>Receive email notifications</p>
          </div>

          <div className="channel-item">
            <div className="channel-header">
              <MessageSquare size={20} />
              <span>SMS</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localPrefs.enableSms ?? false}
                onChange={(e) => handleChannelToggle('sms', e.target.checked)}
                disabled={updateMutation.isPending}
              />
              <span className="toggle-slider" />
            </label>
            <p>Receive SMS notifications</p>
          </div>

          <div className="channel-item">
            <div className="channel-header">
              <Eye size={20} />
              <span>In-App</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={localPrefs.enableInApp ?? true}
                onChange={(e) => handleChannelToggle('inApp', e.target.checked)}
                disabled={updateMutation.isPending}
              />
              <span className="toggle-slider" />
            </label>
            <p>Show in-app notifications</p>
          </div>
        </div>
      </section>

      {/* Do Not Disturb */}
      <section className="settings-section">
        <h3>Do Not Disturb</h3>

        <div className="dnd-item">
          <div className="dnd-header">
            <span>Enable Do Not Disturb Mode</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={localPrefs.doNotDisturb ?? false}
              onChange={(e) => handleDoNotDisturb(e.target.checked)}
              disabled={updateMutation.isPending}
            />
            <span className="toggle-slider" />
          </label>
          <p>Disable all notifications temporarily</p>
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="settings-section">
        <h3>Quiet Hours</h3>

        <div className="quiet-hours">
          <div className="time-inputs">
            <div className="time-group">
              <label htmlFor="start-time">Start Time</label>
              <input
                id="start-time"
                type="time"
                value={localPrefs.quietHoursStart || '22:00'}
                onChange={(e) =>
                  handleQuietHoursChange(
                    e.target.value,
                    localPrefs.quietHoursEnd || '08:00'
                  )
                }
                disabled={updateMutation.isPending}
              />
            </div>

            <div className="time-group">
              <label htmlFor="end-time">End Time</label>
              <input
                id="end-time"
                type="time"
                value={localPrefs.quietHoursEnd || '08:00'}
                onChange={(e) =>
                  handleQuietHoursChange(
                    localPrefs.quietHoursStart || '22:00',
                    e.target.value
                  )
                }
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={localPrefs.quietHoursEnabled ?? false}
              onChange={(e) =>
                handleQuietHoursChange(
                  localPrefs.quietHoursStart || '22:00',
                  localPrefs.quietHoursEnd || '08:00'
                )
              }
              disabled={updateMutation.isPending}
            />
            <span className="toggle-slider" />
            <span>Enable quiet hours</span>
          </label>

          <p>No notifications during these hours</p>
        </div>
      </section>

      {/* Notification Types */}
      <section className="settings-section">
        <h3>Notification Types</h3>
        <p className="section-description">
          Uncheck to stop receiving specific notification types
        </p>

        <div className="notification-types">
          {NOTIFICATION_TYPES.map((type) => (
            <label key={type.id} className="type-checkbox">
              <input
                type="checkbox"
                checked={
                  !localPrefs.unsubscribedTypes?.includes(type.id) ?? true
                }
                onChange={() => handleTypeToggle(type.id)}
                disabled={updateMutation.isPending}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </section>

      {updateMutation.isError && (
        <div className="error-message">
          Failed to update preferences. Please try again.
        </div>
      )}

      {updateMutation.isPending && (
        <div className="saving-indicator">Saving changes...</div>
      )}
    </div>
  );
};

export default NotificationSettings;
