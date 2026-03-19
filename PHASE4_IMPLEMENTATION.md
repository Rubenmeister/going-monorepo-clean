# Phase 4: Real-Time Geolocation & WebSocket Live Tracking

## 🎯 Objetivos
1. **Tracking en Tiempo Real** - Ubicación del conductor en vivo
2. **WebSocket Live Updates** - Actualizaciones en vivo del viaje
3. **Geolocation Services** - Consultas de conductores cercanos
4. **Zone/Radius Queries** - Búsqueda de disponibilidad en área
5. **Redis Geo Indexes** - Almacenamiento eficiente de ubicaciones

## 📊 Arquitectura Phase 4

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Web + Mobile)                   │
├─────────────────────────────────────────────────────────────┤
│  • Real-time location updates via WebSocket                │
│  • Driver location map visualization                        │
│  • Estimated arrival time (ETA) calculation               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Tracking Service (WebSocket + REST)           │
├─────────────────────────────────────────────────────────────┤
│  • Geo Service: Location indexing & queries               │
│  • Position Service: Current driver position              │
│  • Availability Service: Driver availability zones        │
│  • Socket.IO Gateway: Real-time connections              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (Redis + MongoDB)                  │
├─────────────────────────────────────────────────────────────┤
│  Redis:                                                     │
│  • GEO: Driver locations (lat, lon, driverId)             │
│  • STREAM: Location history & trip events                 │
│  • HASH: Driver session metadata                          │
│                                                             │
│  MongoDB:                                                   │
│  • Driver positions historical archive                     │
│  • Trip routes & tracking data                            │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Dominio de Geolocalización

### Core Entities

```typescript
// GeoLocation - Ubicación actual del conductor
interface GeoLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number; // Metros
  heading?: number;
  speed?: number;
  timestamp: Date;
}

// DriverAvailability - Estado de disponibilidad
interface DriverAvailability {
  driverId: string;
  status: 'online' | 'busy' | 'offline';
  currentLocation: GeoLocation;
  availableSeats: number;
  serviceTypes: string[];
  lastUpdate: Date;
}

// GeocodeResult - Resultado de geocodificación
interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

// TrackingSession - Sesión de tracking de viaje
interface TrackingSession {
  tripId: string;
  driverId: string;
  userId: string;
  startLocation: GeoLocation;
  endLocation?: GeoLocation;
  route: GeoLocation[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}
```

## 🔄 Flujos de Datos

### 1. Driver Location Update Flow
```
Mobile App Updates Location
  ↓
WebSocket Emit (socket.io)
  ↓
Tracking Service receives location
  ↓
Validate & Geocode (optional)
  ↓
Redis GEO index update (GEOADD)
  ↓
Broadcast to subscribed clients
  ↓
Archive to MongoDB (history)
```

### 2. Find Nearby Drivers Flow
```
User enters pickup location
  ↓
API Call: /api/tracking/nearby-drivers?lat=X&lon=Y&radius=5km
  ↓
Tracking Service Redis GEORADIUS query
  ↓
Fetch driver details from cache
  ↓
Calculate ETA using route service
  ↓
Return sorted list by distance
```

### 3. Real-time Trip Tracking Flow
```
Trip Created
  ↓
WebSocket Room Created (trip:${tripId})
  ↓
Driver joins room
  ↓
User joins room
  ↓
Driver location updates broadcast to room
  ↓
User sees real-time updates
```

## 📝 Implementación Detallada

### Paso 1: Crear Dominio de Geolocalización

**Archivo:** `shared-infrastructure/src/domains/geolocation/`

```
geolocation/
├── entities/
│   ├── geo-location.entity.ts
│   ├── driver-availability.entity.ts
│   └── tracking-session.entity.ts
├── value-objects/
│   ├── coordinates.vo.ts
│   └── distance.vo.ts
├── repositories/
│   ├── geo-location.repository.interface.ts
│   ├── driver-availability.repository.interface.ts
│   └── tracking-session.repository.interface.ts
└── services/
    ├── geolocation.service.ts
    └── distance-calculator.service.ts
```

### Paso 2: Extender Tracking Service

**Archivo:** `tracking-service/src/`

```
tracking-service/
├── src/
│   ├── infrastructure/
│   │   ├── gateways/
│   │   │   ├── socket-io-tracking.gateway.ts (EXTEND)
│   │   │   └── redis-pubsub.gateway.ts (NEW)
│   │   ├── persistence/
│   │   │   ├── redis-tracking.repository.ts (EXTEND)
│   │   │   ├── redis-geo.repository.ts (NEW)
│   │   │   └── mongo-tracking.repository.ts (NEW)
│   │   └── services/
│   │       ├── geo-service.ts (NEW)
│   │       ├── position-service.ts (NEW)
│   │       └── availability-service.ts (NEW)
│   ├── api/
│   │   ├── tracking.controller.ts (EXTEND)
│   │   ├── geo.controller.ts (NEW)
│   │   └── dtos/
│   │       ├── location-update.dto.ts (NEW)
│   │       ├── nearby-drivers.dto.ts (NEW)
│   │       └── tracking-session.dto.ts (NEW)
│   └── domain/
│       └── (use shared-infrastructure)
```

### Paso 3: Redis Geo Commands

```typescript
// Agregar ubicación del conductor
GEOADD drivers lat lon driverId

// Buscar conductores dentro de 5km
GEORADIUS drivers lat lon 5 km

// Distancia entre dos puntos
GEODIST drivers driver1 driver2 km

// Posición de un conductor
GEOPOS drivers driverId
```

### Paso 4: WebSocket Events

**Eventos del Cliente → Servidor:**
- `driver:location:update` - Nueva ubicación del conductor
- `trip:start:tracking` - Comenzar tracking del viaje
- `trip:end:tracking` - Terminar tracking del viaje

**Eventos del Servidor → Clientes:**
- `trip:location:update` - Nueva ubicación en tiempo real
- `trip:eta:update` - ETA actualizado
- `trip:status:change` - Cambio de estado del viaje

## 📡 APIs REST

### GET /api/tracking/nearby-drivers
```typescript
Query Parameters:
  - latitude: number (required)
  - longitude: number (required)
  - radius: number (default: 5) - en km
  - service_type?: string
  - limit?: number (default: 10)

Response:
{
  drivers: [{
    driverId: string;
    name: string;
    rating: number;
    currentLocation: { latitude, longitude };
    distance: number; // km
    eta: number; // segundos
    availableSeats: number;
  }]
}
```

### POST /api/tracking/sessions
```typescript
Body:
{
  tripId: string;
  driverId: string;
  userId: string;
  startLocation: { latitude, longitude };
  endLocation: { latitude, longitude };
}

Response: TrackingSession
```

### GET /api/tracking/sessions/:tripId
```typescript
Response:
{
  tripId: string;
  status: 'active' | 'completed';
  driverId: string;
  currentLocation: { latitude, longitude };
  route: GeoLocation[];
  eta: number;
  distance: number;
}
```

### PUT /api/tracking/driver-availability
```typescript
Body:
{
  driverId: string;
  status: 'online' | 'busy' | 'offline';
  location: { latitude, longitude };
  availableSeats: number;
}

Response: DriverAvailability
```

## 🔧 Configuración Necesaria

### .env Variables
```env
# Tracking Service
PORT=3008
REDIS_URL=redis://:password@localhost:6379
REDIS_GEO_KEY=going:drivers:locations
REDIS_STREAM_KEY=going:tracking:stream

# Geolocation Service
GOOGLE_MAPS_API_KEY=your_key_here
MAPBOX_ACCESS_TOKEN=your_token_here
LOCATION_UPDATE_INTERVAL=5000 # ms

# Trip Tracking
TRIP_TRACKING_TIMEOUT=3600000 # 1 hora
ETA_CALCULATION_SERVICE=mapbox
```

### Package Dependencies
```json
{
  "socket.io": "^4.7.0",
  "redis": "^4.6.0",
  "@nestjs/websockets": "^10.3.0",
  "@nestjs/platform-socket.io": "^10.3.0",
  "geolib": "^3.3.4",
  "haversine": "^1.1.1"
}
```

## ✅ Checklist de Implementación

- [ ] Crear dominio de geolocalización en shared-infrastructure
- [ ] Crear Redis Geo Repository
- [ ] Crear Geo Service para operaciones espaciales
- [ ] Extender Socket.IO Gateway con eventos de ubicación
- [ ] Crear APIs REST para búsqueda de conductores cercanos
- [ ] Implementar WebSocket room management para trips
- [ ] Crear DTOs para datos de ubicación
- [ ] Crear MongoDB schema para historial de tracking
- [ ] Tests unitarios para geo-queries
- [ ] Tests E2E para tracking en tiempo real
- [ ] Documentación de WebSocket API

## 🧪 Testing Strategy

### Unit Tests
- Geo Service: GEODIST, GEORADIUS calculations
- Distance Calculator: Haversine formula
- Availability Service: State transitions

### Integration Tests
- Redis GEO operations
- WebSocket location broadcasting
- MongoDB persistence

### E2E Tests
- Complete driver nearby flow
- Real-time trip tracking
- WebSocket connection lifecycle

## 📊 Performance Considerations

- Redis GEO indexes for <10ms radius queries
- WebSocket batching for high-frequency updates (5-10 sec intervals)
- MongoDB TTL index for old tracking sessions
- Connection pooling for WebSocket clients

## 🔐 Security Considerations

- Validate user can only see their own trip tracking
- Drivers can only update their own location
- Rate limit location updates (1 update per 3 seconds)
- Encrypt location data in transit (WSS/HTTPS)
