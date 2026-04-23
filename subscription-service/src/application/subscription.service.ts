import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionRepository } from '../infrastructure/persistence/subscription.repository';

export const PLANS = {
  basic: {
    id: 'basic',
    name: 'Básico',
    description: 'Para usuarios frecuentes',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Sin costo mensual',
      '5% de descuento en viajes',
      'Historial de viajes',
    ],
    discount: 0.05,
    priorityMatching: false,
    maxMonthlyRides: 10,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Para viajeros habituales',
    price: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      '$9.99/mes',
      '15% de descuento en todos los viajes',
      'Prioridad en asignación de conductores',
      'Soporte prioritario 24/7',
      'Viajes ilimitados',
    ],
    discount: 0.15,
    priorityMatching: true,
    maxMonthlyRides: null,
  },
  corporate: {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Para empresas',
    price: 49.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      '$49.99/mes',
      '20% de descuento en todos los viajes',
      'Facturación corporativa',
      'Panel de gestión de equipo',
      'API de integración',
      'Hasta 50 usuarios',
    ],
    discount: 0.20,
    priorityMatching: true,
    maxMonthlyRides: null,
    teamManagement: true,
  },
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  getPlans() {
    return { plans: Object.values(PLANS) };
  }

  async getSubscription(userId: string) {
    const sub = await this.subscriptionRepository.findByUserId(userId);
    if (!sub) {
      return { userId, subscription: null, plan: PLANS.basic, status: 'none' };
    }
    return { userId, subscription: sub, plan: PLANS[sub.planId] ?? PLANS.basic, status: sub.status };
  }

  async subscribe(userId: string, planId: string, paymentReference?: string): Promise<any> {
    if (!PLANS[planId]) throw new BadRequestException(`Plan '${planId}' no existe`);

    // Cancel any existing active subscription
    await this.subscriptionRepository.cancel(userId);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const sub = await this.subscriptionRepository.create({
      userId,
      planId,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true,
      paymentReference,
    });

    this.logger.log(`User ${userId} subscribed to ${planId}`);
    return { success: true, subscription: sub, plan: PLANS[planId] };
  }

  async cancel(userId: string): Promise<any> {
    const cancelled = await this.subscriptionRepository.cancel(userId);
    if (!cancelled) throw new NotFoundException('No active subscription found');
    return { success: true, message: 'Suscripción cancelada' };
  }

  async getAllSubscriptions(limit = 50, offset = 0): Promise<any> {
    const subs = await this.subscriptionRepository.findAll(limit, offset);
    return { subscriptions: subs, total: subs.length };
  }
}
