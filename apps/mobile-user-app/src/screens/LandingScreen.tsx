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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ESM import for images (required for Vite web builds)
import suvBlackRight from '../assets/suv_black_right_v3.png';
import goingLogo from '../assets/logo.png';
import goingLogoWhiteSymbol from '../assets/logo_white_symbol_black_text.png';
import googleIcon from '../assets/google_icon.png';
import facebookIcon from '../assets/facebook_icon.png';
import appleIcon from '../assets/apple_icon.png';
import ecuadorBg from '../assets/ecuador_landscape_bg.png';
import andeanPattern from '../assets/andean_pattern.png';

const { width } = Dimensions.get('window');

// Design tokens matching premium brand guidelines
const COLORS = {
  goingRed: '#FF4E43',
  goingYellow: '#F5A623',
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#F5F5F5',
  inputBorder: '#E5E5E5',
  placeholderText: '#9CA3AF',
  facebookBlue: '#1877F2',
  glassWhite: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

interface LandingScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const [currentScene, setCurrentScene] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Animation values
  const suvPosition = useRef(new Animated.Value(-200)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const formSlideUp = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
  // Ref to prevent React StrictMode double-animation issue
  const hasAnimationStarted = useRef(false);

  useEffect(() => {
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
        Animated.delay(1000), 
      ]).start(() => {
        // Transition to Scene 3 (Login screen)
        setCurrentScene(3);
        // Start entering animation for Login Form
        Animated.parallel([
          Animated.timing(formSlideUp, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(formOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          })
        ]).start();
      });
    });

    return () => {
      suvAnimation.stop();
    };
  }, [logoOpacity, suvPosition, taglineOpacity, formSlideUp, formOpacity]);

  const handleLogin = () => {
    navigation.navigate('Home');
  };

  const handleRegisterUser = () => {
    navigation.navigate('Register', { userType: 'user' });
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  // SCENE 1: SUV crosses between the energy lines
  if (currentScene === 1) {
    return (
      <View style={splashStyles.container}>
        <Image source={{ uri: ecuadorBg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={splashStyles.overlay} />
        
        {/* Superior Energy Line */}
        <View style={[splashStyles.energyLine, splashStyles.redLine]} />
        
        {/* SUV Animation */}
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
        
        {/* Inferior Energy Line */}
        <View style={[splashStyles.energyLine, splashStyles.yellowLine]} />
      </View>
    );
  }

  // SCENE 2: Brand Identity Reveal
  if (currentScene === 2) {
    return (
      <View style={splashStyles.container}>
        <Image source={{ uri: ecuadorBg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={splashStyles.overlay} />
        
        <Animated.View style={[splashStyles.logoRevealContainer, { opacity: logoOpacity }]}>
          <Image source={{ uri: goingLogo }} style={splashStyles.logoImage} resizeMode="contain" />
        </Animated.View>

        <Animated.Text style={[splashStyles.tagline, { opacity: taglineOpacity }]}>
          NOS MOVEMOS CONTIGO
        </Animated.Text>
      </View>
    );
  }

  // SCENE 3: Premium Login Screen
  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: ecuadorBg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.backgroundOverlay} />
      <Image source={{ uri: andeanPattern }} style={styles.backgroundPattern} resizeMode="repeat" />
      
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
          <Animated.View style={[styles.logoContainer, { opacity: formOpacity }]}>
            <Image source={{ uri: goingLogoWhiteSymbol }} style={styles.logoImage} resizeMode="contain" />
          </Animated.View>

          {/* Login Form with Entrance Animation */}
          <Animated.View style={[
            styles.formContainer, 
            { 
              opacity: formOpacity,
              transform: [{ translateY: formSlideUp }]
            }
          ]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Usuario o Correo"
                placeholderTextColor={COLORS.placeholderText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

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

            <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Social Access Section */}
          <Animated.View style={[styles.socialContainer, { opacity: formOpacity }]}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: googleIcon }} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: facebookIcon }} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: appleIcon }} style={styles.socialIconImage} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Registration Prompt */}
          <Animated.View style={[styles.registerContainer, { opacity: formOpacity }]}>
            <Text style={styles.registerPrompt}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={handleRegisterUser}>
              <Text style={styles.registerLink}>Regístrate ahora</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Secondary Legal Links */}
          <Animated.View style={[styles.legalFooter, { opacity: formOpacity }]}>
            <TouchableOpacity onPress={() => Alert.alert('Legales', 'Términos de Uso')}>
              <Text style={styles.legalLinkText}>Términos</Text>
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity onPress={() => Alert.alert('Legales', 'Privacidad')}>
              <Text style={styles.legalLinkText}>Privacidad</Text>
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity onPress={() => Alert.alert('Legales', 'Soporte')}>
              <Text style={styles.legalLinkText}>Ayuda</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Refined Splash screen styling
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  suvContainer: {
    position: 'absolute',
    top: '43%',
    left: 0,
  },
  suvImage: {
    width: 110,
    height: 60,
  },
  energyLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    width: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  redLine: {
    top: '42%',
    backgroundColor: COLORS.goingRed,
    shadowColor: COLORS.goingRed,
  },
  yellowLine: {
    top: '51%',
    backgroundColor: COLORS.goingYellow,
    shadowColor: COLORS.goingYellow,
  },
  logoRevealContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 240,
    height: 180,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: COLORS.white,
    letterSpacing: 5,
    marginTop: 24,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});

// Final Login Screen Aesthetics
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.goingRed,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
    opacity: 0.88,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 200,
    height: 140,
  },
  formContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.glassWhite,
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.goingRed,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.goingRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  socialContainer: {
    width: '100%',
    marginTop: 40,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  socialIconImage: {
    width: 32,
    height: 32,
  },
  registerContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  registerPrompt: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 4,
  },
  registerLink: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  legalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
    width: '100%',
  },
  legalLinkText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
  },
  legalSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
});

export default LandingScreen;

