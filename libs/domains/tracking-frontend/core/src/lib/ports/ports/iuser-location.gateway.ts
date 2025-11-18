import { DriverLocation } from '../entities/driver-location.entity';

// Symbol para inyección de dependencias
export const IUserLocationGateway = Symbol('IUserLocationGateway');

export interface IUserLocationGateway {
  /**
   * Se suscribe al stream de ubicaciones en tiempo real
   */
  subscribeToUpdates(
    callback: (location: DriverLocation) => void,
  ): () => void; // Devuelve una función para cancelar la suscripción
  
  connect(): void;
  disconnect(): void;
}