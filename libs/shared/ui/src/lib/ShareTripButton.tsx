import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Modal,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useNativeShare } from './hooks/useNativeShare';

export interface ShareTripButtonProps {
  /** The trip ID to share */
  tripId: string;
  /** Optional custom trip link (defaults to going.app/trip/{tripId}) */
  tripLink?: string;
  /** Optional recipient phone number */
  recipientPhone?: string;
  /** Button variant: single action or dropdown */
  variant?: 'single' | 'dropdown';
  /** Which share method for 'single' variant */
  singleAction?: 'share' | 'sms' | 'whatsapp';
  /** Custom button style */
  style?: StyleProp<ViewStyle>;
  /** Custom button text */
  buttonText?: string;
  /** Show compact version */
  compact?: boolean;
}

/**
 * Share Trip Button Component
 * 
 * Allows users to share their trip via native share sheet, SMS, or WhatsApp.
 * Uses device's native apps - completely FREE, no cloud service needed!
 * 
 * Usage:
 * ```tsx
 * // Dropdown with all options
 * <ShareTripButton tripId="abc123" />
 * 
 * // Single action - just SMS
 * <ShareTripButton tripId="abc123" variant="single" singleAction="sms" />
 * 
 * // With recipient phone
 * <ShareTripButton tripId="abc123" recipientPhone="+593999123456" />
 * ```
 */
export function ShareTripButton({
  tripId,
  tripLink,
  recipientPhone,
  variant = 'dropdown',
  singleAction = 'share',
  style,
  buttonText,
  compact = false,
}: ShareTripButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const { share, shareSMS, shareWhatsApp } = useNativeShare();

  const link = tripLink || `https://going.app/trip/${tripId}`;
  const message = `🚗 Sigue mi viaje en GOING!\n\nRastrea en tiempo real aquí:\n${link}`;

  const handleShare = async () => {
    await share({ message, title: 'Compartir mi viaje' });
  };

  const handleSMS = async () => {
    await shareSMS({ message, recipientPhone });
    setShowOptions(false);
  };

  const handleWhatsApp = async () => {
    await shareWhatsApp({ message, recipientPhone });
    setShowOptions(false);
  };

  const handlePress = () => {
    if (variant === 'single') {
      switch (singleAction) {
        case 'sms':
          handleSMS();
          break;
        case 'whatsapp':
          handleWhatsApp();
          break;
        default:
          handleShare();
      }
    } else {
      setShowOptions(true);
    }
  };

  const getButtonIcon = () => {
    if (variant === 'single') {
      switch (singleAction) {
        case 'sms':
          return '📱';
        case 'whatsapp':
          return '💬';
        default:
          return '📤';
      }
    }
    return '📤';
  };

  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (compact) return getButtonIcon();
    
    if (variant === 'single') {
      switch (singleAction) {
        case 'sms':
          return '📱 SMS';
        case 'whatsapp':
          return '💬 WhatsApp';
        default:
          return '📤 Compartir';
      }
    }
    return '📤 Compartir Viaje';
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, compact && styles.buttonCompact, style]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Compartir Viaje</Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleShare}
            >
              <Text style={styles.optionIcon}>📤</Text>
              <Text style={styles.optionText}>Compartir...</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleSMS}
            >
              <Text style={styles.optionIcon}>📱</Text>
              <Text style={styles.optionText}>Enviar por SMS</Text>
              <Text style={styles.freeLabel}>GRATIS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleWhatsApp}
            >
              <Text style={styles.optionIcon}>💬</Text>
              <Text style={styles.optionText}>Enviar por WhatsApp</Text>
              <Text style={styles.freeLabel}>GRATIS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextCompact: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  freeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ShareTripButton;
