import { MoneyVO } from '@myorg/shared/domain/money.vo';
import { LocationVO } from '@myorg/shared/domain/location.vo';

interface CalcularPrecioCommand {
  distancia: number; // en km
  tipoVehiculo: 'SUV' | 'VAN';
  modo: 'PUERTA_A_PUERTA' | 'PUNTO_A_PUNTO';
  pasajerosActuales: number; // 1, 2 o 3 (para SUV) o 1-7 (para VAN)
  demandaActual?: number; // factor 0.5 - 2.0 basado en hora/día
}

export class CalcularPrecioUseCase {
  execute(command: CalcularPrecioCommand): MoneyVO {
    const {
      distancia,
      tipoVehiculo,
      modo,
      pasajerosActuales,
      demandaActual = 1.0,
    } = command;

    // Tarifas base por tipo de vehículo
    const tarifaBase = tipoVehiculo === 'SUV' ? 2.50 : 3.00; // USD
    const costoPorKm = tipoVehiculo === 'SUV' ? 1.20 : 0.90; // USD
    const costoPorMin = tipoVehiculo === 'SUV' ? 0.35 : 0.25; // USD

    // Suponiendo una velocidad promedio de 40 km/h para estimar tiempo
    const tiempoEstimadoHoras = distancia / 40;
    const tiempoMinutos = tiempoEstimadoHoras * 60;

    let precioBase = tarifaBase + (distancia * costoPorKm) + (tiempoMinutos * costoPorMin);

    // Ajuste por demanda (hora pico, día festivo, etc.)
    precioBase *= demandaActual;

    // Ajuste por modo
    if (modo === 'PUNTO_A_PUNTO') {
      // Punto a punto puede tener una tarifa ligeramente más baja por volumen
      precioBase *= 0.95;
    }

    // Ajuste por número de pasajeros (solo para el precio base, no el final por persona)
    // Esto puede ser útil si se ofrecen descuentos por grupos grandes
    if (pasajerosActuales > 1) {
      precioBase *= 0.98; // Pequeño descuento por grupo
    }

    return MoneyVO.fromUSD(precioBase);
  }
}