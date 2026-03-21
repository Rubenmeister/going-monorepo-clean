/**
 * Supply Chain Transparency Service
 * Real-time product tracking, carbon footprint calculation, and supplier management
 */

import { Injectable, Logger } from '@nestjs/common';

export interface Product {
  id?: string;
  sku: string;
  name: string;
  category: string;
  origin: string; // Manufacturing location
  weight: number; // kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  materials: string[];
  manufacturer: string;
  certifications: string[]; // ISO, FairTrade, etc.
  createdAt: Date;
}

export interface SupplierInfo {
  id?: string;
  name: string;
  country: string;
  region: string;
  type: 'MANUFACTURER' | 'DISTRIBUTOR' | 'LOGISTICS' | 'RETAILER';
  certifications: string[];
  carbonIntensity: number; // kg CO2 per unit
  ethicsScore: number; // 0-100
  reliabilityScore: number; // 0-100
  leadTime: number; // days
  capacity: number; // units per month
  contactPerson: string;
  email: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
}

export interface ProductJourney {
  id?: string;
  productId: string;
  stages: JourneyStage[];
  totalDistance: number; // km
  totalCarbonEmissions: number; // kg CO2e
  estimatedDeliveryDate: Date;
  currentLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status:
    | 'MANUFACTURING'
    | 'IN_TRANSIT'
    | 'IN_WAREHOUSE'
    | 'DELIVERED'
    | 'RETURNED';
  createdAt: Date;
  completedAt?: Date;
}

export interface JourneyStage {
  id?: string;
  stage: number;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  supplier: SupplierInfo;
  transportMode: 'TRUCK' | 'SHIP' | 'AIR' | 'RAIL' | 'BICYCLE';
  distance: number; // km
  duration: number; // hours
  carbonEmissions: number; // kg CO2e
  startTime: Date;
  endTime?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  certification?: string;
}

export interface CarbonFootprint {
  id?: string;
  productId: string;
  journeyId: string;
  manufacturingEmissions: number; // kg CO2e
  transportationEmissions: number; // kg CO2e
  packagingEmissions: number; // kg CO2e
  warehousingEmissions: number; // kg CO2e
  totalEmissions: number; // kg CO2e
  offsetCredit?: number; // kg CO2e offset
  carbonIntensity: number; // kg CO2e per kg product
  certifications: string[];
  timestamp: Date;
}

export interface SupplyChainMetrics {
  totalProducts: number;
  activeJourneys: number;
  averageTransitTime: number; // days
  totalCarbonEmissions: number; // kg CO2e
  supplierCount: number;
  onTimeDeliveryRate: number; // %
  wasteReductionRate: number; // %
}

@Injectable()
export class SupplyChainService {
  private readonly logger = new Logger(SupplyChainService.name);

  // In-memory storage
  private products: Map<string, Product> = new Map();
  private suppliers: Map<string, SupplierInfo> = new Map();
  private journeys: Map<string, ProductJourney> = new Map();
  private carbonFootprints: Map<string, CarbonFootprint> = new Map();
  private journeyStages: JourneyStage[] = [];

  /**
   * Register a new product
   */
  async registerProduct(
    sku: string,
    name: string,
    category: string,
    origin: string,
    weight: number,
    dimensions: any,
    materials: string[],
    manufacturer: string,
    certifications: string[]
  ): Promise<Product> {
    try {
      const productId = `prod-${Date.now()}`;
      const product: Product = {
        id: productId,
        sku,
        name,
        category,
        origin,
        weight,
        dimensions,
        materials,
        manufacturer,
        certifications,
        createdAt: new Date(),
      };

      this.products.set(productId, product);
      this.logger.log(`📦 Product registered: ${name} (${sku})`);

      return product;
    } catch (error) {
      this.logger.error(`Failed to register product: ${error}`);
      throw error;
    }
  }

  /**
   * Register a supplier
   */
  async registerSupplier(
    name: string,
    country: string,
    region: string,
    type: SupplierInfo['type'],
    certifications: string[],
    carbonIntensity: number,
    ethicsScore: number,
    reliabilityScore: number,
    leadTime: number,
    capacity: number,
    contactPerson: string,
    email: string,
    latitude: number,
    longitude: number
  ): Promise<SupplierInfo> {
    try {
      const supplierId = `sup-${Date.now()}`;
      const supplier: SupplierInfo = {
        id: supplierId,
        name,
        country,
        region,
        type,
        certifications,
        carbonIntensity,
        ethicsScore,
        reliabilityScore,
        leadTime,
        capacity,
        contactPerson,
        email,
        coordinates: {
          latitude,
          longitude,
        },
        createdAt: new Date(),
      };

      this.suppliers.set(supplierId, supplier);
      this.logger.log(
        `🏭 Supplier registered: ${name} (${type}, Ethics: ${ethicsScore}/100)`
      );

      return supplier;
    } catch (error) {
      this.logger.error(`Failed to register supplier: ${error}`);
      throw error;
    }
  }

  /**
   * Create product journey
   */
  async createJourney(productId: string): Promise<ProductJourney> {
    try {
      const product = this.products.get(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const journeyId = `journey-${Date.now()}`;
      const journey: ProductJourney = {
        id: journeyId,
        productId,
        stages: [],
        totalDistance: 0,
        totalCarbonEmissions: 0,
        estimatedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentLocation: {
          latitude: 0,
          longitude: 0,
          address: product.origin,
        },
        status: 'MANUFACTURING',
        createdAt: new Date(),
      };

      this.journeys.set(journeyId, journey);
      this.logger.log(`🚚 Journey created for product ${productId}`);

      return journey;
    } catch (error) {
      this.logger.error(`Failed to create journey: ${error}`);
      throw error;
    }
  }

  /**
   * Add stage to journey
   */
  async addJourneyStage(
    journeyId: string,
    stageNumber: number,
    stageName: string,
    supplierId: string,
    transportMode: JourneyStage['transportMode'],
    distance: number,
    latitude: number,
    longitude: number,
    address: string
  ): Promise<JourneyStage> {
    try {
      const journey = this.journeys.get(journeyId);
      const supplier = this.suppliers.get(supplierId);

      if (!journey || !supplier) {
        throw new Error('Journey or supplier not found');
      }

      // Calculate carbon emissions based on transport mode
      const carbonEmissions = this.calculateTransportEmissions(
        transportMode,
        distance,
        supplier.carbonIntensity
      );

      const duration = this.estimateTransitTime(transportMode, distance);

      const stage: JourneyStage = {
        id: `stage-${Date.now()}`,
        stage: stageNumber,
        name: stageName,
        location: {
          latitude,
          longitude,
          address,
        },
        supplier,
        transportMode,
        distance,
        duration,
        carbonEmissions,
        startTime: new Date(),
        status: 'PENDING',
      };

      journey.stages.push(stage);
      journey.totalDistance += distance;
      journey.totalCarbonEmissions += carbonEmissions;
      journey.currentLocation = {
        latitude,
        longitude,
        address,
      };

      this.journeyStages.push(stage);
      this.logger.log(
        `📍 Journey stage added: ${stageName} (${distance}km, ${carbonEmissions.toFixed(
          2
        )} kg CO2e)`
      );

      return stage;
    } catch (error) {
      this.logger.error(`Failed to add journey stage: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate carbon footprint for product
   */
  async calculateCarbonFootprint(
    productId: string,
    journeyId: string
  ): Promise<CarbonFootprint> {
    try {
      const product = this.products.get(productId);
      const journey = this.journeys.get(journeyId);

      if (!product || !journey) {
        throw new Error('Product or journey not found');
      }

      // Manufacturing emissions (typical: 5 kg CO2e per kg product)
      const manufacturingEmissions = product.weight * 5;

      // Transportation emissions from journey stages
      const transportationEmissions = journey.totalCarbonEmissions;

      // Packaging emissions (typical: 0.05 kg CO2e per kg packaging)
      const packagingEmissions = product.weight * 0.05;

      // Warehousing emissions (0.02 kg CO2e per kg per day, assume 7 days)
      const warehousingEmissions = product.weight * 0.02 * 7;

      const totalEmissions =
        manufacturingEmissions +
        transportationEmissions +
        packagingEmissions +
        warehousingEmissions;

      const carbonIntensity = totalEmissions / product.weight;

      const footprintId = `carbon-${Date.now()}`;
      const footprint: CarbonFootprint = {
        id: footprintId,
        productId,
        journeyId,
        manufacturingEmissions,
        transportationEmissions,
        packagingEmissions,
        warehousingEmissions,
        totalEmissions,
        carbonIntensity,
        certifications: product.certifications,
        timestamp: new Date(),
      };

      this.carbonFootprints.set(footprintId, footprint);
      this.logger.log(
        `🌱 Carbon footprint calculated: ${totalEmissions.toFixed(2)} kg CO2e`
      );

      return footprint;
    } catch (error) {
      this.logger.error(`Failed to calculate carbon footprint: ${error}`);
      throw error;
    }
  }

  /**
   * Apply carbon offset credits
   */
  async applyCarbonOffset(
    footprintId: string,
    offsetAmount: number
  ): Promise<CarbonFootprint> {
    try {
      const footprint = this.carbonFootprints.get(footprintId);
      if (!footprint) {
        throw new Error('Footprint not found');
      }

      footprint.offsetCredit = (footprint.offsetCredit || 0) + offsetAmount;
      this.logger.log(
        `♻️ Carbon offset applied: ${offsetAmount} kg CO2e (Total offset: ${footprint.offsetCredit})`
      );

      return footprint;
    } catch (error) {
      this.logger.error(`Failed to apply carbon offset: ${error}`);
      throw error;
    }
  }

  /**
   * Update journey stage status
   */
  async updateStageStatus(
    journeyId: string,
    stageId: string,
    status: JourneyStage['status']
  ): Promise<JourneyStage | null> {
    try {
      const journey = this.journeys.get(journeyId);
      if (!journey) return null;

      const stage = journey.stages.find((s) => s.id === stageId);
      if (!stage) return null;

      stage.status = status;
      if (status === 'COMPLETED') {
        stage.endTime = new Date();
      }

      this.logger.log(`✅ Stage status updated: ${stageId} -> ${status}`);
      return stage;
    } catch (error) {
      this.logger.error(`Failed to update stage status: ${error}`);
      throw error;
    }
  }

  /**
   * Update journey status and location
   */
  async updateJourneyLocation(
    journeyId: string,
    latitude: number,
    longitude: number,
    address: string,
    status?: ProductJourney['status']
  ): Promise<ProductJourney | null> {
    try {
      const journey = this.journeys.get(journeyId);
      if (!journey) return null;

      journey.currentLocation = {
        latitude,
        longitude,
        address,
      };

      if (status) {
        journey.status = status;
      }

      this.logger.log(
        `📡 Journey location updated: ${address} (${latitude}, ${longitude})`
      );

      return journey;
    } catch (error) {
      this.logger.error(`Failed to update journey location: ${error}`);
      throw error;
    }
  }

  /**
   * Get product traceability report
   */
  async getTraceabilityReport(productId: string): Promise<any> {
    try {
      const product = this.products.get(productId);
      const journeys = Array.from(this.journeys.values()).filter(
        (j) => j.productId === productId
      );

      if (!product) {
        throw new Error('Product not found');
      }

      const reports = journeys.map((journey) => {
        const footprints = Array.from(this.carbonFootprints.values()).filter(
          (f) => f.journeyId === journey.id
        );

        return {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            manufacturer: product.manufacturer,
            certifications: product.certifications,
          },
          journey: {
            id: journey.id,
            status: journey.status,
            totalDistance: journey.totalDistance,
            estimatedDelivery: journey.estimatedDeliveryDate,
            currentLocation: journey.currentLocation,
          },
          stages: journey.stages.map((s) => ({
            name: s.name,
            supplier: s.supplier.name,
            transportMode: s.transportMode,
            distance: s.distance,
            duration: s.duration,
            carbonEmissions: s.carbonEmissions,
            status: s.status,
          })),
          carbon: footprints.length > 0 ? footprints[0] : null,
        };
      });

      this.logger.log(
        `📋 Traceability report generated for ${productId} (${journeys.length} journeys)`
      );

      return reports;
    } catch (error) {
      this.logger.error(`Failed to generate traceability report: ${error}`);
      throw error;
    }
  }

  /**
   * Get supplier ethics report
   */
  async getSupplierEthicsReport(): Promise<any[]> {
    try {
      const suppliers = Array.from(this.suppliers.values());

      const report = suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        country: supplier.country,
        type: supplier.type,
        ethicsScore: supplier.ethicsScore,
        reliabilityScore: supplier.reliabilityScore,
        carbonIntensity: supplier.carbonIntensity,
        certifications: supplier.certifications,
        leadTime: supplier.leadTime,
        capacity: supplier.capacity,
        riskLevel:
          supplier.ethicsScore < 50
            ? 'HIGH'
            : supplier.ethicsScore < 70
            ? 'MEDIUM'
            : 'LOW',
      }));

      this.logger.log(
        `📊 Supplier ethics report generated (${report.length} suppliers)`
      );

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate supplier ethics report: ${error}`);
      throw error;
    }
  }

  /**
   * Get supply chain metrics
   */
  async getMetrics(): Promise<SupplyChainMetrics> {
    try {
      const products = Array.from(this.products.values());
      const suppliers = Array.from(this.suppliers.values());
      const journeys = Array.from(this.journeys.values());
      const footprints = Array.from(this.carbonFootprints.values());

      const activeJourneys = journeys.filter(
        (j) => j.status !== 'DELIVERED' && j.status !== 'RETURNED'
      ).length;

      const completedJourneys = journeys.filter(
        (j) => j.status === 'DELIVERED'
      );
      const totalDeliveries = completedJourneys.length;
      const onTimeDeliveries = completedJourneys.filter(
        (j) => j.completedAt! <= j.estimatedDeliveryDate
      ).length;

      const averageTransitTime =
        completedJourneys.length > 0
          ? completedJourneys.reduce(
              (sum, j) =>
                sum +
                (j.completedAt!.getTime() - j.createdAt.getTime()) /
                  (24 * 60 * 60 * 1000),
              0
            ) / completedJourneys.length
          : 0;

      const totalCarbonEmissions = footprints.reduce(
        (sum, f) => sum + (f.totalEmissions - (f.offsetCredit || 0)),
        0
      );

      const metrics: SupplyChainMetrics = {
        totalProducts: products.length,
        activeJourneys,
        averageTransitTime,
        totalCarbonEmissions,
        supplierCount: suppliers.length,
        onTimeDeliveryRate:
          totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0,
        wasteReductionRate: 15, // Baseline waste reduction rate
      };

      this.logger.log(`📈 Supply chain metrics calculated`);
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Get journey details
   */
  async getJourney(journeyId: string): Promise<ProductJourney | null> {
    try {
      return this.journeys.get(journeyId) || null;
    } catch (error) {
      this.logger.error(`Failed to get journey: ${error}`);
      throw error;
    }
  }

  /**
   * Get product details
   */
  async getProduct(productId: string): Promise<Product | null> {
    try {
      return this.products.get(productId) || null;
    } catch (error) {
      this.logger.error(`Failed to get product: ${error}`);
      throw error;
    }
  }

  /**
   * Get supplier details
   */
  async getSupplier(supplierId: string): Promise<SupplierInfo | null> {
    try {
      return this.suppliers.get(supplierId) || null;
    } catch (error) {
      this.logger.error(`Failed to get supplier: ${error}`);
      throw error;
    }
  }

  // Helper methods

  private calculateTransportEmissions(
    transportMode: JourneyStage['transportMode'],
    distance: number,
    supplierIntensity: number
  ): number {
    // CO2 emissions by transport mode (kg CO2 per km)
    const emissionFactors: Record<string, number> = {
      TRUCK: 0.1,
      SHIP: 0.01,
      AIR: 0.5,
      RAIL: 0.03,
      BICYCLE: 0.0,
    };

    const baseFactor = emissionFactors[transportMode] || 0.1;
    return (baseFactor + supplierIntensity * 0.1) * distance;
  }

  private estimateTransitTime(
    transportMode: JourneyStage['transportMode'],
    distance: number
  ): number {
    // Average speed by transport mode (km/h)
    const speeds: Record<string, number> = {
      TRUCK: 80,
      SHIP: 40,
      AIR: 900,
      RAIL: 100,
      BICYCLE: 20,
    };

    const speed = speeds[transportMode] || 80;
    return distance / speed;
  }
}
