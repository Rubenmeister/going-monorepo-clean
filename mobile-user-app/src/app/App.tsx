import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import all screens
import { LandingScreen } from '../screens/LandingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ChatScreen } from '../screens/ChatScreen';

// Simple navigation state management for web (without React Navigation)
type ScreenName = 'Landing' | 'Main' | 'Register' | 'ForgotPassword' | 'Chat';

interface NavigationState {
  currentScreen: ScreenName;
  params?: any;
}

export const App = () => {
  const [navState, setNavState] = useState<NavigationState>({
    currentScreen: 'Landing',
    params: undefined,
  });

  // Simple navigation object
  const navigation = {
    navigate: (screen: ScreenName, params?: any) => {
      console.log('Navigate to:', screen, params);
      setNavState({ currentScreen: screen, params });
    },
    goBack: () => {
      console.log('Go back');
      // Go back to previous screen (smart back)
      if (navState.currentScreen === 'Chat') {
        setNavState({ currentScreen: 'Main', params: undefined });
      } else {
        setNavState({ currentScreen: 'Landing', params: undefined });
      }
    },
  };

  // Render current screen based on navigation state
  const renderScreen = () => {
    switch (navState.currentScreen) {
      case 'Main':
        return <HomeScreen navigation={navigation} />;
      case 'Register':
        return <RegisterScreen navigation={navigation} />;
      case 'ForgotPassword':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'Chat':
        return <ChatScreen navigation={navigation} />;
      case 'Landing':
      default:
        return <LandingScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
