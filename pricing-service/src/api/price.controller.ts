import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import {
  PricingEngineService,
  type PriceInput,
} from '../application/pricing-engine.service';

/**
 * Motor de tarifas — endpoint runtime que todos consultan.
 *   POST /price          → cotiza (precio + desglose + versión de lista)
 *   POST /admin/refresh  → recarga la lista activa desde Atlas (invalidación)
 */
@Controller()
export class PriceController {
  private readonly logger = new Logger(PriceController.name);

  constructor(private readonly engine: PricingEngineService) {}

  @Post('price')
  @HttpCode(200)
  async price(@Body() body: PriceInput) {
    try {
      return await this.engine.price(body);
    } catch (e) {
      return { error: (e as Error).message, serviceType: body?.serviceType ?? null };
    }
  }

  @Post('admin/refresh')
  @HttpCode(200)
  async refresh() {
    await this.engine.refresh();
    return { refreshed: true };
  }
}
