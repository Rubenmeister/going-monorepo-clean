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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { driverAuthService } from '../features/auth/DriverAuthService';

const { height } = Dimensions.get('window');

// Design tokens
const COLORS = {
  goingRed: '#FF4E43',
  charcoal: '#1A1A1A',
  offWhite: '#F5F5F5',
  white: '#FFFFFF',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  errorRing: '#FACC15',
};

export function LoginScreen({ navigation }: any) {
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
    } catch (error: any) {
      Alert.alert('Error', error.message || error.response?.data?.message || 'Credenciales inválidas');
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
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoSymbol}>G</Text>
            </View>
            <Text style={styles.logoText}>{text.title}</Text>
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
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
              activeOpacity={0.8}
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
              <Text style={styles.dividerText}>{lang === 'es' ? 'O continúa con' : 'Or continue with'}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}></Text>
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
  langButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  langText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  driverBadge: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: COLORS.charcoal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  driverBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: height - 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoSymbol: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.goingRed,
    fontStyle: 'italic',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.charcoal,
  },
  inputError: {
    borderWidth: 2,
    borderColor: COLORS.errorRing,
    backgroundColor: COLORS.white,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: COLORS.charcoal,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  registerPrompt: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  socialContainer: {
    width: '100%',
    marginTop: 40,
    gap: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.charcoal,
  },
});

export default LoginScreen;
