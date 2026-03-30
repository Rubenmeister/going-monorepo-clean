import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupplyChainService } from './supply-chain.service';

@Controller('supply-chain')
export class SupplyChainController {
  private readonly logger = new Logger(SupplyChainController.name);
  constructor(private readonly supplyChainService: SupplyChainService) {}

  /** POST /supply-chain/products */
  @Post('products')
  registerProduct(@Body() body: {
    sku: string; name: string; category?: string; origin?: string;
    weight?: number; dimensions?: any; materials?: string[]; manufacturer?: string; certifications?: string[];
  }) {
    if (!body.sku || !body.name) throw new BadRequestException('sku and name required');
    return this.supplyChainService.registerProduct(
      body.sku, body.name, body.category || 'General', body.origin || 'Unknown',
      body.weight || 0, body.dimensions || { length: 0, width: 0, height: 0 },
      body.materials || [], body.manufacturer || 'Unknown', body.certifications || [],
    );
  }

  /** GET /supply-chain/products/:productId */
  @Get('products/:productId')
  async getProduct(@Param('productId') productId: string) {
    const product = await this.supplyChainService.getProduct(productId);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** POST /supply-chain/suppliers */
  @Post('suppliers')
  registerSupplier(@Body() body: {
    name: string; country: string; region?: string; type?: any;
    certifications?: string[]; carbonIntensity?: number; ethicsScore?: number;
    reliabilityScore?: number; leadTime?: number; capacity?: number;
    contactPerson?: string; email?: string; latitude?: number; longitude?: number;
  }) {
    if (!body.name || !body.country) throw new BadRequestException('name and country required');
    return this.supplyChainService.registerSupplier(
      body.name, body.country, body.region || '', body.type || 'MANUFACTURER',
      body.certifications || [], body.carbonIntensity || 0, body.ethicsScore || 50,
      body.reliabilityScore || 50, body.leadTime || 7, body.capacity || 1000,
      body.contactPerson || '', body.email || '', body.latitude || 0, body.longitude || 0,
    );
  }

  /** GET /supply-chain/suppliers/:supplierId */
  @Get('suppliers/:supplierId')
  async getSupplier(@Param('supplierId') supplierId: string) {
    const supplier = await this.supplyChainService.getSupplier(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  /** POST /supply-chain/journeys/:productId */
  @Post('journeys/:productId')
  createJourney(@Param('productId') productId: string) {
    return this.supplyChainService.createJourney(productId);
  }

  /** GET /supply-chain/journeys/:journeyId */
  @Get('journeys/:journeyId')
  async getJourney(@Param('journeyId') journeyId: string) {
    const journey = await this.supplyChainService.getJourney(journeyId);
    if (!journey) throw new NotFoundException('Journey not found');
    return journey;
  }

  /** POST /supply-chain/journeys/:journeyId/stages */
  @Post('journeys/:journeyId/stages')
  addStage(@Param('journeyId') journeyId: string, @Body() body: {
    stageNumber?: number; stageName?: string; supplierId: string;
    transportMode?: any; distance?: number; latitude?: number; longitude?: number; address?: string;
  }) {
    return this.supplyChainService.addJourneyStage(
      journeyId, body.stageNumber || 1, body.stageName || 'Stage',
      body.supplierId, body.transportMode || 'TRUCK', body.distance || 0,
      body.latitude || 0, body.longitude || 0, body.address || '',
    );
  }

  /** GET /supply-chain/traceability/:productId */
  @Get('traceability/:productId')
  getTraceability(@Param('productId') productId: string) {
    return this.supplyChainService.getTraceabilityReport(productId);
  }

  /** GET /supply-chain/carbon/:productId/:journeyId */
  @Get('carbon/:productId/:journeyId')
  getCarbonFootprint(@Param('productId') productId: string, @Param('journeyId') journeyId: string) {
    return this.supplyChainService.calculateCarbonFootprint(productId, journeyId);
  }

  /** GET /supply-chain/metrics */
  @Get('metrics')
  getMetrics() {
    return this.supplyChainService.getMetrics();
  }

  /** GET /supply-chain/ethics */
  @Get('ethics')
  getEthicsReport() {
    return this.supplyChainService.getSupplierEthicsReport();
  }
}
