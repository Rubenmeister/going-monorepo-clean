import { useCallback } from 'react';
import { Platform, Linking, Share, Alert } from 'react-native';

export interface ShareOptions {
  /** The message to share */
  message: string;
  /** Optional title for the share sheet */
  title?: string;
  /** Optional URL to share (iOS only) */
  url?: string;
  /** Recipient phone number (for SMS/WhatsApp) */
  recipientPhone?: string;
}

export interface UseNativeShareResult {
  /** Share via native share sheet */
  share: (options: ShareOptions) => Promise<boolean>;
  /** Share via SMS */
  shareSMS: (options: ShareOptions) => Promise<boolean>;
  /** Share via WhatsApp */
  shareWhatsApp: (options: ShareOptions) => Promise<boolean>;
  /** Check if WhatsApp is installed */
  isWhatsAppInstalled: () => Promise<boolean>;
}

/**
 * Hook for native sharing functionality.
 * Uses device's native SMS and WhatsApp apps - FREE, no cloud service needed.
 * 
 * Usage:
 * ```tsx
 * function TripScreen({ tripId }) {
 *   const { share, shareSMS, shareWhatsApp } = useNativeShare();
 *   
 *   const handleShare = () => {
 *     share({
 *       message: `Track my trip: https://going.app/trip/${tripId}`,
 *       title: 'Share my trip',
 *     });
 *   };
 * }
 * ```
 */
export function useNativeShare(): UseNativeShareResult {
  /**
   * Share using the native share sheet
   */
  const share = useCallback(async (options: ShareOptions): Promise<boolean> => {
    try {
      const result = await Share.share({
        message: options.message,
        title: options.title,
        url: options.url, // iOS only
      });

      if (result.action === Share.sharedAction) {
        console.log('[Share] Shared successfully');
        return true;
      } else if (result.action === Share.dismissedAction) {
        console.log('[Share] Dismissed');
        return false;
      }

      return false;
    } catch (error) {
      console.error('[Share] Error:', error);
      return false;
    }
  }, []);

  /**
   * Share via SMS - opens native SMS app with pre-filled message
   */
  const shareSMS = useCallback(async (options: ShareOptions): Promise<boolean> => {
    const { message, recipientPhone } = options;
    const encodedMessage = encodeURIComponent(message);

    // iOS and Android have slightly different SMS URL formats
    const url = Platform.select({
      ios: `sms:${recipientPhone || ''}&body=${encodedMessage}`,
      android: `sms:${recipientPhone || ''}?body=${encodedMessage}`,
      default: `sms:${recipientPhone || ''}?body=${encodedMessage}`,
    });

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert(
          'SMS Not Available',
          'Unable to open SMS app on this device.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('[Share] SMS error:', error);
      return false;
    }
  }, []);

  /**
   * Share via WhatsApp - opens WhatsApp with pre-filled message
   */
  const shareWhatsApp = useCallback(async (options: ShareOptions): Promise<boolean> => {
    const { message, recipientPhone } = options;
    const encodedMessage = encodeURIComponent(message);

    // Try WhatsApp deep link first
    let whatsappUrl: string;
    
    if (recipientPhone) {
      // Remove any non-numeric characters from phone number
      const cleanPhone = recipientPhone.replace(/\D/g, '');
      whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
    } else {
      whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      } else {
        // WhatsApp not installed, try web fallback
        const webUrl = recipientPhone
          ? `https://wa.me/${recipientPhone.replace(/\D/g, '')}?text=${encodedMessage}`
          : `https://wa.me/?text=${encodedMessage}`;

        const canOpenWeb = await Linking.canOpenURL(webUrl);
        if (canOpenWeb) {
          await Linking.openURL(webUrl);
          return true;
        }

        Alert.alert(
          'WhatsApp Not Available',
          'WhatsApp is not installed on this device.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('[Share] WhatsApp error:', error);
      return false;
    }
  }, []);

  /**
   * Check if WhatsApp is installed
   */
  const isWhatsAppInstalled = useCallback(async (): Promise<boolean> => {
    try {
      return await Linking.canOpenURL('whatsapp://send');
    } catch {
      return false;
    }
  }, []);

  return {
    share,
    shareSMS,
    shareWhatsApp,
    isWhatsAppInstalled,
  };
}

export default useNativeShare;
