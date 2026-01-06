import { LocationVO } from '@going-monorepo-clean/shared-domain';
import { Driver } from '../entities/driver.entity';
import { TipoVehiculo, Trip } from '../entities/trip.entity';
import { ECUADOR_ZONES } from '@going-monorepo/shared';

interface IConductorRepository {
  findAvailableNear(location: LocationVO, minRating: number, requiredCapacity: number): Promise<Driver[]>;
}

export class DriverService {
  constructor(private conductorRepo: IConductorRepository) {}

  async asignarConductorDisponible(
    tipoVehiculo: 'SUV' | 'SUVXL' | 'VAN',
    origenViaje: LocationVO,
    categoria: 'STANDARD' | 'BUSINESS',
    modoServicio: 'PRIVATE' | 'SHARED'
  ): Promise<Driver | null> {
    
    // 1. Identificar Zona de Origen
    const zonaOrigen = this.identificarZona(origenViaje);

    // 2. Establecer criterios mínimos según categoría
    const minRating = categoria === 'BUSINESS' ? 4.8 : 4.5;
    
    // Capacidad requerida según modo y vehículo
    // Si es PRIVATE, requerimos capacidad total.
    // Si es SHARED, requerimos al menos 1 cupo.
    const cupoRequerido = modoServicio === 'PRIVATE' 
        ? (tipoVehiculo === 'SUV' ? 3 : tipoVehiculo === 'SUVXL' ? 5 : 7)
        : 1;

    // 3. Buscar conductores disponibles
    const conductoresCercanos = await this.conductorRepo.findAvailableNear(
      origenViaje,
      minRating,
      cupoRequerido
    );

    if (conductoresCercanos.length === 0) {
      return null;
    }

    // 4. Filtrar y Ordenar:
    // - Prioridad 1: Conductores en la misma zona
    // - Prioridad 2: Mejor calificación
    // - Prioridad 3: Más cercanos
    const conductorAsignado = conductoresCercanos.sort((a, b) => {
      const zonaA = this.identificarZona(a.ubicacion);
      const zonaB = this.identificarZona(b.ubicacion);

      if (zonaA === zonaOrigen && zonaB !== zonaOrigen) return -1;
      if (zonaB === zonaOrigen && zonaA !== zonaOrigen) return 1;

      // Desempate por rating
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      // Desempate por distancia
      const distA = a.ubicacion.distanceTo(origenViaje);
      const distB = b.ubicacion.distanceTo(origenViaje);
      return distA - distB;
    })[0];

    return conductorAsignado;
  }

  obtenerOrdenOptimo(puntos: { id: string, location: LocationVO, type: 'PICKUP' | 'DROPOFF' }[]): any[] {
    if (puntos.length <= 1) return puntos;

    const rutaOrdenada: any[] = [];
    const pendientes = [...puntos];
    let puntoActual = puntos[0];

    while (pendientes.length > 0) {
      pendientes.sort((a, b) => {
        const distA = puntoActual.location.distanceTo(a.location);
        const distB = puntoActual.location.distanceTo(b.location);
        
        if (Math.abs(distA - distB) < 0.5) {
            if (a.type === 'PICKUP' && b.type === 'DROPOFF') return -1;
            if (b.type === 'PICKUP' && a.type === 'DROPOFF') return 1;
        }
        
        return distA - distB;
      });

      const siguiente = pendientes.shift()!;
      rutaOrdenada.push(siguiente);
      puntoActual = siguiente;
    }

    return rutaOrdenada;
  }

  private identificarZona(location: LocationVO): string {
    // Placeholder de lógica espacial
    return 'UIO-CENTRAL';
  }
}