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
  Dimensions
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

const { width, height } = Dimensions.get('window');

// Design tokens
const COLORS = {
  goingRed: '#FF4E43',
  charcoal: '#1A1A1A',
  offWhite: '#F5F5F5',
  white: '#FFFFFF',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  errorRing: '#FACC15',
  glassWhite: 'rgba(255, 255, 255, 0.2)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
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
            <Image 
              source={require('../assets/logo_white_symbol_black_text.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Tu viaje comienza aquí</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconWrapper}>
                <Mail size={18} color={COLORS.charcoal} style={styles.fieldIcon} />
                <TextInput
                  style={[
                    styles.input,
                    errors.email && touched.email && styles.inputError
                  ]}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#9CA3AF"
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
                <Lock size={18} color={COLORS.charcoal} style={styles.fieldIcon} />
                <TextInput
                  style={[
                    styles.input,
                    errors.password && touched.password && styles.inputError
                  ]}
                  placeholder="Contraseña"
                  placeholderTextColor="#9CA3AF"
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
            <TouchableOpacity style={styles.forgotButton}>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
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
                <Smartphone size={24} color={COLORS.charcoal} />
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
              <Text style={styles.legalLinkText}>Condiciones de Viaje</Text>
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity onPress={() => Alert.alert('Condiciones de Envíos')}>
              <Text style={styles.legalLinkText}>Condiciones de Envíos</Text>
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
  logo: {
    width: width * 0.45,
    height: 140,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  fieldIcon: {
    marginRight: 10,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    height: '100%',
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
  legalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
    width: '100%',
  },
  legalLinkText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 12,
  },
});
