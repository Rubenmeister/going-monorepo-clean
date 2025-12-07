import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { driverAuthService } from '../features/auth/DriverAuthService';
import { User, Lock, Globe } from 'lucide-react-native';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es'); // Language Toggle

  const t = {
    es: { title: 'Going Driver', subtitle: 'Panel de Conductor', btn: 'Iniciar Turno', placeEmail: 'Correo', placePass: 'Contraseña' },
    en: { title: 'Going Driver', subtitle: 'Driver Dashboard', btn: 'Start Shift', placeEmail: 'Email', placePass: 'Password' }
  };

  const text = t[lang];

  const handleLogin = async () => {
    setLoading(true);
    try {
      await driverAuthService.login({ email, password });
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Error', error.message || error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Language Toggle */}
      <TouchableOpacity style={styles.langButton} onPress={() => setLang(prev => prev === 'es' ? 'en' : 'es')}>
        <Globe color="#CBD5E0" size={20} />
        <Text style={styles.langText}>{lang.toUpperCase()}</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        {/* Brand Logo Placeholder */}
        <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>6</Text> 
        </View>
        <Text style={styles.title}>{text.title}</Text>
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
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{text.btn}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1A202C', // Deep Dark Blue (Brand Professional)
  },
  langButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 20,
  },
  langText: {
    color: '#CBD5E0',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#ff4c41', // Red accent
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 36,
    color: '#ff4c41',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E0',
    marginTop: 5,
  },
  form: {
    backgroundColor: '#2D3748', // Lighter dark for card
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  inputContainer: {
    backgroundColor: '#1A202C', // Very dark inputs
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A5568',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
  },
  button: {
    backgroundColor: '#ff4c41',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
