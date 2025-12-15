import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { driverAuthService } from '../features/auth/DriverAuthService';

export function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await driverAuthService.getCurrentUser();
    setUser(userData);
    setLoading(false);
  };

  const handleLogout = async () => {
    await driverAuthService.logout();
    navigation.replace('Login');
  };

  if (loading) return <View style={styles.container}><ActivityIndicator color="#ff4c41" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Perfil de Conductor</Text>
        <View style={styles.info}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{user?.name}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.info}>
           <Text style={styles.label}>ID de Socio:</Text>
           <Text style={styles.value}>{user?.id?.substring(0,8)}...</Text>
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
    backgroundColor: '#2D3748',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2D3748'
  },
  info: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#718096',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 18,
    color: '#2D3748',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#E53E3E',
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
