import { LocationVO } from '@myorg/shared/domain/location.vo';
import { Driver } from '../entities/driver.entity'; // Asumiendo que ya existe
import { TipoVehiculo } from '../entities/trip.entity';

interface IConductorRepository {
  findAvailableNear(location: LocationVO, minRating: number, requiredCapacity: number): Promise<Driver[]>;
}

export class DriverService {
  constructor(private conductorRepo: IConductorRepository) {}

  async asignarConductorDisponible(
    tipoVehiculo: TipoVehiculo,
    origenViaje: LocationVO,
    modo: 'PUERTA_A_PUERTA' | 'PUNTO_A_PUNTO'
  ): Promise<Driver | null> {
    // Buscar conductores disponibles cerca del origen
    // Filtros:
    // - Que tengan el tipo de vehículo adecuado (SUV o VAN)
    // - Que estén disponibles (no en otro viaje)
    // - Que tengan rating >= 4.5 (configurable)
    // - Que tengan cupo para el modo (en SUV puede haber paquetes, en VAN no)

    const conductoresCercanos = await this.conductorRepo.findAvailableNear(
      origenViaje,
      4.5, // rating mínimo
      1 // cupo requerido (1 pasajero mínimo)
    );

    if (conductoresCercanos.length === 0) {
      return null;
    }

    // Seleccionar el más cercano (y con mejor rating como criterio secundario)
    const conductorAsignado = conductoresCercanos.sort((a, b) => {
      const distA = a.ubicacion.distanceTo(origenViaje);
      const distB = b.ubicacion.distanceTo(origenViaje);
      if (distA !== distB) {
        return distA - distB;
      }
      return b.rating - a.rating; // Mayor rating primero
    })[0];

    return conductorAsignado;
  }
}