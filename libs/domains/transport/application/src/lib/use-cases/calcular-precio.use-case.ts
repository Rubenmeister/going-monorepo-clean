import { Injectable } from '@nestjs/common';
import { MoneyVO } from '@going-monorepo-clean/shared-domain';
import { DemandFactorService } from '../services/demand-factor.service';
import { PromotionService } from '../services/promotion.service';

interface CalcularPrecioCommand {
  distancia: number; // en km
  tipoVehiculo: 'SUV' | 'SUVXL' | 'VAN';
  modoServicio: 'PRIVATE' | 'SHARED';
  categoria: 'STANDARD' | 'BUSINESS';
  modoEntrega: 'PUERTA_A_PUERTA' | 'PUNTO_A_PUNTO';
  pasajerosActuales: number;
  fecha?: Date;
  couponCode?: string;
}

@Injectable()
export class CalcularPrecioUseCase {
  constructor(
    private readonly demandFactorService: DemandFactorService,
    private readonly promotionService: PromotionService,
  ) {}

  execute(command: CalcularPrecioCommand): MoneyVO {
    const {
      distancia,
      tipoVehiculo,
      modoServicio,
      categoria,
      modoEntrega,
      pasajerosActuales,
      fecha = new Date(),
      couponCode,
    } = command;

    // 1. Tarifas base por tipo de vehículo
    // SUV: 3 asientos, SUVXL: 5 asientos, VAN: 7+ asientos
    let tarifaBase = 2.50;
    let costoPorKm = 1.20;
    let costoPorMin = 0.35;

    if (tipoVehiculo === 'SUVXL') {
      tarifaBase = 3.50;
      costoPorKm = 1.50;
      costoPorMin = 0.45;
    } else if (tipoVehiculo === 'VAN') {
      tarifaBase = 5.00;
      costoPorKm = 1.80;
      costoPorMin = 0.60;
    }

    // 2. Incremento por categoría BUSINESS (30%)
    if (categoria === 'BUSINESS') {
      tarifaBase *= 1.30;
      costoPorKm *= 1.30;
      costoPorMin *= 1.30;
    }

    // Velocidad promedio de 40 km/h para estimar tiempo
    const tiempoEstimadoHoras = distancia / 40;
    const tiempoMinutos = tiempoEstimadoHoras * 60;

    let precioCalculado = tarifaBase + (distancia * costoPorKm) + (tiempoMinutos * costoPorMin);

    // 3. Ajuste por modo de servicio (PRIVATE vs SHARED)
    if (modoServicio === 'PRIVATE') {
      // Precio por todo el vehículo (ya calculado como base)
      // No se aplican descuentos por compartir, el usuario paga el 100%
    } else {
      // SHARED: Precio por asiento
      // El precio base se divide por la capacidad estimada para dar un precio competitivo "por puesto"
      const capacidad = tipoVehiculo === 'SUV' ? 3 : tipoVehiculo === 'SUVXL' ? 5 : 7;
      precioCalculado = precioCalculado / capacidad;
      
      // Ajuste ligero por ocupación
      if (pasajerosActuales > 1) {
        precioCalculado *= 0.98; // Pequeño incentivo
      }
    }

    // 4. Ajuste por demanda automático
    const factorDemanda = this.demandFactorService.calculate(fecha);
    precioCalculado *= factorDemanda;

    // 5. Ajuste por modo de entrega
    if (modoEntrega === 'PUNTO_A_PUNTO') {
      precioCalculado *= 0.95;
    }

    // 6. Aplicar Promociones y Cupones
    const precioFinal = this.promotionService.applyPromotions(precioCalculado, fecha, couponCode);

    return MoneyVO.fromUSD(precioFinal);
  }
}