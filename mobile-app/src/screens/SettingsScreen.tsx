/**
 * Settings Screen
 * App settings, preferences, and configuration
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import {
  Bell,
  Lock,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  ChevronRight,
  Moon,
  Smartphone,
} from 'react-native-feather';

interface SettingsItem {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: () => void;
  hasSwitch?: boolean;
  switchValue?: boolean;
}

export const SettingsScreen: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    darkMode: false,
    locationAccess: true,
    biometricAuth: true,
    shareAnalytics: false,
    offlineMode: false,
  });

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingItem: React.FC<SettingsItem> = ({
    icon,
    title,
    subtitle,
    action,
    hasSwitch,
    switchValue,
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={!hasSwitch ? action : undefined}
      activeOpacity={hasSwitch ? 1 : 0.6}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>{icon}</View>
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {hasSwitch ? (
        <Switch value={switchValue || false} disabled />
      ) : (
        <ChevronRight width={20} height={20} color="#999" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon={<Bell width={20} height={20} color="#007AFF" />}
            title="Push Notifications"
            subtitle="Ride updates and messages"
            hasSwitch
            switchValue={settings.pushNotifications}
            action={() => handleSettingChange('pushNotifications')}
          />
          <SettingItem
            icon={<Smartphone width={20} height={20} color="#4ECDC4" />}
            title="SMS Alerts"
            subtitle="Important notifications via SMS"
            hasSwitch
            switchValue={true}
          />
        </View>

        {/* Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display & Sound</Text>
          <SettingItem
            icon={<Moon width={20} height={20} color="#7B68EE" />}
            title="Dark Mode"
            subtitle="Coming soon"
            hasSwitch
            switchValue={settings.darkMode}
            action={() => handleSettingChange('darkMode')}
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <SettingItem
            icon={<Shield width={20} height={20} color="#FF6B6B" />}
            title="Location Access"
            subtitle="Allow app to access location"
            hasSwitch
            switchValue={settings.locationAccess}
            action={() => handleSettingChange('locationAccess')}
          />
          <SettingItem
            icon={<Lock width={20} height={20} color="#FF9800" />}
            title="Biometric Authentication"
            subtitle="Use fingerprint or face ID"
            hasSwitch
            switchValue={settings.biometricAuth}
            action={() => handleSettingChange('biometricAuth')}
          />
          <SettingItem
            icon={<Globe width={20} height={20} color="#45B7D1" />}
            title="Share Analytics"
            subtitle="Help improve the app"
            hasSwitch
            switchValue={settings.shareAnalytics}
            action={() => handleSettingChange('shareAnalytics')}
          />
          <SettingItem
            icon={<Smartphone width={20} height={20} color="#666" />}
            title="Offline Mode"
            subtitle="Save data and battery"
            hasSwitch
            switchValue={settings.offlineMode}
            action={() => handleSettingChange('offlineMode')}
          />
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <SettingItem
            icon={<HelpCircle width={20} height={20} color="#4CAF50" />}
            title="FAQ & Help"
            subtitle="Get answers to common questions"
            action={() => Alert.alert('FAQ', 'Opening FAQ page...')}
          />
          <SettingItem
            icon={<Smartphone width={20} height={20} color="#2196F3" />}
            title="Contact Support"
            subtitle="Get in touch with our team"
            action={() => Alert.alert('Support', 'Opening support chat...')}
          />
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <SettingItem
            icon={<FileText width={20} height={20} color="#673AB7" />}
            title="Terms of Service"
            action={() => Alert.alert('Terms', 'Opening terms...')}
          />
          <SettingItem
            icon={<Shield width={20} height={20} color="#009688" />}
            title="Privacy Policy"
            action={() => Alert.alert('Privacy', 'Opening privacy policy...')}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Going</Text>
          <Text style={styles.appVersion}>Version 1.0.0 (Build 1)</Text>
          <Text style={styles.lastUpdated}>Last updated: Feb 22, 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 8,
  },
});
