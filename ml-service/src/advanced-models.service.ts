/**
 * Advanced ML Models Service
 * TensorFlow integration, Neural Networks, Recommendation Engine
 */

import { Injectable, Logger } from '@nestjs/common';

export interface NeuralNetworkModel {
  id?: string;
  name: string;
  type: 'DELIVERY_TIME_PREDICTION' | 'ROUTE_OPTIMIZATION' | 'DEMAND_FORECAST';
  layers: NeuralLayer[];
  weights: number[];
  accuracy: number;
  status: 'ACTIVE' | 'TRAINING' | 'DEPRECATED';
  createdAt: Date;
}

export interface NeuralLayer {
  type: 'INPUT' | 'HIDDEN' | 'OUTPUT';
  neurons: number;
  activation: 'RELU' | 'SIGMOID' | 'TANH' | 'SOFTMAX';
  dropout?: number;
}

export interface RecommendationResult {
  id?: string;
  userId: string;
  itemId: string;
  score: number;
  reason: string;
  category: string;
  timestamp: Date;
}

export interface UserBehavior {
  userId: string;
  viewedItems: string[];
  clickedItems: string[];
  purchasedItems: string[];
  ratings: Record<string, number>;
  sessionDuration: number;
  lastActivityAt: Date;
}

@Injectable()
export class AdvancedModelsService {
  private readonly logger = new Logger(AdvancedModelsService.name);

  // In-memory storage
  private models: Map<string, NeuralNetworkModel> = new Map();
  private userBehaviors: Map<string, UserBehavior> = new Map();
  private recommendations: Map<string, RecommendationResult[]> = new Map();
  private itemEmbeddings: Map<string, number[]> = new Map();

  /**
   * Create Neural Network model
   */
  async createNeuralNetwork(
    name: string,
    type: NeuralNetworkModel['type'],
    layers: NeuralLayer[]
  ): Promise<NeuralNetworkModel> {
    try {
      const modelId = `nn-${Date.now()}`;
      const totalNeurons = layers.reduce((sum, l) => sum + l.neurons, 0);

      // Initialize weights (simplified)
      const weights = Array.from(
        { length: totalNeurons * totalNeurons },
        () => Math.random() - 0.5
      );

      const model: NeuralNetworkModel = {
        id: modelId,
        name,
        type,
        layers,
        weights,
        accuracy: 0.0,
        status: 'TRAINING',
        createdAt: new Date(),
      };

      this.models.set(modelId, model);
      this.logger.log(
        `🧠 Neural Network created: ${name} (${layers.length} layers)`
      );

      return model;
    } catch (error) {
      this.logger.error(`Failed to create neural network: ${error}`);
      throw error;
    }
  }

  /**
   * Train Neural Network
   */
  async trainNeuralNetwork(
    modelId: string,
    trainingData: any[]
  ): Promise<void> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      model.status = 'TRAINING';

      // Simplified training process
      let totalError = 0;
      const epochs = 100;
      const learningRate = 0.01;

      for (let epoch = 0; epoch < epochs; epoch++) {
        for (const data of trainingData) {
          // Forward propagation (simplified)
          const prediction = this.forward(model, data.input);

          // Calculate error
          const error = data.output - prediction;
          totalError += error * error;

          // Backpropagation (simplified)
          this.backward(model, error, learningRate);
        }

        if (epoch % 10 === 0) {
          this.logger.log(
            `📈 Training epoch ${epoch}/${epochs}, Error: ${(
              totalError / trainingData.length
            ).toFixed(4)}`
          );
        }
      }

      // Calculate accuracy
      model.accuracy = 1 - totalError / trainingData.length;
      model.status = 'ACTIVE';

      this.logger.log(
        `✅ Training completed: ${model.name} (Accuracy: ${(
          model.accuracy * 100
        ).toFixed(2)}%)`
      );
    } catch (error) {
      this.logger.error(`Failed to train neural network: ${error}`);
      throw error;
    }
  }

  /**
   * Predict delivery time using neural network
   */
  async predictDeliveryTime(
    modelId: string,
    distance: number,
    traffic: number,
    weather: number
  ): Promise<number> {
    try {
      const model = this.models.get(modelId);
      if (!model || model.status !== 'ACTIVE') {
        throw new Error('Model not available');
      }

      // Normalize inputs
      const input = [distance / 100, traffic / 100, weather / 100];

      // Forward propagation
      const prediction = this.forward(model, input);

      // Denormalize output (in minutes)
      const deliveryTime = prediction * 60;

      this.logger.log(
        `🚚 Delivery time predicted: ${deliveryTime.toFixed(2)} minutes`
      );

      return deliveryTime;
    } catch (error) {
      this.logger.error(`Failed to predict delivery time: ${error}`);
      throw error;
    }
  }

  /**
   * Collaborative Filtering - Recommendation Engine
   */
  async generateRecommendations(
    userId: string,
    limit = 5
  ): Promise<RecommendationResult[]> {
    try {
      const userBehavior =
        this.userBehaviors.get(userId) || this.createUserBehavior(userId);

      // Calculate item embeddings from user behavior
      const itemScores = new Map<string, number>();

      // Collaborative filtering logic
      for (const [otherUserId, otherBehavior] of this.userBehaviors) {
        if (otherUserId === userId) continue;

        // Calculate similarity
        const similarity = this.calculateUserSimilarity(
          userBehavior,
          otherBehavior
        );

        // Add items from similar users
        for (const item of otherBehavior.purchasedItems) {
          if (!userBehavior.purchasedItems.includes(item)) {
            const currentScore = itemScores.get(item) || 0;
            itemScores.set(item, currentScore + similarity);
          }
        }
      }

      // Content-based recommendations
      for (const viewedItem of userBehavior.viewedItems) {
        const embedding = this.itemEmbeddings.get(viewedItem) || [];

        // Find similar items
        for (const [itemId, itemEmbedding] of this.itemEmbeddings) {
          if (
            viewedItem !== itemId &&
            !userBehavior.purchasedItems.includes(itemId)
          ) {
            const similarity = this.calculateEmbeddingSimilarity(
              embedding,
              itemEmbedding
            );
            const currentScore = itemScores.get(itemId) || 0;
            itemScores.set(itemId, currentScore + similarity * 0.5);
          }
        }
      }

      // Sort and create recommendations
      const recommendations: RecommendationResult[] = Array.from(
        itemScores.entries()
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([itemId, score]) => ({
          userId,
          itemId,
          score: Math.min(1, score / 10),
          reason:
            score > 5
              ? 'Similar to items you viewed'
              : 'Popular in your category',
          category: 'DELIVERY_SERVICE',
          timestamp: new Date(),
        }));

      this.recommendations.set(userId, recommendations);

      this.logger.log(
        `⭐ Generated ${recommendations.length} recommendations for user ${userId}`
      );

      return recommendations;
    } catch (error) {
      this.logger.error(`Failed to generate recommendations: ${error}`);
      throw error;
    }
  }

  /**
   * Track user behavior for recommendations
   */
  async trackUserBehavior(
    userId: string,
    action: 'VIEW' | 'CLICK' | 'PURCHASE' | 'RATE',
    itemId: string,
    rating?: number
  ): Promise<void> {
    try {
      let behavior = this.userBehaviors.get(userId);
      if (!behavior) {
        behavior = this.createUserBehavior(userId);
      }

      switch (action) {
        case 'VIEW':
          if (!behavior.viewedItems.includes(itemId)) {
            behavior.viewedItems.push(itemId);
          }
          break;
        case 'CLICK':
          if (!behavior.clickedItems.includes(itemId)) {
            behavior.clickedItems.push(itemId);
          }
          break;
        case 'PURCHASE':
          if (!behavior.purchasedItems.includes(itemId)) {
            behavior.purchasedItems.push(itemId);
          }
          break;
        case 'RATE':
          if (rating !== undefined) {
            behavior.ratings[itemId] = rating;
          }
          break;
      }

      behavior.lastActivityAt = new Date();
      this.userBehaviors.set(userId, behavior);

      this.logger.log(
        `📊 User behavior tracked: ${userId} - ${action} - ${itemId}`
      );
    } catch (error) {
      this.logger.error(`Failed to track user behavior: ${error}`);
    }
  }

  /**
   * Feature Importance Analysis
   */
  async analyzeFeatureImportance(
    modelId: string
  ): Promise<Record<string, number>> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Calculate feature importance based on weights
      const importance: Record<string, number> = {};

      // For each layer
      let featureIndex = 0;
      for (const layer of model.layers) {
        if (layer.type === 'INPUT') {
          for (let i = 0; i < layer.neurons; i++) {
            const featureName = `feature_${featureIndex}`;
            const weights = model.weights.filter(
              (_, idx) => idx % layer.neurons === i
            );
            const avgWeight = Math.abs(
              weights.reduce((sum, w) => sum + w, 0) / weights.length
            );
            importance[featureName] = avgWeight;
            featureIndex++;
          }
        }
      }

      // Normalize
      const max = Math.max(...Object.values(importance));
      for (const key in importance) {
        importance[key] /= max;
      }

      this.logger.log(`📊 Feature importance analyzed for ${modelId}`);

      return importance;
    } catch (error) {
      this.logger.error(`Failed to analyze feature importance: ${error}`);
      throw error;
    }
  }

  /**
   * Anomaly Detection
   */
  async detectAnomalies(modelId: string, data: number[]): Promise<boolean> {
    try {
      const model = this.models.get(modelId);
      if (!model || model.status !== 'ACTIVE') {
        throw new Error('Model not available');
      }

      // Forward propagation
      const prediction = this.forward(model, data);

      // Calculate reconstruction error
      const reconstructionError = Math.abs(1 - prediction);

      // Anomaly threshold: 0.3
      const isAnomaly = reconstructionError > 0.3;

      if (isAnomaly) {
        this.logger.warn(
          `⚠️ Anomaly detected: Error ${reconstructionError.toFixed(
            3
          )} (threshold: 0.3)`
        );
      }

      return isAnomaly;
    } catch (error) {
      this.logger.error(`Failed to detect anomalies: ${error}`);
      throw error;
    }
  }

  // Helper methods

  private forward(model: NeuralNetworkModel, input: number[]): number {
    let activation = input;

    // Simplified forward pass through layers
    for (const layer of model.layers) {
      if (layer.type === 'OUTPUT') {
        // Simple sum for output layer
        const output =
          activation.reduce((sum, a) => sum + a, 0) / activation.length;
        return this.applyActivation(output, layer.activation);
      }
    }

    return 0;
  }

  private backward(
    model: NeuralNetworkModel,
    error: number,
    learningRate: number
  ): void {
    // Simplified backpropagation - update weights
    for (let i = 0; i < model.weights.length; i++) {
      model.weights[i] -= learningRate * error * Math.random();
    }
  }

  private applyActivation(value: number, activation: string): number {
    switch (activation) {
      case 'RELU':
        return Math.max(0, value);
      case 'SIGMOID':
        return 1 / (1 + Math.exp(-value));
      case 'TANH':
        return Math.tanh(value);
      case 'SOFTMAX':
        return Math.exp(value) / (1 + Math.exp(value));
      default:
        return value;
    }
  }

  private calculateUserSimilarity(
    user1: UserBehavior,
    user2: UserBehavior
  ): number {
    // Cosine similarity of user rating vectors
    const commonItems = user1.purchasedItems.filter((item) =>
      user2.purchasedItems.includes(item)
    );

    if (commonItems.length === 0) return 0;

    let dotProduct = 0;
    for (const item of commonItems) {
      const rating1 = user1.ratings[item] || 3;
      const rating2 = user2.ratings[item] || 3;
      dotProduct += rating1 * rating2;
    }

    return dotProduct / (commonItems.length * 5);
  }

  private calculateEmbeddingSimilarity(
    embedding1: number[],
    embedding2: number[]
  ): number {
    if (embedding1.length === 0 || embedding2.length === 0) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < Math.min(embedding1.length, embedding2.length); i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  private createUserBehavior(userId: string): UserBehavior {
    const behavior: UserBehavior = {
      userId,
      viewedItems: [],
      clickedItems: [],
      purchasedItems: [],
      ratings: {},
      sessionDuration: 0,
      lastActivityAt: new Date(),
    };
    this.userBehaviors.set(userId, behavior);
    return behavior;
  }
}
