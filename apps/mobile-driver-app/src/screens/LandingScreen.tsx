import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Universal Assets
import suvBlackRight from '../assets/suv_black_right_v3.png';
import goingLogo from '../assets/logo.png';
import googleIcon from '../assets/google_icon.png';
import facebookIcon from '../assets/facebook_icon.png';
import appleIcon from '../assets/apple_icon.png';
import ecuadorBg from '../assets/ecuador_landscape_bg.png';
import andeanPattern from '../assets/andean_pattern.png';

const { width, height } = Dimensions.get('window');

// Design tokens from prototype
const COLORS = {
  goingRed: '#FF4D4D',
  goingYellow: '#F5A623',
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#F5F5F5',
  inputBorder: '#E5E5E5',
  placeholderText: '#9CA3AF',
  charcoal: '#1A1A1A',
};

interface LandingScreenProps {
  navigation: any;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const [currentScene, setCurrentScene] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});

  // Animation values
  const suvPosition = useRef(new Animated.Value(-200)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimationStarted = useRef(false);

  useEffect(() => {
    if (hasAnimationStarted.current) return;
    hasAnimationStarted.current = true;

    // SCENE 1: SUV animation
    const suvAnimation = Animated.timing(suvPosition, {
      toValue: width + 200,
      duration: 2500,
      useNativeDriver: true,
    });

    suvAnimation.start(() => {
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
        Animated.delay(1200),
      ]).start(() => {
        setCurrentScene(3);
      });
    });

    return () => suvAnimation.stop();
  }, []);

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    let isValid = true;
    if (!username.trim()) {
      newErrors.username = 'El usuario es requerido';
      isValid = false;
    }
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = () => {
    setTouched({ username: true, password: true });
    if (validate()) {
      navigation.navigate('Home');
    }
  };

  const handleBlur = (field: 'username' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  // SCENE 1: SUV Animation
  if (currentScene === 1) {
    return (
      <View style={splashStyles.container}>
        <Image source={{ uri: ecuadorBg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={splashStyles.overlay} />
        <View style={splashStyles.redLine} />
        <Animated.View style={[splashStyles.suvContainer, { transform: [{ translateX: suvPosition }] }]}>
          <Image source={{ uri: suvBlackRight }} style={splashStyles.suvImage} resizeMode="contain" />
        </Animated.View>
        <View style={splashStyles.yellowLine} />
      </View>
    );
  }

  // SCENE 2: Logo Reveal
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

  // SCENE 3: Driver Login
  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: ecuadorBg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.backgroundOverlay} />
      <Image source={{ uri: andeanPattern }} style={styles.backgroundPattern} resizeMode="repeat" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Driver Badge */}
          <View style={styles.driverBadge}>
            <Text style={styles.driverBadgeText}>MODO CONDUCTOR</Text>
          </View>

          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image source={{ uri: goingLogo }} style={styles.logoImage} resizeMode="contain" />
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.username && touched.username && styles.inputError]}
                placeholder="Usuario o Correo"
                placeholderTextColor={COLORS.placeholderText}
                value={username}
                onChangeText={setUsername}
                onBlur={() => handleBlur('username')}
                autoCapitalize="none"
              />
              {errors.username && touched.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.password && touched.password && styles.inputError]}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.placeholderText}
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur('password')}
                secureTextEntry
              />
              {errors.password && touched.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.loginButtonText}>INICIAR TURNO ➔</Text>
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Conexión Segura</Text>
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
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>¿Nuevo conductor?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverRegister')}>
              <Text style={styles.registerLink}>Únete a la flota aquí</Text>
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
    width: 120,
    height: 70,
  },
  redLine: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.goingRed,
  },
  yellowLine: {
    position: 'absolute',
    top: '51%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.goingYellow,
  },
  logoRevealContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 220,
    height: 160,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.white,
    letterSpacing: 4,
    marginTop: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

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
    opacity: 0.05,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: height - 60,
  },
  driverBadge: {
    alignSelf: 'center',
    backgroundColor: COLORS.goingYellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  driverBadgeText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 180,
    height: 120,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    height: 60,
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.black,
  },
  inputError: {
    borderWidth: 2,
    borderColor: COLORS.goingYellow,
  },
  errorText: {
    color: COLORS.goingYellow,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: COLORS.goingRed,
    height: 65,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.goingRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconImage: {
    width: 35,
    height: 35,
  },
  registerContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  registerPrompt: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
});

export default LandingScreen;
