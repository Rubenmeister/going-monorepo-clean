import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';

interface Props {
  visible: boolean;
  companyName: string;
  bookingId: string;
  /** Called with user's decision. Backend persists consent before trip starts. */
  onDecision: (granted: boolean) => Promise<void>;
}

/**
 * TrackingConsentModal
 *
 * Shown to the employee when they start a corporate trip.
 * Implements the LOPD Ecuador requirement for explicit, informed consent
 * before sharing location with the employer.
 *
 * Key rules:
 * - Must be clearly understandable (plain language)
 * - Must allow "No" without punitive UX
 * - Consent record must be persisted before trip tracking begins
 * - Employee can revoke at any time by ending the trip
 */
export default function TrackingConsentModal({
  visible,
  companyName,
  bookingId,
  onDecision,
}: Props) {
  const [loading, setLoading] = useState(false);

  const decide = async (granted: boolean) => {
    setLoading(true);
    try {
      await onDecision(granted);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>📍</Text>
          </View>
          <Text style={styles.title}>Allow location sharing?</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.bold}>{companyName}</Text> would like to see
            your location during this trip.
          </Text>

          {/* Detail list */}
          <ScrollView
            style={styles.detailBox}
            showsVerticalScrollIndicator={false}
          >
            {[
              {
                icon: '🕐',
                text: 'Only during this confirmed trip — not at any other time.',
              },
              {
                icon: '🔒',
                text: 'Your location is never stored after the trip ends.',
              },
              {
                icon: '👔',
                text: 'Only your manager and security team can view it.',
              },
              {
                icon: '🚫',
                text: 'Declining will not affect your booking or employment.',
              },
              {
                icon: '↩️',
                text: 'You can revoke consent at any time by ending the trip.',
              },
            ].map(({ icon, text }, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailIcon}>{icon}</Text>
                <Text style={styles.detailText}>{text}</Text>
              </View>
            ))}
          </ScrollView>

          {/* LOPD notice */}
          <View style={styles.legalBadge}>
            <Text style={styles.legalText}>
              Governed by LOPD Ecuador · Booking {bookingId.slice(-8)}
            </Text>
          </View>

          {/* Buttons */}
          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              color="#2563eb"
              size="large"
            />
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnDecline]}
                onPress={() => decide(false)}
                accessibilityLabel="Decline location sharing"
              >
                <Text style={styles.btnDeclineText}>No, decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnAccept]}
                onPress={() => decide(true)}
                accessibilityLabel="Allow location sharing"
              >
                <Text style={styles.btnAcceptText}>Yes, allow</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 30 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  bold: { fontWeight: '600', color: '#374151' },
  detailBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    maxHeight: 200,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  detailText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  legalBadge: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginBottom: 20,
  },
  legalText: { fontSize: 11, color: '#9ca3af' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDecline: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  btnDeclineText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  btnAccept: { backgroundColor: '#2563eb' },
  btnAcceptText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  loader: { marginVertical: 24 },
});
