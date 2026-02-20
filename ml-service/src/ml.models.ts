/**
 * ML & Advanced Features Domain Models
 * Machine learning, route optimization, and predictive analytics
 */

export interface RouteOptimization {
  id?: string;
  companyId: string;
  driverId: string;
  deliveries: Delivery[];
  optimizedRoute: RouteLeg[];
  estimatedTime: number; // minutes
  estimatedDistance: number; // km
  estimatedFuelCost: number;
  savingsPercentage: number;
  confidence: number; // 0-100
  algorithm: string;
  createdAt: Date;
}

export interface Delivery {
  id: string;
  clientName: string;
  address: string;
  latitude: number;
  longitude: number;
  priority: number;
  timeWindow?: { start: Date; end: Date };
  serviceTime: number; // minutes
  weight?: number;
  volume?: number;
}

export interface RouteLeg {
  sequenceNumber: number;
  deliveryId: string;
  latitude: number;
  longitude: number;
  arrivalTime: Date;
  departureTime: Date;
  estimatedDuration: number;
  distance: number;
  instructions: string[];
}

export interface PredictiveAnalytics {
  type:
    | 'DEMAND_FORECAST'
    | 'CHURN_PREDICTION'
    | 'FRAUD_DETECTION'
    | 'ANOMALY_DETECTION';
  metric: string;
  predictions: PredictionPoint[];
  accuracy: number; // 0-100
  confidenceInterval: { lower: number; upper: number };
  nextUpdateTime: Date;
}

export interface PredictionPoint {
  period: Date;
  value: number;
  confidence: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface DemandForecast {
  companyId: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  forecastedDemand: PredictionPoint[];
  recommendedCapacity: number;
  riskFactors: string[];
}

export interface ChurnPrediction {
  customerId: string;
  churnProbability: number; // 0-1
  riskFactors: Array<{ factor: string; weight: number }>;
  retentionStrategies: string[];
  confidenceScore: number;
}

export interface FraudDetection {
  transactionId: string;
  fraudProbability: number; // 0-1
  riskScore: number;
  suspiciousPatterns: string[];
  recommendedAction: 'APPROVE' | 'REVIEW' | 'REJECT';
}

export interface MLModel {
  id?: string;
  name: string;
  type: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataPoints: number;
  lastTrainedAt: Date;
  isActive: boolean;
  parameters: Record<string, any>;
}

export interface TrainingJob {
  id?: string;
  modelId: string;
  status: 'QUEUED' | 'TRAINING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  metrics: Record<string, number>;
  errorMessage?: string;
}

export interface AnomalyDetectionAlert {
  id?: string;
  companyId: string;
  detectionType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedMetrics: string[];
  suggestedActions: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface AIInsight {
  id?: string;
  companyId: string;
  category: 'OPTIMIZATION' | 'PREDICTION' | 'ANOMALY' | 'RECOMMENDATION';
  title: string;
  description: string;
  impact: string; // Potential impact description
  actionItems: string[];
  confidence: number; // 0-100
  createdAt: Date;
}
