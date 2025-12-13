import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Design tokens matching reference design
const COLORS = {
  goingRed: '#FF4D4D',
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#F5F5F5',
  inputBorder: '#E5E5E5',
  placeholderText: '#9CA3AF',
  facebookBlue: '#1877F2',
  googleRed: '#EA4335',
  googleBlue: '#4285F4',
  googleYellow: '#FBBC05',
  googleGreen: '#34A853',
};

interface LandingScreenProps {
  navigation: any;
}

// Going Logo Component - Red symbol matching reference
const GoingLogoSymbol = () => (
  <View style={logoStyles.container}>
    <View style={logoStyles.gShape}>
      <View style={logoStyles.gCurve} />
      <View style={logoStyles.gTail} />
      <View style={logoStyles.gDot} />
    </View>
  </View>
);

const logoStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gShape: {
    width: 70,
    height: 80,
    position: 'relative',
  },
  gCurve: {
    width: 55,
    height: 55,
    borderRadius: 28,
    borderWidth: 10,
    borderColor: COLORS.goingRed,
    borderRightColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  gTail: {
    position: 'absolute',
    bottom: 8,
    right: -5,
    width: 30,
    height: 10,
    backgroundColor: COLORS.goingRed,
    borderRadius: 5,
    transform: [{ rotate: '-25deg' }],
  },
  gDot: {
    position: 'absolute',
    top: -5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.goingRed,
  },
});

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Animation values
  const suvPosition = useRef(new Animated.Value(-200)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: SUV animation - slides from left to right
    Animated.timing(suvPosition, {
      toValue: width + 200,
      duration: 2500,
      useNativeDriver: true,
    }).start(() => {
      // Phase 2: Logo fade in after SUV exits
      Animated.sequence([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSplash(false);
      });
    });
  }, []);

  const handleLogin = () => {
    navigation.navigate('Main');
  };

  const handleRegisterUser = () => {
    navigation.navigate('Register', { userType: 'user' });
  };

  const handleRegisterDriver = () => {
    navigation.navigate('Register', { userType: 'driver' });
  };

  // Splash Screen with SUV Animation
  if (showSplash) {
    return (
      <View style={splashStyles.container}>
        {/* SUV Animation */}
        <Animated.View 
          style={[
            splashStyles.suvContainer,
            { transform: [{ translateX: suvPosition }] }
          ]}
        >
          <Image
            source={require('../../assets/suv_black_right.png')}
            style={splashStyles.suvImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Logo Reveal */}
        <Animated.View style={[splashStyles.logoRevealContainer, { opacity: logoOpacity }]}>
          <GoingLogoSymbol />
          <Text style={splashStyles.logoText}>Going</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[splashStyles.tagline, { opacity: taglineOpacity }]}>
          NOS MOVEMOS CONTIGO
        </Animated.Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <GoingLogoSymbol />
            <Text style={styles.logoText}>Going</Text>
            <Text style={styles.tagline}>NOS MOVEMOS CONTIGO</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Usuario"
                placeholderTextColor={COLORS.placeholderText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              {/* Google Button */}
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.googleIcon}>G</Text>
              </TouchableOpacity>
              {/* Facebook Button */}
              <TouchableOpacity style={styles.socialButton}>
                <Text style={[styles.socialIcon, { color: COLORS.facebookBlue }]}>f</Text>
              </TouchableOpacity>
              {/* Apple Button */}
              <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
                <Text style={styles.appleIcon}></Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Section */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>¿No tienes una cuenta?</Text>
            <View style={styles.registerLinks}>
              <TouchableOpacity onPress={handleRegisterUser}>
                <Text style={styles.registerLink}>Usuario</Text>
              </TouchableOpacity>
              <Text style={styles.registerSeparator}>|</Text>
              <TouchableOpacity onPress={handleRegisterDriver}>
                <Text style={styles.registerLink}>Conductor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Splash screen styles
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suvContainer: {
    position: 'absolute',
    top: '45%',
    left: 0,
  },
  suvImage: {
    width: 180,
    height: 100,
  },
  logoRevealContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    fontStyle: 'italic',
    color: COLORS.black,
    letterSpacing: 4,
    marginTop: 24,
  },
});

// Main landing screen styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    minHeight: height - 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.black,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
    color: COLORS.black,
    letterSpacing: 4,
    marginTop: 16,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.black,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  socialContainer: {
    width: '100%',
    marginTop: 32,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.inputBorder,
  },
  dividerText: {
    color: COLORS.placeholderText,
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  appleButton: {
    backgroundColor: COLORS.black,
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.googleBlue,
  },
  socialIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  appleIcon: {
    fontSize: 26,
    color: COLORS.white,
  },
  registerContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  registerPrompt: {
    color: COLORS.placeholderText,
    fontSize: 14,
    marginBottom: 8,
  },
  registerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLink: {
    color: COLORS.goingRed,
    fontSize: 16,
    fontWeight: '600',
  },
  registerSeparator: {
    color: COLORS.placeholderText,
    fontSize: 16,
    marginHorizontal: 12,
  },
});

export default LandingScreen;
