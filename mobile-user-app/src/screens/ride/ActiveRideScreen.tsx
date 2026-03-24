import React, { Fragment, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
  Easing,
  Share,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSPORT_WS =
  process.env.EXPO_PUBLIC_TRANSPORT_WS_URL ||
  'https://transport-service-780842550857.us-central1.run.app';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/MainNavigator';
import { api } from '../../services/api';
import { hapticMedium, hapticHeavy, hapticSuccess, hapticWarning } from '../../utils/haptics';
import { analyticsShareTracking, analyticsRideCompleted, analyticsScreen } from '../../utils/analytics';
import { resolveCallSession, startPSTNCall } from '../../utils/agoraCall';
import type { CallSession } from '../../utils/agoraCall';
import { InCallOverlay } from '../../components/InCallOverlay';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const GOING_RED    = '#ff4c41';

// ── Tipos ──────────────────────────────────────────────────────────────────
type RideStatus = 'searching' | 'driver_assigned' | 'arriving' | 'in_progress' | 'completed';

interface DriverInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehiclePlate: string;
  vehicleModel: string;
  rating: number;
  location?: { latitude: number; longitude: number };
}

const STATUS_CONFIG: Record<RideStatus, { label: string; color: string; icon: string }> = {
  searching:       { label: 'Buscando conductor…',        color: GOING_YELLOW, icon: 'search-outline' },
  driver_assigned: { label: 'Conductor asignado',          color: GOING_BLUE,   icon: 'person-outline' },
  arriving:        { label: 'Tu conductor está en camino', color: '#fb923c',    icon: 'car-sport-outline' },
  in_progress:     { label: 'Viaje en curso',              color: '#4ade80',    icon: 'navigate-outline' },
  completed:       { label: 'Viaje completado',            color: GOING_BLUE,   icon: 'checkmark-circle-outline' },
};

// ── Pasos del viaje ────────────────────────────────────────────────────────
const STEPS = [
  { key: 'searching',       label: 'Buscando conductor' },
  { key: 'driver_assigned', label: 'Conductor asignado' },
  { key: 'arriving',        label: 'En camino a recogerte' },
  { key: 'in_progress',     label: 'Viaje en curso' },
  { key: 'completed',       label: 'Llegaste a tu destino' },
];

export type ActiveRideParams = {
  rideId: string;
  origin: { latitude: number; longitude: number; address: string };
  destination: { latitude: number; longitude: number; address: string };
  vehicleType: string;
  tripMode: string;
  category: string;
  price: number;
};

export function ActiveRideScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<{ params: ActiveRideParams }, 'params'>>();
  const { rideId, origin, destination, vehicleType, tripMode, category, price } = route.params;

  const [status, setStatus] = useState<RideStatus>('searching');
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null); // minutos
  const [etaTotal, setEtaTotal] = useState<number | null>(null); // eta inicial para calcular progreso
  const [elapsedTime, setElapsedTime] = useState(0);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null); // km
  const [callSession, setCallSession]     = useState<CallSession | null>(null);
  const [callLoading, setCallLoading]     = useState(false);
  const cameraRef  = useRef<MapboxGL.Camera>(null);
  const socketRef  = useRef<Socket | null>(null);

  // Animación del pulso para "buscando"
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Animación de la barra de progreso ETA
  const etaProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { analyticsScreen('ActiveRideScreen'); }, []);

  useEffect(() => {
    if (status === 'searching') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status]);

  // ── Fetch inicial de la ruta ─────────────────────────────────────────────
  useEffect(() => {
    fetchRoute();
  }, []);

  // ── WebSocket: tiempo real desde transport-service ───────────────────────
  useEffect(() => {
    let socket: Socket | null = null;

    AsyncStorage.getItem('auth_token').then((token) => {
      socket = io(`${TRANSPORT_WS}/rides`, {
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket?.emit('join:ride', { rideId });
      });

      // Posición del conductor en tiempo real
      socket.on('ride:driver_location', (data: { lat: number; lng: number; heading?: number; etaText?: string }) => {
        setDriverLocation([data.lng, data.lat]);
      });

      // ETA actualizada
      socket.on('ride:eta_update', (data: { etaText: string; etaSeconds?: number }) => {
        if (data.etaSeconds) {
          const mins = Math.round(data.etaSeconds / 60);
          setEta(mins);
          setEtaTotal(prev => prev ?? mins);
        }
      });

      // Conductor aceptó el viaje
      socket.on('ride:driver_accepted', (data: { driver?: { name: string; vehicle: string; plate: string; rating: number; photoUrl?: string }; message?: string }) => {
        hapticMedium();
        setStatus('driver_assigned');
        if (data.driver) {
          setDriver(prev => prev ?? {
            id: '',
            firstName: data.driver!.name?.split(' ')[0] ?? '',
            lastName:  data.driver!.name?.split(' ').slice(1).join(' ') ?? '',
            phone:     '',
            vehiclePlate:  data.driver!.plate,
            vehicleModel:  data.driver!.vehicle,
            rating:        data.driver!.rating ?? 5,
          });
        }
      });

      // Conductor llegó al punto de recogida
      socket.on('ride:driver_arrived', () => {
        hapticMedium();
        setStatus('arriving');
      });

      // Viaje iniciado
      socket.on('ride:started', () => {
        hapticSuccess();
        setStatus('in_progress');
      });

      // Viaje completado
      socket.on('ride:completed', () => {
        hapticSuccess();
        setStatus('completed');
        analyticsRideCompleted({ ride_id: rideId, duration_minutes: elapsedTime, price });
      });
    });

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [rideId]);

  // ── Timer del viaje en curso ──────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'in_progress') return;
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // ── Haptic warning al quedar poco tiempo ────────────────────────────────────
  useEffect(() => {
    if (status === 'in_progress' && etaTotal) {
      const remaining = etaTotal * 60 - elapsedTime;
      if (remaining === 120 || remaining === 60) hapticWarning();
    }
  }, [elapsedTime]);

  // ── Animar barra de progreso ETA ──────────────────────────────────────────
  useEffect(() => {
    if (status !== 'in_progress' || !etaTotal) return;
    const totalSeconds = etaTotal * 60;
    const progress = Math.min(elapsedTime / totalSeconds, 1);
    Animated.timing(etaProgressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [elapsedTime, etaTotal, status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatRemaining = (etaMinutes: number, elapsed: number) => {
    const remaining = Math.max(0, etaMinutes * 60 - elapsed);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return m > 0 ? `${m} min ${s}s restantes` : `${s}s restantes`;
  };

  // ── Obtener polyline de ruta desde Mapbox Directions ────────────────────
  const fetchRoute = async () => {
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
      const originStr      = `${origin.longitude},${origin.latitude}`;
      const destinationStr = `${destination.longitude},${destination.latitude}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originStr};${destinationStr}?geometries=geojson&overview=full&access_token=${token}`;
      const res  = await fetch(url);
      const json = await res.json();
      const route = json.routes?.[0];
      if (!route) return;
      setRouteGeoJSON({
        type: 'Feature',
        properties: {},
        geometry: route.geometry,
      });
      setRouteDistance(Math.round((route.distance / 1000) * 10) / 10); // km con 1 decimal
      // Ajustar cámara para mostrar toda la ruta
      if (cameraRef.current && route.geometry.coordinates.length > 0) {
        const coords: [number, number][] = route.geometry.coordinates;
        const lngs = coords.map(c => c[0]);
        const lats  = coords.map(c => c[1]);
        const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        cameraRef.current.fitBounds(
          [maxLng, maxLat],
          [minLng, minLat],
          [80, 80, 280, 80], // padding top/right/bottom/left (bottom grande por el panel)
          1200,
        );
      }
    } catch {
      // silently fail — mapa sigue funcionando sin polyline
    }
  };

  const handleShareTracking = async () => {
    const trackingUrl = `https://goingapp.ec/track/${rideId}`;
    analyticsShareTracking(rideId);
    try {
      await Share.share({
        title: 'Mi viaje en Going',
        message: `Estoy en camino. Sigue mi ruta en tiempo real: ${trackingUrl}`,
        url: trackingUrl,
      });
    } catch {
      // usuario canceló o error
    }
  };

  // ── Progreso actual ───────────────────────────────────────────────────────
  const currentStepIndex = STEPS.findIndex(s => s.key === status);
  const statusConfig = STATUS_CONFIG[status];

  const handleCallDriver = async () => {
    if (callLoading) return;
    hapticMedium();
    setCallLoading(true);
    try {
      const session = await resolveCallSession(rideId);
      if (!session) {
        Alert.alert('Sin conexión', 'No se pudo establecer la llamada. Intenta de nuevo.');
        return;
      }
      if (session.type === 'agora') {
        setCallSession(session); // abre InCallOverlay
      } else {
        startPSTNCall(session.proxyNumber!);
      }
    } catch {
      if (driver?.phone) Linking.openURL(`tel:${driver.phone}`);
    } finally {
      setCallLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar viaje',
      '¿Estás seguro que deseas cancelar?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/transport/${rideId}/cancel`);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'No se pudo cancelar el viaje');
            }
          },
        },
      ]
    );
  };

  const handleFinish = () => {
    if (driver) {
      navigation.navigate('RateDriver', {
        rideId,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <Fragment>
    <View style={styles.container}>
      {/* ── MAPA ── */}
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={[origin.longitude, origin.latitude]}
          animationMode="flyTo"
        />

        {/* ── Polyline de ruta ── */}
        {routeGeoJSON && (
          <MapboxGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
            {/* Sombra de la ruta */}
            <MapboxGL.LineLayer
              id="routeShadow"
              style={{
                lineColor: 'rgba(0,0,0,0.12)',
                lineWidth: 8,
                lineJoin: 'round',
                lineCap: 'round',
                lineTranslate: [0, 2],
              }}
            />
            {/* Línea principal */}
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: status === 'in_progress' ? GOING_BLUE : '#60A5FA',
                lineWidth: 5,
                lineJoin: 'round',
                lineCap: 'round',
                lineDasharray: status === 'arriving' ? [2, 1.5] : undefined,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Marcador de origen */}
        <MapboxGL.PointAnnotation id="origin" coordinate={[origin.longitude, origin.latitude]}>
          <View style={styles.originMarker}>
            <Ionicons name="location" size={16} color="#fff" />
          </View>
        </MapboxGL.PointAnnotation>

        {/* Marcador de destino */}
        <MapboxGL.PointAnnotation id="destination" coordinate={[destination.longitude, destination.latitude]}>
          <View style={styles.destMarker}>
            <Ionicons name="flag" size={14} color="#fff" />
          </View>
        </MapboxGL.PointAnnotation>

        {/* Marcador del conductor (si existe) */}
        {driverLocation && (
          <MapboxGL.PointAnnotation id="driver" coordinate={driverLocation}>
            <View style={styles.driverMarker}>
              <Ionicons name="car-sport" size={18} color="#fff" />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* ── PANEL INFERIOR ── */}
      <View style={styles.panel}>

        {/* Status bar */}
        <View style={[styles.statusBar, { backgroundColor: statusConfig.color }]}>
          {status === 'searching' ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name={statusConfig.icon as any} size={18} color={status === 'searching' ? GOING_BLUE : '#fff'} />
            </Animated.View>
          ) : (
            <Ionicons name={statusConfig.icon as any} size={18} color="#fff" />
          )}
          <Text style={[styles.statusText, status === 'searching' && { color: GOING_BLUE }]}>
            {statusConfig.label}
          </Text>
          {eta && status !== 'completed' && (
            <Text style={[styles.etaText, status === 'searching' && { color: GOING_BLUE }]}>
              ~{eta} min
            </Text>
          )}
          {status === 'in_progress' && (
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          )}
        </View>

        {/* ── Barra de progreso ETA (solo en viaje activo) ── */}
        {status === 'in_progress' && etaTotal && (
          <View style={styles.etaContainer}>
            <View style={styles.etaLabelRow}>
              <Ionicons name="navigate-circle-outline" size={14} color={GOING_BLUE} />
              <Text style={styles.etaRemainingText}>
                {formatRemaining(etaTotal, elapsedTime)}
              </Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareTracking}>
                <Ionicons name="share-social-outline" size={16} color={GOING_BLUE} />
                <Text style={styles.shareBtnText}>Compartir ruta</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.etaBarBg}>
              <Animated.View
                style={[
                  styles.etaBarFill,
                  {
                    width: etaProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: etaProgressAnim.interpolate({
                      inputRange: [0, 0.6, 0.85, 1],
                      outputRange: [GOING_BLUE, GOING_BLUE, '#fb923c', GOING_RED],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Botón compartir (cuando hay conductor pero no está en progreso) */}
        {status !== 'in_progress' && status !== 'searching' && status !== 'completed' && (
          <TouchableOpacity style={styles.shareBtnStandalone} onPress={handleShareTracking}>
            <Ionicons name="share-social-outline" size={16} color={GOING_BLUE} />
            <Text style={styles.shareBtnStandaloneText}>Compartir mi ubicación en tiempo real</Text>
          </TouchableOpacity>
        )}

        {/* Progress steps */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => {
            const done = i <= currentStepIndex;
            const active = i === currentStepIndex;
            return (
              <View key={step.key} style={styles.stepItem}>
                <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]} />
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, done && styles.stepLineDone]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Info del conductor (cuando está asignado) */}
        {driver && status !== 'searching' && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>
                {driver.firstName[0]}{driver.lastName[0]}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.firstName} {driver.lastName}</Text>
              <Text style={styles.driverVehicle}>
                {driver.vehicleModel} · {driver.vehiclePlate}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={GOING_YELLOW} />
                <Text style={styles.ratingText}>{driver.rating?.toFixed(1) ?? '—'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() =>
                navigation.navigate('RideChat', {
                  rideId,
                  driverName: `${driver.firstName} ${driver.lastName}`,
                  driverVehicle: `${driver.vehicleModel} · ${driver.vehiclePlate}`,
                })
              }
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={GOING_BLUE} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, callLoading && { opacity: 0.5 }]}
              onPress={handleCallDriver}
              disabled={callLoading}
            >
              <Ionicons name={callLoading ? 'hourglass-outline' : 'call'} size={20} color={GOING_BLUE} />
            </TouchableOpacity>
          </View>
        )}

        {/* Detalle de ruta */}
        <View style={styles.routeDetail}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#4ade80' }]} />
            <Text style={styles.routeAddress} numberOfLines={1}>{origin.address}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: GOING_RED }]} />
            <Text style={styles.routeAddress} numberOfLines={1}>{destination.address}</Text>
          </View>
        </View>

        {/* Info del viaje */}
        <View style={styles.tripInfo}>
          {routeDistance && (
            <View style={styles.tripTag}>
              <Ionicons name="map-outline" size={12} color={GOING_BLUE} />
              <Text style={styles.tripTagText}>{routeDistance} km</Text>
            </View>
          )}
          <View style={styles.tripTag}>
            <Ionicons name="car-sport-outline" size={12} color={GOING_BLUE} />
            <Text style={styles.tripTagText}>{vehicleType}</Text>
          </View>
          <View style={styles.tripTag}>
            <Ionicons name={tripMode === 'compartido' ? 'people-outline' : 'person-outline'} size={12} color={GOING_BLUE} />
            <Text style={styles.tripTagText}>{tripMode === 'compartido' ? 'Compartido' : 'Privado'}</Text>
          </View>
          {category === 'premium' && (
            <View style={[styles.tripTag, { backgroundColor: `${GOING_YELLOW}30` }]}>
              <Ionicons name="diamond-outline" size={12} color={GOING_BLUE} />
              <Text style={styles.tripTagText}>Premium</Text>
            </View>
          )}
          <Text style={styles.tripPrice}>${price.toFixed(2)}</Text>
        </View>

        {/* Botones de acción */}
        {status === 'completed' ? (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Calificar conductor</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancelar viaje</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>

    {/* Overlay de llamada Agora (se muestra sobre todo) */}
    {callSession?.type === 'agora' && (
      <InCallOverlay
        session={callSession}
        otherPersonName={driver ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim() || 'Conductor' : 'Conductor'}
        onCallEnd={() => setCallSession(null)}
      />
    )}
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // Marcadores
  originMarker: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#4ade80',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  destMarker: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: GOING_RED,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  driverMarker: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: GOING_BLUE,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: GOING_YELLOW,
  },

  // Panel inferior
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 12,
  },

  // Status bar
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, marginTop: -20, marginBottom: 14,
  },
  statusText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  etaText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  timerText: { fontSize: 14, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },

  // ETA progress bar
  etaContainer: { marginBottom: 12 },
  etaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  etaRemainingText: { flex: 1, fontSize: 12, fontWeight: '700', color: GOING_BLUE },
  etaBarBg: {
    height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden',
  },
  etaBarFill: { height: 8, borderRadius: 4 },

  // Share buttons
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: `${GOING_BLUE}12`,
  },
  shareBtnText: { fontSize: 11, fontWeight: '700', color: GOING_BLUE },
  shareBtnStandalone: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 10,
    backgroundColor: `${GOING_BLUE}10`,
    borderWidth: 1, borderColor: `${GOING_BLUE}25`,
    marginBottom: 12,
  },
  shareBtnStandaloneText: { fontSize: 13, fontWeight: '600', color: GOING_BLUE },

  // Progress steps
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' },
  stepDotDone: { backgroundColor: GOING_BLUE },
  stepDotActive: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: GOING_YELLOW },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 2 },
  stepLineDone: { backgroundColor: GOING_BLUE },

  // Driver card
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: GOING_BLUE,
    justifyContent: 'center', alignItems: 'center',
  },
  driverInitials: { color: '#fff', fontWeight: '800', fontSize: 16 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  driverVehicle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chatBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: `${GOING_YELLOW}30`,
    justifyContent: 'center', alignItems: 'center',
  },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: `${GOING_BLUE}10`,
    justifyContent: 'center', alignItems: 'center',
  },

  // Route detail
  routeDetail: { marginBottom: 12, paddingLeft: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 16, backgroundColor: '#D1D5DB', marginLeft: 4, marginVertical: 2 },
  routeAddress: { fontSize: 13, color: '#374151', flex: 1 },

  // Trip info tags
  tripInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  tripTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tripTagText: { fontSize: 11, fontWeight: '600', color: GOING_BLUE },
  tripPrice: { fontSize: 16, fontWeight: '900', color: GOING_BLUE, marginLeft: 'auto' },

  // Buttons
  cancelBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: GOING_RED, backgroundColor: `${GOING_RED}08`,
  },
  cancelBtnText: { color: GOING_RED, fontSize: 15, fontWeight: '700' },
  finishBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: GOING_BLUE,
  },
  finishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
