import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { authService } from '../features/auth/AuthService';
import { User, Lock, Globe } from 'lucide-react-native';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es'); // Language Toggle

  const t = {
    es: { title: 'Going', subtitle: 'Tu viaje comienza aquí', btn: 'Iniciar Sesión', placeEmail: 'Correo', placePass: 'Contraseña' },
    en: { title: 'Going', subtitle: 'Your journey starts here', btn: 'Sign In', placeEmail: 'Email', placePass: 'Password' }
  };

  const text = t[lang];

  const handleLogin = async () => {
    setLoading(true);
    try {
      await authService.login({ email, password });
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Language Toggle */}
      <TouchableOpacity style={styles.langButton} onPress={() => setLang(prev => prev === 'es' ? 'en' : 'es')}>
        <Globe color="white" size={20} />
        <Text style={styles.langText}>{lang.toUpperCase()}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        {/* Placeholder for Logo - In real app use <Image /> */}
        <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>6</Text> 
        </View>
        <Text style={styles.brandName}>{text.title}</Text>
        <Text style={styles.subtitle}>{text.subtitle}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
            <User color="#ff4c41" size={20} style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder={text.placeEmail}
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
        </View>

        <View style={styles.inputContainer}>
            <Lock color="#ff4c41" size={20} style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder={text.placePass}
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#ff4c41" /> : <Text style={styles.buttonText}>{text.btn}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#ff4c41', // Brand Red Background
  },
  langButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  langText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 50,
    color: 'white',
    fontWeight: 'bold',
    fontStyle: 'italic', // Trying to mimic the curvy logo
  },
  brandName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30, // Rounded inputs
    paddingHorizontal: 20,
    height: 60,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: 'white', // White button on Red background
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#ff4c41', // Red text
    fontSize: 18,
    fontWeight: 'bold',
  },
});
