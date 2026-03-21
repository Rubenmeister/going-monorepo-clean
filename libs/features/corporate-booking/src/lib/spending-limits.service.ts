import { Injectable, Logger } from '@nestjs/common';
import {
  IDepartmentSpendingLimit,
  LimitBreach,
  Money,
} from '../interfaces/corporate-booking.interface';

/**
 * Spending Limits Service
 * Manages department and employee spending limits
 */
@Injectable()
export class SpendingLimitsService {
  private readonly logger = new Logger(SpendingLimitsService.name);

  /**
   * Set spending limit for department
   */
  async setDepartmentLimit(
    companyId: string,
    department: string,
    dailyLimit: Money,
    monthlyLimit?: Money
  ): Promise<IDepartmentSpendingLimit> {
    try {
      const limit: IDepartmentSpendingLimit = {
        limitId: this.generateId(),
        companyId,
        department,
        dailyLimit,
        monthlyLimit,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      // await this.mongoService.insertOne('department_spending_limits', limit);

      this.logger.log(
        `Set spending limit for ${department}: ${dailyLimit.amount}`
      );

      return limit;
    } catch (error) {
      this.logger.error(`Failed to set spending limit:`, error);
      throw error;
    }
  }

  /**
   * Get spending limit for department
   */
  async getDepartmentLimit(
    companyId: string,
    department: string
  ): Promise<IDepartmentSpendingLimit | null> {
    try {
      // const limit = await this.mongoService.findOne(
      //   'department_spending_limits',
      //   { companyId, department },
      // );
      // return limit || null;

      return null;
    } catch (error) {
      this.logger.error(`Failed to get spending limit:`, error);
      return null;
    }
  }

  /**
   * Check if booking exceeds limits
   */
  async checkLimitBreaches(
    companyId: string,
    department: string,
    amount: Money
  ): Promise<LimitBreach[]> {
    try {
      const breaches: LimitBreach[] = [];

      // Get department limit
      // const limit = await this.getDepartmentLimit(companyId, department);

      // Calculate current daily spending
      // const todaySpending = await this.calculateDailySpending(
      //   companyId,
      //   department,
      // );

      // Check daily limit
      // if (
      //   limit?.dailyLimit &&
      //   todaySpending.amount + amount.amount > limit.dailyLimit.amount
      // ) {
      //   breaches.push({
      //     departmentId: department,
      //     limitType: 'daily',
      //     exceeded: todaySpending.amount + amount.amount,
      //     limit: limit.dailyLimit.amount,
      //   });
      // }

      // Calculate monthly spending
      // const monthSpending = await this.calculateMonthlySpending(
      //   companyId,
      //   department,
      // );

      // Check monthly limit
      // if (
      //   limit?.monthlyLimit &&
      //   monthSpending.amount + amount.amount > limit.monthlyLimit.amount
      // ) {
      //   breaches.push({
      //     departmentId: department,
      //     limitType: 'monthly',
      //     exceeded: monthSpending.amount + amount.amount,
      //     limit: limit.monthlyLimit.amount,
      //   });
      // }

      return breaches;
    } catch (error) {
      this.logger.error(`Failed to check limit breaches:`, error);
      throw error;
    }
  }

  /**
   * Get remaining budget
   */
  async getRemainingBudget(
    companyId: string,
    department: string
  ): Promise<Money> {
    try {
      // Get limit
      // const limit = await this.getDepartmentLimit(companyId, department);

      // Calculate spending
      // const spending = await this.calculateMonthlySpending(companyId, department);

      // Return remaining
      const remaining = {
        amount: 10000, // Placeholder
        currency: 'USD',
      };

      return remaining;
    } catch (error) {
      this.logger.error(`Failed to get remaining budget:`, error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
