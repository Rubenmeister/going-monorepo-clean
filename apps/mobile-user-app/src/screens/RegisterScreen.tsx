import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

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

interface FormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterScreen({ navigation }: { navigation: { goBack: () => void; navigate: (screen: string) => void; } }) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
      isValid = false;
    } else if (!/^\d{9,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Teléfono inválido';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Correo inválido';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);
    
    if (validate()) {
      // Navigate to login or verification
      navigation.navigate('Login');
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validate();
  };

  const renderInput = (
    field: keyof FormData, 
    placeholder: string, 
    options: { secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' } = {}
  ) => (
    <View style={styles.inputWrapper}>
      <TextInput
        style={[
          styles.input,
          errors[field] && touched[field] && styles.inputError
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholderText}
        value={formData[field]}
        onChangeText={(text) => handleChange(field, text)}
        onBlur={() => handleBlur(field)}
        autoCapitalize={field === 'name' ? 'words' : 'none'}
        {...options}
      />
      {errors[field] && touched[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Image source={ecuadorBg as any} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.backgroundOverlay} />
      <Image source={andeanPattern as any} style={styles.backgroundPattern} resizeMode="repeat" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={COLORS.white} size={24} />
          </TouchableOpacity>
          <Image source={goingLogoWhiteSymbol as any} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>CREAR CUENTA</Text>
            <Text style={styles.subtitle}>Únete a la movilidad del futuro</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {renderInput('name', 'Nombre completo')}
            {renderInput('phone', 'Teléfono móvil', { keyboardType: 'phone-pad' })}
            {renderInput('email', 'Correo electrónico', { keyboardType: 'email-address' })}
            {renderInput('password', 'Contraseña', { secureTextEntry: true })}
            {renderInput('confirmPassword', 'Confirmar contraseña', { secureTextEntry: true })}

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>CREAR CUENTA</Text>
            </TouchableOpacity>
          </View>

          {/* Social Register */}
          <View style={styles.socialContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O regístrate con</Text>
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

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Al registrarte, aceptas nuestros{' '}
              <Text style={styles.termsLink}>Términos de Servicio</Text>
              {' '}y{' '}
              <Text style={styles.termsLink}>Política de Privacidad</Text>.
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: COLORS.glassWhite,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
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
  submitButton: {
    backgroundColor: COLORS.goingRed,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: COLORS.goingRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  socialContainer: {
    marginTop: 32,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: 'bold',
    marginHorizontal: 16,
    textTransform: 'uppercase',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.black,
  },
  termsContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  termsLink: {
    color: COLORS.white,
    textDecorationLine: 'underline',
    fontWeight: '800',
  },
});

export default RegisterScreen;
