import React from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers'; // Usamos el hook central

// 1. Componente de Prueba de Conexión
const AppContent = () => {
  const { auth, domain } = useMonorepoApp();

  // Simulación de solicitud de viaje (el corazón del app de usuario)
  const handleRequestTrip = () => {
    if (auth.user) {
      domain.transport.requestTrip({
        userId: auth.user.id,
        origin: { address: 'Inicio Móvil', city: 'Quito', country: 'EC', latitude: -0.2, longitude: -78.5 },
        destination: { address: 'Destino Móvil', city: 'Quito', country: 'EC', latitude: -0.3, longitude: -78.6 },
        price: { amount: 850, currency: 'USD' } // $8.50
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Going App de Usuario</Text>
      
      {auth.isLoading && <Text>Cargando sesión...</Text>}
      {auth.error && <Text style={{ color: 'red' }}>Error: {auth.error}</Text>}

      {auth.user ? (
        <View>
          <Text style={styles.status}>¡Bienvenido, {auth.user.firstName}!</Text>
          <Text>Rol: {auth.user.roles.join(', ')}</Text>

          <Button title="Solicitar Viaje" onPress={handleRequestTrip} />
          <Button title="Cerrar Sesión" onPress={auth.logout} color="gray" />
        </View>
      ) : (
        <View>
          <Text style={styles.status}>Desconectado</Text>
          <Button title="Login Test" onPress={() => domain.auth.login({ email: 'user@test.com', password: 'password123' })} />
        </View>
      )}
    </View>
  );
};

// 2. Componente de Exportación (Envuelve con AuthProvider)
const App = () => (
  <SafeAreaView style={styles.safeArea}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0033A0',
  },
  status: {
    fontSize: 18,
    marginBottom: 10,
  }
});

// Nota: Necesitas crear un componente Button básico para React Native o usar uno de una librería (ej. react-native-elements)
const Button = ({ title, onPress, color = '#FFCD00' }) => (
    <View style={{ marginVertical: 8, width: 200 }}>
        <ButtonRNE title={title} onPress={onPress} color={color} />
    </View>
);
// Asumimos que ButtonRNE es un componente de alguna librería de UI como 'react-native-elements'
// Para simplificar, podrías usar el componente 'Button' nativo de React Native.