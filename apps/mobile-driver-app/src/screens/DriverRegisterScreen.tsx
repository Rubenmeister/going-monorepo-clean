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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const COLORS = {
  goingRed: '#FF4E43',
  charcoal: '#1A1A1A',
  offWhite: '#F5F5F5',
  white: '#FFFFFF',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  errorRing: '#FACC15',
};

export function DriverRegisterScreen({ navigation }: { navigation: { goBack: () => void; navigate: (screen: string) => void; } }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    license: '',
    vehicle: ''
  });

  const handleRegister = () => {
    // Basic verification placeholder
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registro Conductor</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Nombre Completo" 
              placeholderTextColor="#9CA3AF"
              onChangeText={(val) => setFormData({...formData, name: val})}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Teléfono" 
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              onChangeText={(val) => setFormData({...formData, phone: val})}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Licencia de Conducir" 
              placeholderTextColor="#9CA3AF"
              onChangeText={(val) => setFormData({...formData, license: val})}
            />
             <TextInput 
              style={styles.input} 
              placeholder="Información del Vehículo" 
              placeholderTextColor="#9CA3AF"
              onChangeText={(val) => setFormData({...formData, vehicle: val})}
            />
            
            <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
              <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.goingRed },
  keyboardView: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16 
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 24 },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  input: { 
    backgroundColor: COLORS.inputBg, 
    height: 52, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    marginBottom: 16,
    color: COLORS.charcoal 
  },
  submitButton: { 
    backgroundColor: COLORS.charcoal, 
    height: 56, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 20 
  },
  submitButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});
