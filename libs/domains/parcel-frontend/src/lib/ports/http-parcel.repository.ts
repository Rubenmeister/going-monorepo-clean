import { Result, ok, err } from 'neverthrow';
import {
  Parcel,
  IParcelRepository,
  CreateParcelData,
} from '@going-monorepo-clean/domains-parcel-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

const API_GATEWAY_URL = 'http://localhost:3000/api';

export class HttpParcelRepository implements IParcelRepository {
  
  public async create(data: CreateParcelData, token: string): Promise<Result<Parcel, Error>> {
    try {
      const body = {
        userId: data.userId,
        origin: data.origin.toPrimitives(),
        destination: data.destination.toPrimitives(),
        description: data.description,
        price: data.price.toPrimitives(),
      };

      const response = await fetch(`${API_GATEWAY_URL}/parcels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al crear el envío'));
      }

      const parcel = Parcel.fromPrimitives(responseData);
      return ok(parcel);
      
    } catch (error: any) {
      return err(new Error(error.message || 'Error de red al crear el envío'));
    }
  }

  public async getByUser(userId: UUID, token: string): Promise<Result<Parcel[], Error>> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/parcels/user/${userId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al obtener los envíos'));
      }

      const parcels = responseData.map((data: any) => Parcel.fromPrimitives(data));
      return ok(parcels);

    } catch (error: any) {
      return err(new Error('Error de red al obtener los envíos'));
    }
  }

  public async getTrackingStatus(parcelId: UUID, token: string): Promise<Result<Parcel, Error>> {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/parcels/${parcelId}/status`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al obtener el estado'));
      }

      const parcel = Parcel.fromPrimitives(responseData);
      return ok(parcel);
    } catch (error: any) {
      return err(new Error('Error de red al obtener el tracking'));
    }
  }
}