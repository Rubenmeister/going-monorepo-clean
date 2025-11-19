import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Alert } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const DRIVER_ID = 'b737f525-45c5-41e9-9136-1c2517830d99'; // ID de prueba

const AppDriverContent = () => {
  const { auth, domain } = useMonorepoApp();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0 });

  // 1. Simulación de Envío de Ubicación
  const handleBroadcastLocation = async () => {
    if (!auth.user || !auth.user.isDriver()) {
      Alert.alert("Error", "Debes ser conductor para transmitir tu ubicación.");
      return;
    }
    
    // Simulación de obtención de GPS real (que se haría con Expo/Geolocation API)
    const lat = -0.1807 + Math.random() * 0.01;
    const lng = -78.4678 + Math.random() * 0.01;
    setCurrentLocation({ lat, lng });

    const dto = {
        driverId: DRIVER_ID,
        latitude: lat,
        longitude: lng,
    };
    
    // Llamada al Caso de Uso de Tracking
    const result = await domain.tracking.broadcastDriverLocation.execute(dto);

    if (result.isErr()) {
        Alert.alert("Error Tracking", result.error.message);
    }
  };

  useEffect(() => {
    if (auth.user && auth.user.isDriver()) {
        // Simular un intervalo de envío de GPS
        const interval = setInterval(() => {
            if (isBroadcasting) {
                handleBroadcastLocation();
            }
        }, 5000); // Envía cada 5 segundos
        return () => clearInterval(interval);
    }
  }, [auth.user, isBroadcasting]);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Going App de Conductor</Text>
      
      {auth.user && auth.user.isDriver() ? (
        <View style={styles.statusBox}>
          <Text style={styles.status}>Modo Conductor Activo</Text>
          <Text>Último GPS: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</Text>
          
          <Button 
            title={isBroadcasting ? "Detener GPS" : "Iniciar Tracking"} 
            onPress={() => setIsBroadcasting(!isBroadcasting)} 
            color={isBroadcasting ? 'red' : '#0033A0'}
          />
          
          <Button title="Cerrar Sesión" onPress={auth.logout} color="gray" />
        </View>
      ) : (
        <View>
          <Text style={styles.status}>Inicia sesión como Conductor</Text>
          <Button title="Login Conductor" onPress={() => domain.auth.login({ email: 'driver@test.com', password: 'password123' })} />
        </View>
      )}
    </View>
  );
};

const AppDriver = () => (
  <SafeAreaView style={styles.safeArea}>
    <AuthProvider>
      <AppDriverContent />
    </AuthProvider>
  </SafeAreaView>
);

const styles = StyleSheet.create({
    // ... (Estilos similares al app de usuario)
});
// export default AppDriver; // Asegúrate de exportar el componente raíz