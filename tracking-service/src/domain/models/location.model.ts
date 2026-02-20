/**
 * Location Model
 * Represents a driver's real-time location with GPS coordinates and metadata
 */

export interface Coordinates {
  type: 'Point';
  coordinates: [longitude: number, latitude: number]; // [lon, lat] order per GeoJSON spec
}

export interface LocationMetadata {
  accuracy?: number; // GPS accuracy in meters
  speed?: number; // Speed in km/h
  heading?: number; // Direction in degrees (0-360)
  altitude?: number; // Altitude in meters
  provider?: 'gps' | 'network' | 'fused'; // Location provider
}

export interface Location {
  _id?: string;
  driverId: string;
  companyId: string;
  vehicleId: string;
  coordinates: Coordinates;
  metadata: LocationMetadata;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationSnapshot {
  driverId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  address?: string;
}

export interface LocationUpdate {
  driverId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface LocationHistory {
  driverId: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  totalDistance: number; // kilometers
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  locations: Location[];
  tripCount: number;
}
