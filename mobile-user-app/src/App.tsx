import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthProvider, useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes, borderRadius } from '@going-monorepo-clean/shared-ui';
import { HomeScreen } from './screens/HomeScreen';
import { TripTrackingScreen } from './screens/TripTrackingScreen';
import { ChatScreen } from './screens/ChatScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

type Screen = 'Home' | 'TripTracking' | 'Chat' | 'Notifications';

const tabs: { key: Screen; icon: string; label: string }[] = [
  { key: 'Home', icon: '🏠', label: 'Inicio' },
  { key: 'TripTracking', icon: '📍', label: 'Viaje' },
  { key: 'Chat', icon: '💬', label: 'Chat' },
  { key: 'Notifications', icon: '🔔', label: 'Alertas' },
];

const AppContent = () => {
  const { auth } = useMonorepoApp();
  const [activeScreen, setActiveScreen] = useState<Screen>('Home');
  const [screenParams, setScreenParams] = useState<Record<string, any>>({});

  const navigate = (screen: string, params?: any) => {
    setActiveScreen(screen as Screen);
    if (params) setScreenParams((prev) => ({ ...prev, [screen]: params }));
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Home':
        return <HomeScreen onNavigate={navigate} />;
      case 'TripTracking':
        return (
          <TripTrackingScreen
            tripId={screenParams.TripTracking?.tripId}
            driverId={screenParams.TripTracking?.driverId}
            onNavigate={navigate}
          />
        );
      case 'Chat':
        return (
          <ChatScreen
            tripId={screenParams.Chat?.tripId}
            recipientId={screenParams.Chat?.recipientId}
            role="user"
          />
        );
      case 'Notifications':
        return <NotificationsScreen />;
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <View style={styles.root}>
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Tab Bar */}
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

const App = () => (
  <SafeAreaView style={styles.safeArea}>
    <AuthProvider>
      <AppContent />
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
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: { fontSize: 22, marginBottom: 2 },
  tabIconActive: { transform: [{ scale: 1.15 }] },
  tabLabel: { fontSize: fontSizes.xs, color: colors.gray[400] },
  tabLabelActive: { color: colors.primary, fontWeight: '600' },
});

export default App;
