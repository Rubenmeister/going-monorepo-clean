import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
  Image,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { authService } from '@services/authService';

const TRANSPORT_WS =
  process.env.EXPO_PUBLIC_TRANSPORT_WS_URL ||
  'https://transport-service-780842550857.us-central1.run.app';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/MainNavigator';
import { transportAPI } from '../../services/api';
import { hapticMedium, hapticHeavy, hapticSuccess, hapticWarning } from '../../utils/haptics';
import { analyticsShareTracking, analyticsRideCompleted, analyticsScreen } from '../../utils/analytics';
import { resolveCallSession, startPSTNCall } from '../../utils/agoraCall';
import type { CallSession } from '../../utils/agoraCall';
import { InCallOverlay } from '../../components/InCallOverlay';
import { useTheme, type ThemeTokens } from '../../theme';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

// ── Tipos ──────────────────────────────────────────────────────────────────
type RideStatus = 'searching' | 'driver_assigned' | 'arriving' | 'arrived' | 'in_progress' | 'completed';

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

/**
 * STATUS_CONFIG por tokens — el bg de la status bar y el color del icono /
 * texto se derivan del theme. Usamos:
 *  - searching → brandYellow + textOnYellow (CTA-like, demanda atención sin alarmar)
 *  - driver_assigned / completed → brandNavy + textOnNavy (estado neutral confirmado)
 *  - arriving → semantic warning (algo en curso, prestar atención)
 *  - arrived → semantic success
 *  - in_progress → semantic success (viaje sano)
 */
function makeStatusConfig(t: ThemeTokens): Record<
  RideStatus,
  { label: string; bg: string; fg: string; icon: string }
> {
  return {
    searching:       { label: 'Buscando conductor…',        bg: t.brandYellow, fg: t.textOnYellow, icon: 'search-outline' },
    driver_assigned: { label: 'Conductor asignado',          bg: t.brandNavy,   fg: t.textOnNavy,   icon: 'person-outline' },
    arriving:        { label: 'Tu conductor está en camino', bg: t.warning,     fg: '#ffffff',      icon: 'car-sport-outline' },
    arrived:         { label: '¡Tu conductor llegó! 👋',     bg: t.success,     fg: '#ffffff',      icon: 'checkmark-circle-outline' },
    in_progress:     { label: 'Viaje en curso',              bg: t.success,     fg: '#ffffff',      icon: 'navigate-outline' },
    completed:       { label: 'Viaje completado ✓',          bg: t.brandNavy,   fg: t.textOnNavy,   icon: 'checkmark-circle-outline' },
  };
}

// ── Pasos del viaje ────────────────────────────────────────────────────────
const STEPS = [
  { key: 'searching',       label: 'Buscando conductor' },
  { key: 'driver_assigned', label: 'Conductor asignado' },
  { key: 'arriving',        label: 'En camino' },
  { key: 'arrived',         label: 'Llegó' },
  { key: 'in_progress',     label: 'Viaje en curso' },
  { key: 'completed',       label: 'Destino' },
];

export type ActiveRideParams = {
  rideId: string;
  origin: { latitude: number; longitude: number; address: string };
  destination: { latitude: number; longitude: number; address: string };
  vehicleType: string;
  tripMode: string;
  category: string;
  price: number;
  pickupToken?: string;   // QR de identidad — el conductor lo escanea al recoger
  pickupCode?: string;    // PIN 6 dígitos — el conductor lo tipea para verificar
  shareUrl?: string;      // link público de seguimiento en tiempo real
};

export function ActiveRideScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<{ params: ActiveRideParams }, 'params'>>();
  const { rideId, origin, destination, vehicleType, tripMode, category, price, pickupToken, pickupCode, shareUrl } = route.params;

  // Theme adaptive — light/dark + brand tokens. Sin re-render cuando cambia
  // datos del viaje porque tokens/isDark son referencias estables.
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);
  const STATUS_CONFIG = useMemo(() => makeStatusConfig(tokens), [tokens]);

  const [status, setStatus] = useState<RideStatus>('searching');
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null); // minutos
  const [etaTotal, setEtaTotal] = useState<number | null>(null); // eta inicial para calcular progreso
  const [elapsedTime, setElapsedTime] = useState(0);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null); // km
  const [progressPercent, setProgressPercent] = useState<number | null>(null); // % GPS real
  const [showPickupQR, setShowPickupQR] = useState(false);
  const [callSession, setCallSession]     = useState<CallSession | null>(null);
  const [callLoading, setCallLoading]     = useState(false);
  // Datos del resumen del viaje recibidos en ride:completed
  const [rideCompleted, setRideCompleted] = useState<{
    distanceKm?: number;
    durationSeconds?: number;
  }>({});
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

    authService.getAccessToken().then((token) => {
      socket = io(`${TRANSPORT_WS}/rides`, {
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket?.emit('join:ride', { rideId });
      });

      // Posición del conductor en tiempo real
      socket.on('ride:driver_location', (data: { lat: number; lng: number; heading?: number; etaText?: string; progressPercent?: number }) => {
        setDriverLocation([data.lng, data.lat]);
        if (data.progressPercent != null) setProgressPercent(data.progressPercent);
        // Si recibimos ubicación del conductor y aún estamos en 'driver_assigned', pasar a 'arriving'
        setStatus(prev => prev === 'driver_assigned' ? 'arriving' : prev);
      });

      // ETA actualizada
      socket.on('ride:eta_update', (data: { etaText: string; etaSeconds?: number }) => {
        if (data.etaSeconds) {
          const mins = Math.round(data.etaSeconds / 60);
          setEta(mins);
          setEtaTotal(prev => prev ?? mins);
        }
      });

      // Sin conductores disponibles cerca — sacar al pasajero del estado "buscando"
      // y darle opción clara de volver a intentar. Sin esto, la pantalla se queda
      // bloqueada en el spinner indefinidamente.
      socket.on('ride:no_drivers_available', (data: { message?: string }) => {
        hapticWarning();
        Alert.alert(
          'Sin conductores disponibles',
          data?.message ?? 'No hay conductores disponibles cerca en este momento. Intenta de nuevo en unos minutos.',
          [
            {
              text: 'Volver',
              style: 'cancel',
              onPress: () => {
                socket?.disconnect();
                navigation.goBack();
              },
            },
            {
              text: 'Intentar de nuevo',
              onPress: () => {
                socket?.disconnect();
                // Volver dos pantallas atrás (ActiveRide → Confirm → Home/Search)
                // para que el usuario pueda pedir nuevo viaje desde cero.
                navigation.pop(2);
              },
            },
          ],
          { cancelable: false },
        );
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

      // Conductor llegó al punto de recogida — mostrar QR de identidad
      socket.on('ride:driver_arrived', () => {
        hapticHeavy();
        setStatus('arrived');
        if (pickupToken) setShowPickupQR(true);
      });

      // Pickup verificado — cerrar QR
      socket.on('ride:pickup_verified', () => {
        hapticSuccess();
        setShowPickupQR(false);
      });

      // Conductor a 10 minutos — notificación local (evento legacy)
      socket.on('ride:driver_10min', (data: { message: string }) => {
        hapticWarning();
        Notifications.scheduleNotificationAsync({
          content: {
            title: '🚗 GOING — Tu conductora o conductor está cerca',
            body: data.message ?? 'Llega en ~10 minutos. ¡Prepárate!',
            sound: true,
          },
          trigger: null, // inmediata
        }).catch(() => {/* permisos no concedidos — silencioso */});
      });

      // Hitos de proximidad unificados (backend emite 10min / 3min / arrived).
      // El de 10min ya lo cubre ride:driver_10min arriba, así que aquí solo
      // reaccionamos a 3min y "ya llegó" para no duplicar la alerta de 10min.
      socket.on('ride:driver_proximity', (data: { threshold?: '10min' | '3min' | 'arrived'; message?: string }) => {
        if (data?.threshold === '3min') {
          hapticWarning();
          Notifications.scheduleNotificationAsync({
            content: {
              title: '⏱️ GOING — Faltan ~3 minutos',
              body: data.message ?? 'Tu conductora o conductor llega en ~3 minutos. Sal al punto de encuentro.',
              sound: true,
            },
            trigger: null,
          }).catch(() => {/* permisos no concedidos — silencioso */});
        } else if (data?.threshold === 'arrived') {
          hapticHeavy();
          setStatus('arrived');
          if (pickupToken) setShowPickupQR(true);
          Notifications.scheduleNotificationAsync({
            content: {
              title: '✅ GOING — Tu conductora o conductor ya llegó',
              body: data.message ?? 'Búscale en el punto de encuentro.',
              sound: true,
            },
            trigger: null,
          }).catch(() => {/* permisos no concedidos — silencioso */});
        }
      });

      // Viaje iniciado
      socket.on('ride:started', () => {
        hapticSuccess();
        setStatus('in_progress');
      });

      // Viaje completado — navegar a resumen
      socket.on('ride:completed', (data: {
        distanceKm?: number;
        durationSeconds?: number;
        cashConfirmed?: boolean;
      }) => {
        hapticSuccess();
        setStatus('completed');
        setRideCompleted({
          distanceKm:      data?.distanceKm,
          durationSeconds: data?.durationSeconds,
        });
        analyticsRideCompleted({ ride_id: rideId, duration_minutes: elapsedTime, price });

        // Navegar automáticamente al resumen del viaje
        setTimeout(() => {
          navigation.replace('TripSummary' as any, {
            rideId,
            driverId:        driver?.id ?? '',
            driverName:      driver ? `${driver.firstName} ${driver.lastName}` : 'Conductor',
            origin:          origin.address,
            destination:     destination.address,
            fare:            price,
            distanceKm:      data?.distanceKm,
            durationSeconds: data?.durationSeconds,
            paymentMethod:   (route.params as any)?.paymentMethod ?? 'card',
            cashConfirmed:   data?.cashConfirmed,
            vehiclePlate:    driver?.vehiclePlate,
            vehicleModel:    driver?.vehicleModel,
            rideType:        (tripMode as any) ?? 'privado',
            referenceCode:   `GEC-${rideId.slice(-8).toUpperCase()}`,
          });
        }, 1500); // pequeño delay para mostrar el estado "completado"
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

  // ── Animar barra de progreso ──────────────────────────────────────────────
  // Prioridad: GPS progressPercent (real) > tiempo estimado (fallback)
  useEffect(() => {
    if (status !== 'in_progress') return;
    let progress: number | null = null;
    if (progressPercent != null) {
      progress = progressPercent / 100;           // GPS real (0–1)
    } else if (etaTotal) {
      progress = Math.min(elapsedTime / (etaTotal * 60), 1); // tiempo estimado
    }
    if (progress == null) return;
    Animated.timing(etaProgressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progressPercent, elapsedTime, etaTotal, status]);

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
    const trackingUrl = shareUrl ?? `https://app.goingec.com/tracking/live/${rideId}`;
    analyticsShareTracking(rideId);
    try {
      await Share.share({
        title: 'Mi viaje en Going App 🚗',
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
              await transportAPI.cancelRide(rideId);
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
        driverId:        driver.id,
        driverName:      `${driver.firstName} ${driver.lastName}`,
        fare:            price,
        distanceKm:      rideCompleted.distanceKm,
        durationSeconds: rideCompleted.durationSeconds,
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <Fragment>
    <View style={styles.container}>
      {/* ── MAPA ── */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL={isDark ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
      >
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
                lineColor: status === 'in_progress' ? tokens.brandNavy : tokens.neonBlue,
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

      {/* ── Botón SOS flotante (mockup #13 — escala completa post-tap) ── */}
      {status !== 'completed' && status !== 'searching' && (
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={() => {
            hapticHeavy();
            navigation.navigate('Sos', {
              rideId,
              driverName:  driver ? `${driver.firstName} ${driver.lastName}` : undefined,
              driverPlate: driver?.vehiclePlate,
              driverPhone: driver?.phone,
              originAddress:      origin.address,
              destinationAddress: destination.address,
              currentLat:  driverLocation?.[1] ?? origin.latitude,
              currentLng:  driverLocation?.[0] ?? origin.longitude,
            });
          }}
          activeOpacity={0.75}
          accessibilityLabel="Botón de emergencia SOS"
          accessibilityHint="Abre opciones de emergencia: ECU 911, contactos, soporte Going App"
        >
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      )}

      {/* ── LOGO GOING — esquina superior izquierda sobre el mapa ── */}
      <View style={styles.mapLogoOverlay} pointerEvents="none">
        <Image
          source={require('../../../assets/going-logo-horizontal.png')}
          style={styles.mapLogo}
          resizeMode="contain"
        />
      </View>

      {/* ── PANEL INFERIOR ── */}
      <View style={styles.panel}>

        {/* Status bar */}
        <View style={[styles.statusBar, { backgroundColor: statusConfig.bg }]}>
          {status === 'searching' ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name={statusConfig.icon as any} size={18} color={statusConfig.fg} />
            </Animated.View>
          ) : (
            <Ionicons name={statusConfig.icon as any} size={18} color={statusConfig.fg} />
          )}
          <Text style={[styles.statusText, { color: statusConfig.fg }]}>
            {statusConfig.label}
          </Text>
          {eta && status !== 'completed' && (
            <Text style={[styles.etaText, { color: statusConfig.fg, opacity: 0.85 }]}>
              ~{eta} min
            </Text>
          )}
          {status === 'in_progress' && (
            <Text style={[styles.timerText, { color: statusConfig.fg }]}>
              {formatTime(elapsedTime)}
            </Text>
          )}
        </View>

        {/* ── Barra de progreso GPS/ETA (solo en viaje activo) ── */}
        {status === 'in_progress' && (etaTotal || progressPercent != null) && (
          <View style={styles.etaContainer}>
            <View style={styles.etaLabelRow}>
              <Ionicons name="navigate-circle-outline" size={14} color={tokens.brandNavy} />
              <Text style={styles.etaRemainingText}>
                {progressPercent != null
                  ? `${progressPercent}% completado`
                  : etaTotal ? formatRemaining(etaTotal, elapsedTime) : ''}
              </Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareTracking}>
                <Ionicons name="share-social-outline" size={16} color={tokens.brandNavy} />
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
                      outputRange: [tokens.brandNavy, tokens.brandNavy, tokens.warning, tokens.brandRed],
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
            <Ionicons name="share-social-outline" size={16} color={tokens.brandNavy} />
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
                <Ionicons name="star" size={12} color={tokens.brandYellow} />
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
              <Ionicons name="chatbubble-ellipses" size={20} color={tokens.brandNavy} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callBtn, callLoading && { opacity: 0.5 }]}
              onPress={handleCallDriver}
              disabled={callLoading}
            >
              <Ionicons name={callLoading ? 'hourglass-outline' : 'call'} size={20} color={tokens.brandNavy} />
            </TouchableOpacity>
          </View>
        )}

        {/* Detalle de ruta */}
        <View style={styles.routeDetail}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: tokens.success }]} />
            <Text style={styles.routeAddress} numberOfLines={1}>{origin.address}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: tokens.brandRed }]} />
            <Text style={styles.routeAddress} numberOfLines={1}>{destination.address}</Text>
          </View>
        </View>

        {/* Info del viaje */}
        <View style={styles.tripInfo}>
          {routeDistance && (
            <View style={styles.tripTag}>
              <Ionicons name="map-outline" size={12} color={tokens.brandNavy} />
              <Text style={styles.tripTagText}>{routeDistance} km</Text>
            </View>
          )}
          <View style={styles.tripTag}>
            <Ionicons name="car-sport-outline" size={12} color={tokens.brandNavy} />
            <Text style={styles.tripTagText}>{vehicleType}</Text>
          </View>
          <View style={styles.tripTag}>
            <Ionicons name={tripMode === 'compartido' ? 'people-outline' : 'person-outline'} size={12} color={tokens.brandNavy} />
            <Text style={styles.tripTagText}>{tripMode === 'compartido' ? 'Compartido' : 'Privado'}</Text>
          </View>
          {category === 'premium' && (
            <View style={[styles.tripTag, styles.tripTagPremium]}>
              <Ionicons name="diamond-outline" size={12} color={tokens.premiumText} />
              <Text style={[styles.tripTagText, { color: tokens.premiumText }]}>Premium</Text>
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

    {/* ── Modal código de identidad (conductor llegó, va a verificar) ── */}
    {showPickupQR && (pickupCode || pickupToken) && (
      <View style={styles.qrOverlay}>
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Ionicons name="shield-checkmark-outline" size={28} color={tokens.brandNavy} />
            <Text style={styles.qrTitle}>Tu código de verificación</Text>
          </View>
          <Text style={styles.qrSubtitle}>Dile estos 6 dígitos a tu conductora o conductor para confirmar que es tu viaje</Text>

          {/* PIN 6 dígitos — fácil de leer en voz alta */}
          {pickupCode ? (
            <View style={styles.qrBox}>
              <Text style={styles.pickupCodeText}>{pickupCode}</Text>
            </View>
          ) : pickupToken ? (
            <View style={styles.qrBox}>
              <View style={styles.qrGrid}>
                {Array.from(pickupToken.slice(0, 16)).map((char, i) => (
                  <View
                    key={i}
                    style={[
                      styles.qrCell,
                      { backgroundColor: char.charCodeAt(0) % 2 === 0 ? tokens.brandNavy : tokens.brandYellow },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.qrCode}>{pickupToken.slice(0, 8).toUpperCase()}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.qrDismiss} onPress={() => setShowPickupQR(false)}>
            <Text style={styles.qrDismissText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}

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

// ─────────────────────────────────────────────────────────────
// Styles factory — todo el screen consume tokens del theme activo.
// Mantenemos algunos colores hardcoded donde son intencionales:
//   - '#fff' en iconos sobre superficies de marca (rojo SOS, marcadores)
//   - 'rgba(0,0,0,...)' en sombras y backdrops modales
//   - 'rgba(255,255,255,...)' en borde del SOS sobre coral
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    map: { flex: 1 },

    // Marcadores
    originMarker: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: t.success,
      justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
    },
    destMarker: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: t.brandRed,
      justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
    },
    driverMarker: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: t.brandNavy,
      justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: t.brandYellow,
    },

    // Logo sobre el mapa — fondo semi-translúcido adaptado al theme para que
    // el logo siempre quede legible (light: white-ish; dark: oscuro-ish).
    mapLogoOverlay: {
      position: 'absolute',
      top: 52,
      left: 16,
      zIndex: 10,
      backgroundColor: isDark ? 'rgba(15,20,36,0.85)' : 'rgba(255,255,255,0.88)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    mapLogo: { width: 110, height: 47 },

    // Panel inferior
    panel: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: t.bgLayer,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 0,
      shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
      shadowOpacity: isDark ? 0.4 : 0.12, shadowRadius: 10, elevation: 12,
    },

    // Status bar — color de fondo y texto vienen del STATUS_CONFIG (inline).
    statusBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 12, paddingHorizontal: 16,
      borderRadius: 14, marginTop: -20, marginBottom: 14,
    },
    statusText: { flex: 1, fontSize: 14, fontWeight: '700' },
    etaText: { fontSize: 13, fontWeight: '700' },
    timerText: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },

    // ETA progress bar
    etaContainer: { marginBottom: 12 },
    etaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    etaRemainingText: { flex: 1, fontSize: 12, fontWeight: '700', color: t.brandNavy },
    etaBarBg: {
      height: 8, borderRadius: 4, backgroundColor: t.border, overflow: 'hidden',
    },
    etaBarFill: { height: 8, borderRadius: 4 },

    // Share buttons — chip suave con tinte navy
    shareBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
      backgroundColor: isDark ? 'rgba(42,58,110,0.25)' : 'rgba(29,46,88,0.08)',
    },
    shareBtnText: { fontSize: 11, fontWeight: '700', color: t.brandNavy },
    shareBtnStandalone: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 8, borderRadius: 10,
      backgroundColor: isDark ? 'rgba(42,58,110,0.2)' : 'rgba(29,46,88,0.06)',
      borderWidth: 1, borderColor: isDark ? 'rgba(42,58,110,0.4)' : 'rgba(29,46,88,0.18)',
      marginBottom: 12,
    },
    shareBtnStandaloneText: { fontSize: 13, fontWeight: '600', color: t.brandNavy },

    // Progress steps
    stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 4 },
    stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.border },
    stepDotDone: { backgroundColor: t.brandNavy },
    stepDotActive: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: t.brandYellow },
    stepLine: { flex: 1, height: 2, backgroundColor: t.border, marginHorizontal: 2 },
    stepLineDone: { backgroundColor: t.brandNavy },

    // Driver card
    driverCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 12, borderRadius: 14, backgroundColor: t.bg,
      borderWidth: 1, borderColor: t.border, marginBottom: 12,
    },
    driverAvatar: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: t.brandNavy,
      justifyContent: 'center', alignItems: 'center',
    },
    driverInitials: { color: t.textOnNavy, fontWeight: '800', fontSize: 16 },
    driverInfo: { flex: 1 },
    driverName: { fontSize: 14, fontWeight: '700', color: t.textPrimary },
    driverVehicle: { fontSize: 12, color: t.textSecondary, marginTop: 1 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    ratingText: { fontSize: 12, fontWeight: '600', color: t.textPrimary },
    chatBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: isDark ? 'rgba(255,205,0,0.18)' : 'rgba(255,205,0,0.25)',
      justifyContent: 'center', alignItems: 'center',
    },
    callBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: isDark ? 'rgba(42,58,110,0.25)' : 'rgba(29,46,88,0.08)',
      justifyContent: 'center', alignItems: 'center',
    },

    // Route detail
    routeDetail: { marginBottom: 12, paddingLeft: 4 },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    routeDot: { width: 10, height: 10, borderRadius: 5 },
    routeLine: { width: 2, height: 16, backgroundColor: t.border, marginLeft: 4, marginVertical: 2 },
    routeAddress: { fontSize: 13, color: t.textPrimary, flex: 1 },

    // Trip info tags
    tripInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
    tripTag: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
      backgroundColor: t.glass,
    },
    tripTagText: { fontSize: 11, fontWeight: '600', color: t.brandNavy },
    tripTagPremium: {
      backgroundColor: t.premiumBg,
      borderWidth: 1, borderColor: t.premiumBorder,
    },
    tripPrice: { fontSize: 16, fontWeight: '900', color: t.brandNavy, marginLeft: 'auto' },

    // Botón SOS flotante sobre el mapa — ícono warning + label "SOS"
    // Usa brandRed (coral del logo) para alinear con identidad. Sombra fuerte
    // y elevation alta para que destaque sobre el mapa siempre.
    sosBtn: {
      position: 'absolute',
      top: 56,
      right: 16,
      paddingHorizontal: 14,
      paddingVertical: 9,
      minWidth: 64,
      borderRadius: 22,
      backgroundColor: t.brandRed,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      shadowColor: t.brandRed,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.55,
      shadowRadius: 10,
      elevation: 10,
      zIndex: 10,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    sosBtnText: {
      color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1,
    },

    cancelBtn: {
      paddingVertical: 14, borderRadius: 12, alignItems: 'center',
      borderWidth: 1.5, borderColor: t.brandRed,
      backgroundColor: isDark ? 'rgba(255,76,65,0.10)' : 'rgba(255,76,65,0.05)',
    },
    cancelBtnText: { color: t.brandRed, fontSize: 15, fontWeight: '700' },
    finishBtn: {
      paddingVertical: 14, borderRadius: 12, alignItems: 'center',
      backgroundColor: t.brandNavy,
    },
    finishBtnText: { color: t.textOnNavy, fontSize: 15, fontWeight: '700' },

    // QR de identidad — el backdrop modal queda oscuro siempre (es overlay,
    // no superficie del theme). El card sí usa surface del theme.
    qrOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100,
    },
    qrCard: {
      backgroundColor: t.bgLayer, borderRadius: 24, padding: 24,
      width: '85%', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
    },
    qrHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    qrTitle: { fontSize: 17, fontWeight: '800', color: t.textPrimary, flex: 1 },
    qrSubtitle: { fontSize: 13, color: t.textSecondary, textAlign: 'center', marginBottom: 20 },
    qrBox: { alignItems: 'center', marginBottom: 20 },
    qrGrid: {
      width: 120, height: 120, flexDirection: 'row', flexWrap: 'wrap',
      borderWidth: 3, borderColor: t.brandNavy, borderRadius: 8, overflow: 'hidden',
    },
    qrCell: { width: 30, height: 30 },
    qrCode: { marginTop: 10, fontSize: 18, fontWeight: '900', letterSpacing: 4, color: t.brandNavy },
    pickupCodeText: {
      fontSize: 56, fontWeight: '900', letterSpacing: 10,
      color: t.brandNavy, textAlign: 'center', paddingVertical: 12,
    },
    qrDismiss: {
      paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12,
      backgroundColor: t.glass,
    },
    qrDismissText: { fontSize: 14, fontWeight: '700', color: t.textPrimary },
  });
}
