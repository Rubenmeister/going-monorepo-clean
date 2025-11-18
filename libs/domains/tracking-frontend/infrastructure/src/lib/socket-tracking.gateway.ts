import { Result, ok, err } from 'neverthrow';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { IUserLocationGateway, DriverLocation } from '@going-monorepo-clean/domains-tracking-frontend-core';
import { io, Socket } from 'socket.io-client';

const API_GATEWAY_URL = 'http://localhost:3000'; // URL sin /api para WebSockets

export class SocketTrackingGateway implements IUserLocationGateway {
  private socket: Socket | null = null;
  private isConnected = false;

  constructor(private readonly authRepository: IAuthRepository) {}

  public connect(): void {
    if (this.isConnected) return;

    // Conectamos al socket del API Gateway
    this.socket = io(API_GATEWAY_URL, {
      path: '/socket.io', // Ruta estándar de Socket.io
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('authToken'), // Obtener token
      },
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Socket conectado a API Gateway');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Socket desconectado');
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  public subscribeToUpdates(
    callback: (location: DriverLocation) => void,
  ): () => void {
    if (!this.socket) {
      this.connect();
    }

    const handler = (data: any) => {
      // Reconstruye la Entidad del Dominio antes de llamar al callback
      const location = DriverLocation.fromPrimitives(data);
      callback(location);
    };

    // Escucha el evento de broadcast del servidor
    this.socket?.on('driverLocationUpdated', handler);

    // Retorna la función de limpieza
    return () => {
      this.socket?.off('driverLocationUpdated', handler);
    };
  }
}