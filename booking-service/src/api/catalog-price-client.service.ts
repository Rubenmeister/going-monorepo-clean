import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuthoritativePrice {
  amount: number;
  currency: string;
}

/**
 * CatalogPriceClient — obtiene el precio AUTORITATIVO de un ítem de catálogo
 * (tour/experiencia/alojamiento) por serviceId, consultando el servicio dueño
 * (auditoría B1 #9 — price tampering). booking-service usa ese precio e ignora
 * el totalPrice que manda el cliente, para que no se pueda manipular el precio
 * que alimenta la factura corporativa.
 *
 * Unidades: se COPIA el `amount` tal cual del ítem (misma fuente y unidad que el
 * cliente ya lee para armar totalPrice) → sin conversión, sin riesgo de 100×.
 * Los GET :id de catálogo son públicos (browse), así que no requieren auth.
 */
@Injectable()
export class CatalogPriceClient {
  private readonly logger = new Logger(CatalogPriceClient.name);

  constructor(private readonly config: ConfigService) {}

  /** Mapa serviceType → (baseUrlEnv, pathPrefix, campo de precio en el ítem). */
  private route(serviceType: string): { urlEnv: string; prefix: string; priceField: 'price' | 'pricePerNight' } | null {
    switch (serviceType) {
      case 'tour':
        return { urlEnv: 'TOURS_SERVICE_URL', prefix: 'tours', priceField: 'price' };
      case 'experience':
        return { urlEnv: 'EXPERIENCES_SERVICE_URL', prefix: 'experiences', priceField: 'price' };
      case 'accommodation':
        return { urlEnv: 'ACCOMMODATIONS_SERVICE_URL', prefix: 'accommodations', priceField: 'pricePerNight' };
      default:
        return null; // transport/parcel: no es catálogo (precio dinámico/preliminar)
    }
  }

  isCatalog(serviceType: string): boolean {
    return this.route(serviceType) !== null;
  }

  /**
   * Devuelve el precio autoritativo del ítem, o null si el tipo no es catálogo,
   * falta la URL, el ítem no existe, o no se pudo consultar. El caller decide la
   * política (fail-closed en catálogo).
   */
  async getAuthoritativePrice(serviceType: string, serviceId: string): Promise<AuthoritativePrice | null> {
    const r = this.route(serviceType);
    if (!r || !serviceId) return null;
    const base = this.config.get<string>(r.urlEnv);
    if (!base) {
      this.logger.error(`${r.urlEnv} no configurada — no se puede validar el precio de catálogo`);
      return null;
    }
    try {
      const url = `${base.replace(/\/$/, '')}/${r.prefix}/${encodeURIComponent(serviceId)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        this.logger.warn(`Catálogo ${r.prefix}/${serviceId} respondió HTTP ${res.status}`);
        return null;
      }
      const body: any = await res.json();
      // La respuesta puede venir directa o envuelta en { data } / { item }.
      const item = body?.data ?? body?.item ?? body;
      const money = item?.[r.priceField];
      const amount = typeof money?.amount === 'number' ? money.amount : Number(money?.amount);
      if (!Number.isFinite(amount)) {
        this.logger.warn(`Catálogo ${r.prefix}/${serviceId} sin precio numérico en ${r.priceField}`);
        return null;
      }
      return { amount, currency: money?.currency ?? 'USD' };
    } catch (e) {
      this.logger.warn(`Consulta de precio ${r.prefix}/${serviceId} falló: ${(e as Error).message}`);
      return null;
    }
  }
}
