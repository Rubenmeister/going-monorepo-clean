import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ICorporateUser,
  CorporateUserRole,
  UserStatus,
} from '../../interfaces/corporate-user.interface';

/**
 * Corporate User Service
 * Manages corporate users with database persistence
 * Provides user lookup for RBAC and authentication
 */
@Injectable()
export class CorporateUserService {
  private readonly logger = new Logger(CorporateUserService.name);

  /**
   * In-memory fallback for users when MongoDB is not available
   * This allows the service to work in development/testing
   * In production, MongoDB collection 'corporate_users' should be used
   */
  private readonly fallbackUsers = new Map<string, ICorporateUser>();

  constructor(
    @InjectModel('CorporateUser') private readonly userModel?: Model<any>
  ) {
    this.initializeFallbackUsers();
  }

  /**
   * Get user by ID
   * Tries database first, falls back to memory
   */
  async getUserById(userId: string): Promise<ICorporateUser | null> {
    try {
      if (this.userModel) {
        const user = await this.userModel.findOne({ userId }).lean();
        if (user) return this.mapToICorporateUser(user);
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch user from database: ${error.message}`);
    }

    return this.fallbackUsers.get(userId) || null;
  }

  /**
   * Get user by email
   * Tries database first, falls back to memory
   */
  async getUserByEmail(email: string): Promise<ICorporateUser | null> {
    try {
      if (this.userModel) {
        const user = await this.userModel.findOne({ email }).lean();
        if (user) return this.mapToICorporateUser(user);
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch user from database: ${error.message}`);
    }

    // Fallback to in-memory search
    for (const user of this.fallbackUsers.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  /**
   * Get all users for a company
   */
  async getUsersByCompany(companyId: string): Promise<ICorporateUser[]> {
    try {
      if (this.userModel) {
        const users = await this.userModel.find({ companyId }).lean().exec();
        return users.map((u) => this.mapToICorporateUser(u));
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch company users from database: ${error.message}`
      );
    }

    // Fallback to in-memory search
    const result: ICorporateUser[] = [];
    for (const user of this.fallbackUsers.values()) {
      if (user.companyId === companyId) result.push(user);
    }
    return result;
  }

  /**
   * Create a new user
   */
  async createUser(user: ICorporateUser): Promise<ICorporateUser> {
    try {
      if (this.userModel) {
        const doc = new this.userModel(user);
        const saved = await doc.save();
        return this.mapToICorporateUser(saved);
      }
    } catch (error) {
      this.logger.error(`Failed to create user in database: ${error.message}`);
      // Continue to fallback
    }

    // Fallback: store in memory
    this.fallbackUsers.set(user.userId, user);
    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    role: CorporateUserRole
  ): Promise<ICorporateUser | null> {
    try {
      if (this.userModel) {
        const user = await this.userModel
          .findOneAndUpdate(
            { userId },
            { role, updatedAt: new Date() },
            { new: true }
          )
          .lean();
        if (user) return this.mapToICorporateUser(user);
      }
    } catch (error) {
      this.logger.error(`Failed to update user in database: ${error.message}`);
      // Continue to fallback
    }

    // Fallback: update in memory
    const user = this.fallbackUsers.get(userId);
    if (user) {
      user.role = role;
      user.updatedAt = new Date();
      return user;
    }
    return null;
  }

  /**
   * Suspend a user
   */
  async suspendUser(userId: string): Promise<ICorporateUser | null> {
    return this.updateUserStatus(userId, UserStatus.SUSPENDED);
  }

  /**
   * Activate a user
   */
  async activateUser(userId: string): Promise<ICorporateUser | null> {
    return this.updateUserStatus(userId, UserStatus.ACTIVE);
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(userId: string): Promise<ICorporateUser | null> {
    return this.updateUserStatus(userId, UserStatus.INACTIVE);
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, role: CorporateUserRole): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    return user.role === role;
  }

  /**
   * Check if user is active
   */
  async isUserActive(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    return user.status === UserStatus.ACTIVE;
  }

  /**
   * Check if user belongs to company
   */
  async userBelongsToCompany(
    userId: string,
    companyId: string
  ): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    return user.companyId === companyId;
  }

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  /**
   * Update user status
   */
  private async updateUserStatus(
    userId: string,
    status: UserStatus
  ): Promise<ICorporateUser | null> {
    try {
      if (this.userModel) {
        const user = await this.userModel
          .findOneAndUpdate(
            { userId },
            { status, updatedAt: new Date() },
            { new: true }
          )
          .lean();
        if (user) return this.mapToICorporateUser(user);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update user status in database: ${error.message}`
      );
    }

    // Fallback: update in memory
    const user = this.fallbackUsers.get(userId);
    if (user) {
      user.status = status;
      user.updatedAt = new Date();
      return user;
    }
    return null;
  }

  /**
   * Map database document to ICorporateUser interface
   */
  private mapToICorporateUser(doc: any): ICorporateUser {
    return {
      userId: doc.userId || doc._id,
      companyId: doc.companyId,
      email: doc.email,
      fullName: doc.fullName,
      role: doc.role || CorporateUserRole.EMPLOYEE,
      department: doc.department,
      status: doc.status || UserStatus.ACTIVE,
      mfaEnabled: doc.mfaEnabled || false,
      mfaSecret: doc.mfaSecret,
      ssoProvider: doc.ssoProvider || 'none',
      ssoId: doc.ssoId,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  /**
   * Initialize fallback users for development/testing
   * These can be overridden by database users in production
   */
  private initializeFallbackUsers(): void {
    const fallbackData: ICorporateUser[] = [
      {
        userId: 'admin-001',
        companyId: 'company-acme',
        email: 'admin@acme.com',
        fullName: 'Admin User',
        role: CorporateUserRole.SUPER_ADMIN,
        department: 'Administration',
        status: UserStatus.ACTIVE,
        mfaEnabled: true,
        ssoProvider: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 'manager-001',
        companyId: 'company-acme',
        email: 'manager@acme.com',
        fullName: 'Manager User',
        role: CorporateUserRole.MANAGER,
        department: 'Management',
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
        ssoProvider: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 'emp-456',
        companyId: 'company-acme',
        email: 'john@acme.com',
        fullName: 'John Doe',
        role: CorporateUserRole.EMPLOYEE,
        department: 'Operations',
        status: UserStatus.ACTIVE,
        mfaEnabled: false,
        ssoProvider: 'none',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const user of fallbackData) {
      this.fallbackUsers.set(user.userId, user);
    }
  }
}
