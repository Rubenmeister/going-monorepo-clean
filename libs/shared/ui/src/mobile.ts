// Mobile-only exports for Shared UI
// These depend on react-native and native-only libraries

// Push Notifications
export { usePushNotifications } from './lib/hooks/usePushNotifications';
export type { UsePushNotificationsResult, PushNotificationPayload } from './lib/hooks/usePushNotifications';

// Phone Authentication (Firebase)
export { usePhoneAuth } from './lib/hooks/usePhoneAuth';
export type { UsePhoneAuthResult } from './lib/hooks/usePhoneAuth';

// Native Sharing
export { useNativeShare } from './lib/hooks/useNativeShare';
export type { UseNativeShareResult, ShareOptions } from './lib/hooks/useNativeShare';

// Share Trip Button
export { ShareTripButton } from './lib/ShareTripButton';
export type { ShareTripButtonProps } from './lib/ShareTripButton';
