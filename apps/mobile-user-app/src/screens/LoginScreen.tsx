import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Mail, 
  Lock, 
  ArrowRight,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { authService } from '../features/auth/AuthService';

// ESM import for assets
import andeanPattern from '../assets/andean_pattern.png';
import ecuadorBg from '../assets/ecuador_landscape_bg.png';
import goingLogoWhiteSymbol from '../assets/logo_white_symbol_black_text.png';

// Design tokens matching premium brand guidelines
const COLORS = {
  goingRed: '#FF4E43',
  goingYellow: '#F5A623',
  white: '#FFFFFF',
  black: '#1A1A1A',
  charcoal: '#1A1A1A',
  lightGray: '#F5F5F5',
  inputBorder: '#E5E5E5',
  placeholderText: '#9CA3AF',
  glassWhite: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

export function LoginScreen({ navigation }: { navigation: { replace: (screen: string) => void; navigate: (screen: string, params?: any) => void; } }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({ email: false, password: false });

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Correo inválido';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
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
      await authService.login({ email, password });
      navigation.replace('Home');
    } catch (error: unknown) {
      const errorMessage = (error as any)?.response?.data?.message || 'Credenciales inválidas';
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
            <Image 
              source={goingLogoWhiteSymbol as any}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>TU VIAJE COMIENZA AQUÍ</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconWrapper}>
                <Mail size={18} color={COLORS.black} style={styles.fieldIcon} />
                <TextInput
                  style={[
                    styles.input,
                    errors.email && touched.email && styles.inputError
                  ]}
                  placeholder="Correo electrónico"
                  placeholderTextColor={COLORS.placeholderText}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (touched.email) validate();
                  }}
                  onBlur={() => handleBlur('email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && touched.email && (
                <Text style={styles.errorText}><AlertCircle size={12} color={COLORS.white} /> {errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconWrapper}>
                <Lock size={18} color={COLORS.black} style={styles.fieldIcon} />
                <TextInput
                  style={[
                    styles.input,
                    errors.password && touched.password && styles.inputError
                  ]}
                  placeholder="Contraseña"
                  placeholderTextColor={COLORS.placeholderText}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (touched.password) validate();
                  }}
                  onBlur={() => handleBlur('password')}
                  secureTextEntry
                />
              </View>
              {errors.password && touched.password && (
                <Text style={styles.errorText}><AlertCircle size={12} color={COLORS.white} /> {errors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
                  <ArrowRight size={20} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerPrompt}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}> Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Smartphone size={24} color={COLORS.black} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Mail size={24} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                 <CheckCircle2 size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal Links */}
          <View style={styles.legalFooter}>
            <TouchableOpacity onPress={() => Alert.alert('Condiciones de Viaje')}>
              <Text style={styles.legalLinkText}>Condiciones</Text>
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity onPress={() => Alert.alert('Condiciones de Envíos')}>
              <Text style={styles.legalLinkText}>Privacidad</Text>
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity onPress={() => Alert.alert('Ayuda')}>
              <Text style={styles.legalLinkText}>Ayuda</Text>
            </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 140,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: -10,
    fontStyle: 'italic',
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
  inputIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  fieldIcon: {
    marginRight: 10,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#FACC15',
  },
  errorText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
  forgotText: {
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    alignItems: 'center',
  },
  registerPrompt: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    textDecorationLine: 'underline',
    marginLeft: 6,
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
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
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
  legalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    paddingBottom: 20,
    width: '100%',
  },
  legalLinkText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legalSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
});
