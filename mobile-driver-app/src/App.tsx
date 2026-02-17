import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthProvider, useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes } from '@going-monorepo-clean/shared-ui';
import { DashboardScreen } from './screens/DashboardScreen';
import { ActiveTripScreen } from './screens/ActiveTripScreen';
import { DriverChatScreen } from './screens/ChatScreen';

type Screen = 'Dashboard' | 'ActiveTrip' | 'Chat';

const tabs: { key: Screen; icon: string; label: string }[] = [
  { key: 'Dashboard', icon: '🏠', label: 'Inicio' },
  { key: 'ActiveTrip', icon: '🗺️', label: 'Viaje' },
  { key: 'Chat', icon: '💬', label: 'Chat' },
];

const AppDriverContent = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('Dashboard');
  const [screenParams, setScreenParams] = useState<Record<string, any>>({});

  const navigate = (screen: string, params?: any) => {
    setActiveScreen(screen as Screen);
    if (params) setScreenParams((prev) => ({ ...prev, [screen]: params }));
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':
        return <DashboardScreen onNavigate={navigate} />;
      case 'ActiveTrip':
        return <ActiveTripScreen onNavigate={navigate} />;
      case 'Chat':
        return (
          <DriverChatScreen
            tripId={screenParams.Chat?.tripId}
            recipientId={screenParams.Chat?.recipientId}
          />
        );
      default:
        return <DashboardScreen onNavigate={navigate} />;
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveScreen(tab.key)}
          >
            <Text style={[styles.tabIcon, activeScreen === tab.key && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, activeScreen === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const AppDriver = () => (
  <SafeAreaView style={styles.safeArea}>
    <AuthProvider>
      <AppDriverContent />
    </AuthProvider>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  root: { flex: 1 },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingBottom: spacing.xs,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 22, marginBottom: 2 },
  tabIconActive: { transform: [{ scale: 1.15 }] },
  tabLabel: { fontSize: fontSizes.xs, color: colors.gray[400] },
  tabLabelActive: { color: colors.primary, fontWeight: '600' },
});

export default AppDriver;