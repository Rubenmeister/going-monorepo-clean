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

// ESM import for images (required for Vite web builds)
import suvBlackRight from '../assets/suv_black_right_v3.png';
import goingLogo from '../assets/logo.png';
import goingLogoWhiteSymbol from '../assets/logo_white_symbol_black_text.png';
import googleIcon from '../assets/google_icon.png';
import facebookIcon from '../assets/facebook_icon.png';
import appleIcon from '../assets/apple_icon.png';

const { width, height } = Dimensions.get('window');

// Design tokens matching reference design
const COLORS = {
  goingRed: '#FF4D4D',
  goingYellow: '#F5A623',
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
  // Scene 1 = SUV animation, Scene 2 = Logo reveal, Scene 3 = Login
  const [currentScene, setCurrentScene] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Animation values
  const suvPosition = useRef(new Animated.Value(-200)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  
  // Ref to prevent React StrictMode double-animation issue
  const hasAnimationStarted = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasAnimationStarted.current) return;
    hasAnimationStarted.current = true;

    // SCENE 1: SUV animation - slides from left to right between the lines
    const suvAnimation = Animated.timing(suvPosition, {
      toValue: width + 200,
      duration: 2500,
      useNativeDriver: true,
    });

    suvAnimation.start(() => {
      // Transition to Scene 2 after SUV exits
      setCurrentScene(2);
      
      // SCENE 2: Logo and tagline fade in
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
        Animated.delay(1200), // Show logo+tagline for 1.2 seconds
      ]).start(() => {
        // Transition to Scene 3 (Login screen)
        setCurrentScene(3);
      });
    });

    // Cleanup function
    return () => {
      suvAnimation.stop();
    };
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

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  // SCENE 1: SUV crosses between the lines
  if (currentScene === 1) {
    return (
      <View style={splashStyles.container}>
        {/* Red Line - Above SUV path */}
        <View style={splashStyles.redLine} />
        
        {/* SUV Animation - between the two lines */}
        <Animated.View 
          style={[
            splashStyles.suvContainer,
            { transform: [{ translateX: suvPosition }] }
          ]}
        >
          <Image
            source={{ uri: suvBlackRight }}
            style={splashStyles.suvImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Yellow Line - Below SUV path */}
        <View style={splashStyles.yellowLine} />
      </View>
    );
  }

  // SCENE 2: Logo reveal with tagline
  if (currentScene === 2) {
    return (
      <View style={splashStyles.container}>
        {/* Logo */}
        <Animated.View style={[splashStyles.logoRevealContainer, { opacity: logoOpacity }]}>
          <Image source={{ uri: goingLogo }} style={splashStyles.logoImage} resizeMode="contain" />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[splashStyles.tagline, { opacity: taglineOpacity }]}>
          NOS MOVEMOS CONTIGO
        </Animated.Text>
      </View>
    );
  }

  // SCENE 3: Login screen

  return (
    <SafeAreaView style={styles.container}>
      {/* Language Selector */}
      <View style={styles.languageSelector}>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>ES</Text>
        </TouchableOpacity>
      </View>

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
            <Image source={{ uri: goingLogoWhiteSymbol }} style={styles.logoImage} resizeMode="contain" />
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
            <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
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
                <Image source={{ uri: googleIcon }} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              {/* Facebook Button */}
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: facebookIcon }} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              {/* Apple Button */}
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: appleIcon }} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Section */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={handleRegisterUser}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
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
    top: '43%',
    left: 0,
  },
  suvImage: {
    width: 100,
    height: 55,
  },
  linesContainer: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
  },
  redLine: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.goingRed,
    width: '100%',
  },
  yellowLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.goingYellow,
    width: '100%',
  },
  logoRevealContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 150,
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
    backgroundColor: COLORS.goingRed,
  },
  keyboardView: {
    flex: 1,
  },
  languageSelector: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  languageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
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
  logoImage: {
    width: 180,
    height: 120,
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
    color: COLORS.white,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  facebookButton: {
    backgroundColor: COLORS.facebookBlue,
  },
  appleButton: {
    backgroundColor: COLORS.black,
  },
  googleIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  facebookIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  socialIcon: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  socialIconImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  appleIcon: {
    fontSize: 22,
    color: COLORS.white,
  },
  registerContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  registerPrompt: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 8,
  },
  registerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLink: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerSeparator: {
    color: COLORS.placeholderText,
    fontSize: 16,
    marginHorizontal: 12,
  },
});

export default LandingScreen;
