import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { MLService } from './ml.service';
import { AdvancedModelsService } from './advanced-models.service';

@Controller('ml')
export class MLController {
  private readonly logger = new Logger(MLController.name);

  constructor(
    private readonly mlService: MLService,
    private readonly advancedModels: AdvancedModelsService,
  ) {}

  /** POST /ml/route/optimize */
  @Post('route/optimize')
  async optimizeRoute(@Body() body: { companyId: string; driverId: string; deliveries: any[] }) {
    if (!body.companyId || !body.driverId || !body.deliveries?.length) {
      throw new BadRequestException('companyId, driverId, and deliveries are required');
    }
    return this.mlService.optimizeRoute(body.companyId, body.driverId, body.deliveries);
  }

  /** POST /ml/demand/forecast */
  @Post('demand/forecast')
  async forecastDemand(@Body() body: { companyId: string; period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' }) {
    if (!body.companyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.mlService.forecastDemand(body.companyId, body.period || 'DAILY');
  }

  /** POST /ml/churn/predict */
  @Post('churn/predict')
  async predictChurn(@Body() body: { userId: string; companyId: string }) {
    if (!body.userId || !body.companyId) {
      throw new BadRequestException('userId and companyId are required');
    }
    return this.mlService.predictChurn(body.userId, body.companyId);
  }

  /** POST /ml/fraud/detect */
  @Post('fraud/detect')
  async detectFraud(@Body() body: { transactionId: string; transactionData?: Record<string, any> }) {
    if (!body.transactionId) {
      throw new BadRequestException('transactionId is required');
    }
    return this.mlService.detectFraud(body.transactionId, body.transactionData || {});
  }

  /** POST /ml/anomaly/detect — uses companyId-based detector from MLService */
  @Post('anomaly/detect')
  async detectAnomaly(@Body() body: { companyId: string }) {
    if (!body.companyId) throw new BadRequestException('companyId is required');
    return this.mlService.detectAnomalies(body.companyId);
  }

  /** GET /ml/insights */
  @Get('insights')
  async getInsights(@Query('companyId') companyId: string) {
    if (!companyId) throw new BadRequestException('companyId is required');
    return this.mlService.generateInsights(companyId);
  }

  /** GET /ml/models */
  @Get('models')
  getModels() {
    return { models: [], message: 'Model registry (in-memory, empty on cold start)' };
  }
}
