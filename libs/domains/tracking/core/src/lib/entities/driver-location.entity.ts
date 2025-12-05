// libs/domains-tracking/core/src/lib/entities/driver-location.entity.ts
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface DriverLocationProps {
  driverId: UUID;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export class DriverLocation {
  // ... constructor y lógica para crear/actualizar ...
  // [CRÍTICO]: Debe tener los métodos toPrimitives y fromPrimitives
  // que el RedisTrackingRepository utiliza.
  public toPrimitives(): any { 
      return { 
          driverId: this.driverId.toString(), 
          latitude: this.latitude,
          longitude: this.longitude,
          timestamp: this.timestamp.toISOString()
      }; 
  }
  
  public static fromPrimitives(primitives: any): DriverLocation {
      // ... lógica de mapeo inverso ...
  }
}