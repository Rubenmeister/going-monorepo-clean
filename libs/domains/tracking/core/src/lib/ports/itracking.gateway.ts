import { Result } from 'neverthrow';
import { DriverLocation } from '../entities/driver-location.entity';

// Symbol para inyección de dependencias
export const ITrackingGateway = Symbol('ITrackingGateway');

export interface ITrackingGateway {
  /** Difunde la ubicación a todos los clientes (usuarios) */
  broadcastLocationUpdate(location: DriverLocation): Promise<Result<void, Error>>;
  
  /** Difunde a una "sala" específica (ej. un viaje en curso) */
  broadcastToRoom(room: string, event: string, data: any): Promise<Result<void, Error>>;
}