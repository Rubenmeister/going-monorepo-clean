import { LocationVO } from '@myorg/shared/domain/location.vo';
import { MoneyVO } from '@myorg/shared/domain/money.vo';
import { UUIDVO } from '@myorg/shared/domain/uuid.vo';
import { DriverId } from './driver.entity'; // Asumiendo que ya existe
import { UserId } from './user.entity'; // Asumiendo que ya existe

export type TripStatus = 'PROGRAMADO' | 'ESPERANDO_PASAJEROS' | 'EN_RUTA' | 'FINALIZADO' | 'CANCELADO';

export type TipoVehiculo = 'SUV' | 'VAN';
export type ModoViaje = 'PUERTA_A_PUERTA' | 'PUNTO_A_PUNTO';

// Representa un pasajero en un viaje compartido
interface PasajeroEnViaje {
  userId: UserId;
  origen: LocationVO;
  destino: LocationVO;
  precioPagado: MoneyVO;
  asientoDelantero: boolean; // Solo aplica para SUV
}

export class Trip {
  id: UUIDVO;
  conductorId: DriverId;
  tipoVehiculo: TipoVehiculo;
  modo: ModoViaje;
  estado: TripStatus;
  pasajeros: PasajeroEnViaje[];
  origen: LocationVO; // Para PUNTO_A_PUNTO
  destino: LocationVO; // Para PUNTO_A_PUNTO
  estacionOrigen?: string; // Solo para VAN
  estacionDestino?: string; // Solo para VAN
  rutaOptimizada: LocationVO[]; // Calculada por el sistema
  horaSalidaProgramada: Date;
  horaLlegadaEstimada: Date;
  precioBase: MoneyVO; // Precio total antes de compartir
  precioPorPasajero: MoneyVO; // Precio final por pasajero

  constructor(props: {
    id: UUIDVO;
    conductorId: DriverId;
    tipoVehiculo: TipoVehiculo;
    modo: ModoViaje;
    origen: LocationVO;
    destino: LocationVO;
    estacionOrigen?: string;
    estacionDestino?: string;
    horaSalidaProgramada: Date;
    precioBase: MoneyVO;
  }) {
    this.id = props.id;
    this.conductorId = props.conductorId;
    this.tipoVehiculo = props.tipoVehiculo;
    this.modo = props.modo;
    this.estado = 'PROGRAMADO';
    this.pasajeros = [];
    this.origen = props.origen;
    this.destino = props.destino;
    this.estacionOrigen = props.estacionOrigen;
    this.estacionDestino = props.estacionDestino;
    this.horaSalidaProgramada = props.horaSalidaProgramada;
    this.precioBase = props.precioBase;
    this.precioPorPasajero = props.precioBase; // Se recalcula más adelante
    this.rutaOptimizada = [props.origen, props.destino]; // Se optimiza con pasajeros
  }

  // Capacidad según tipo de vehículo
  getCapacidadMaxima(): number {
    return this.tipoVehiculo === 'VAN' ? 7 : 3;
  }

  getCupoDisponible(): number {
    return this.getCapacidadMaxima() - this.pasajeros.length;
  }

  // Añadir un pasajero al viaje (solo si hay cupo y es compatible)
  agregarPasajero(pasajero: Omit<PasajeroEnViaje, 'precioPagado'>, precio: MoneyVO): void {
    if (this.getCupoDisponible() <= 0) {
      throw new Error('No hay cupo disponible en este viaje.');
    }

    if (this.tipoVehiculo === 'SUV' && pasajero.asientoDelantero && this.pasajeros.some(p => p.asientoDelantero)) {
      throw new Error('Solo un pasajero puede tener el asiento delantero en SUV.');
    }

    this.pasajeros.push({
      ...pasajero,
      precioPagado: precio
    });

    // Recalcular precio por pasajero si hay más de 1
    if (this.pasajeros.length > 1) {
      this.recalcularPrecioPorPasajero();
    }

    // Si está lleno, cambiar estado
    if (this.getCupoDisponible() === 0) {
      this.estado = 'ESPERANDO_PASAJEROS'; // o 'EN_RUTA' si ya partió
    }
  }

  private recalcularPrecioPorPasajero(): void {
    // Aplicar descuento por compartir
    const factorCompartir = this.pasajeros.length === 2 ? 0.6 : this.pasajeros.length === 3 ? 0.45 : 1.0;
    // Para VAN: no hay descuento por compartir, pero sí por volumen (más adelante)
    const nuevoPrecio = this.precioBase.multiply(factorCompartir);
    this.precioPorPasajero = nuevoPrecio;
    // Actualizar precio de todos los pasajeros
    for (const p of this.pasajeros) {
      p.precioPagado = nuevoPrecio;
    }
  }

  // Cambiar estado
  iniciar(): void {
    if (this.estado !== 'PROGRAMADO' && this.estado !== 'ESPERANDO_PASAJEROS') {
      throw new Error('No se puede iniciar un viaje en este estado.');
    }
    this.estado = 'EN_RUTA';
  }

  finalizar(): void {
    if (this.estado !== 'EN_RUTA') {
      throw new Error('Solo se puede finalizar un viaje en ruta.');
    }
    this.estado = 'FINALIZADO';
  }
}