import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { authService } from '../features/auth/AuthService';

export function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await authService.getCurrentUser();
    setUser(userData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigation.replace('Login');
  };

  if (loading) return <View style={styles.container}><ActivityIndicator color="#ff4c41" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mi Perfil</Text>
        <View style={styles.info}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{user?.name}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 18,
    color: '#333',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
