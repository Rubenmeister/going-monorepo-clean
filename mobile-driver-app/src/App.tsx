import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const DRIVER_ID = 'b737f525-45c5-41e9-9136-1c2517830d99'; // ID de prueba

const AppDriverContent = () => {
  const { auth, domain } = useMonorepoApp();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0 });
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Solicitar permisos y empezar/detener el tracking real
  useEffect(() => {
    if (!auth.user || !auth.user.isDriver()) return;

    if (isBroadcasting) {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación para el tracking.');
          setIsBroadcasting(false);
          return;
        }

        locationSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          async (loc) => {
            const lat = loc.coords.latitude;
            const lng = loc.coords.longitude;
            setCurrentLocation({ lat, lng });

            const dto = { driverId: DRIVER_ID, latitude: lat, longitude: lng };
            const result = await domain.tracking.broadcastDriverLocation.execute(dto);
            if (result.isErr()) {
              console.warn('Tracking error:', result.error.message);
            }
          }
        );
      })();
    } else {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    }

    return () => {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
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