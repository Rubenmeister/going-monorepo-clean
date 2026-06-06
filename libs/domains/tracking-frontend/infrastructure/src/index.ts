import { Result, ok, err } from 'neverthrow';
import type {
  ITrackingGateway,
  IDriverLocationRepository,
  IUserLocationGateway,
  DriverLocation,
  LocationUpdate,
} from '@going-monorepo-clean/domains-tracking-frontend-core';
import type { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';
const WS_BASE = process.env['NX_WS_URL'] || 'wss://api.goingec.com';

export class SocketTrackingGateway implements ITrackingGateway {
  private ws: WebSocket | null = null;

  constructor(private readonly authRepository: IAuthRepository) {}

  async broadcastLocationUpdate(location: DriverLocation): Promise<Result<void, Error>> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return err(new Error('WebSocket no conectado.'));
    }
    this.ws.send(JSON.stringify({ type: 'LOCATION_UPDATE', data: location }));
    return ok(undefined);
  }

  async subscribeToRoom(room: string): Promise<Result<void, Error>> {
    const session = await this.authRepository.loadSession();
    const token = session.isOk() && session.value ? session.value.token : '';
    this.ws = new WebSocket(`${WS_BASE}/tracking?room=${room}&token=${token}`);
    return ok(undefined);
  }

  async unsubscribeFromRoom(_room: string): Promise<Result<void, Error>> {
    this.ws?.close();
    this.ws = null;
    return ok(undefined);
  }
}

export class HttpLocationRepository implements IDriverLocationRepository {
  async findByDriverId(driverId: string, token: string): Promise<Result<DriverLocation | null, Error>> {
    const res = await fetch(`${API_BASE}/tracking/drivers/${driverId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener ubicación: ${res.status}`));
    return ok(await res.json());
  }

  async getActiveDrivers(token?: string): Promise<Result<DriverLocation[], Error>> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/tracking/drivers/active`, { headers });
    if (!res.ok) return err(new Error(`Error al obtener conductores activos: ${res.status}`));
    return ok(await res.json());
  }

  async updateLocation(update: LocationUpdate, token: string): Promise<Result<void, Error>> {
    const res = await fetch(`${API_BASE}/tracking/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(update),
    });
    if (!res.ok) return err(new Error(`Error al actualizar ubicación: ${res.status}`));
    return ok(undefined);
  }
}
