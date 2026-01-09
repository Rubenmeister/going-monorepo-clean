import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { driverAuthService } from '../features/auth/DriverAuthService';

// ESM import for assets
import andeanPattern from '../assets/andean_pattern.png';
import ecuadorBg from '../assets/ecuador_landscape_bg.png';
import goingLogo from '../assets/logo.png';

// Design tokens - Driver Dark Mode Premium
const COLORS = {
  goingRed: '#FF4E43',
  goingYellow: '#F5A623',
  charcoal: '#1A1A1A',
  dark: '#0D0D0D',
  white: '#FFFFFF',
  glassWhite: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  placeholderText: '#9CA3AF',
};

export function LoginScreen({ navigation }: { navigation: { replace: (screen: string) => void; navigate: (screen: string) => void; } }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [lang, setLang] = useState<'es' | 'en'>('es');

  const t = {
    es: { 
      title: 'Going Driver', 
      subtitle: 'Panel de Conductor', 
      btn: 'Iniciar Turno',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgot: '¿Olvidaste tu contraseña?',
      register: '¿Quieres ser conductor?',
      registerLink: 'Regístrate aquí'
    },
    en: { 
      title: 'Going Driver', 
      subtitle: 'Driver Dashboard', 
      btn: 'Start Shift',
      email: 'Email',
      password: 'Password',
      forgot: 'Forgot password?',
      register: 'Want to become a driver?',
      registerLink: 'Register here'
    }
  };

  const text = t[lang];

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = lang === 'es' ? 'El correo es requerido' : 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = lang === 'es' ? 'Correo inválido' : 'Invalid email';
      isValid = false;
    }

    if (!password) {
      newErrors.password = lang === 'es' ? 'La contraseña es requerida' : 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = lang === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    
    if (!validate()) return;

    setLoading(true);
    try {
      await driverAuthService.login({ email, password });
      navigation.replace('Home');
    } catch (error: unknown) {
      const errorMessage = (error as any)?.message || (error as any)?.response?.data?.message || 'Credenciales inválidas';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={ecuadorBg as any} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.backgroundOverlay} />
      <Image source={andeanPattern as any} style={styles.backgroundPattern} resizeMode="repeat" />

      {/* Language Toggle */}
      <TouchableOpacity 
        style={styles.langButton} 
        onPress={() => setLang(prev => prev === 'es' ? 'en' : 'es')}
      >
        <Text style={styles.langText}>{lang.toUpperCase()}</Text>
      </TouchableOpacity>

      {/* Driver Badge */}
      <View style={styles.driverBadge}>
        <Text style={styles.driverBadgeText}>CONDUCTOR</Text>
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={goingLogo as any} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.subtitle}>{text.subtitle}</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  errors.email && touched.email && styles.inputError
                ]}
                placeholder={text.email}
                placeholderTextColor={COLORS.placeholderText}
                value={email}
                onChangeText={(txt) => {
                  setEmail(txt);
                  if (touched.email) validate();
                }}
                onBlur={() => handleBlur('email')}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email && touched.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  errors.password && touched.password && styles.inputError
                ]}
                placeholder={text.password}
                placeholderTextColor={COLORS.placeholderText}
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  if (touched.password) validate();
                }}
                onBlur={() => handleBlur('password')}
                secureTextEntry
              />
              {errors.password && touched.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>{text.forgot}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>{text.btn}</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerPrompt}>{text.register}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DriverRegister')}>
                <Text style={styles.registerLink}> {text.registerLink}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{lang === 'es' ? 'CONEXIÓN SEGURA' : 'SECURE LOGIN'}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={[styles.socialIcon, { color: '#1877F2' }]}>F</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>A</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.goingRed,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.dark,
    opacity: 0.9,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  langButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: COLORS.glassWhite,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  langText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  driverBadge: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: COLORS.goingYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  driverBadgeText: {
    color: COLORS.dark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 180,
    height: 120,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: -5,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.glassWhite,
    padding: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  input: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  inputError: {
    borderWidth: 2,
    borderColor: COLORS.goingYellow,
  },
  errorText: {
    color: COLORS.goingYellow,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    color: 'rgba(255,255,255,0.6)',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  registerPrompt: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  socialContainer: {
    width: '100%',
    marginTop: 48,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  socialIcon: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.dark,
  },
});

export default LoginScreen;
