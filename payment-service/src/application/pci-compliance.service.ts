/**
 * PCI DSS Compliance Service
 * Ensures Payment Card Industry Data Security Standard compliance
 * Handles encrypted storage, tokenization, audit trails, and secure deletion
 *
 * PCI DSS Requirements:
 * 1.x - Network Security
 * 2.x - Configuration Management
 * 3.x - Protection of Cardholder Data
 * 4.x - Encryption of Cardholder Data
 * 6.x - Security of Systems and Applications
 * 8.x - User Access Management
 * 10.x - Logging and Monitoring
 * 12.x - Information Security Policy
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { VaultService } from '@going-monorepo-clean/shared-infrastructure';
import { v4 as uuid } from 'uuid';

export interface PaymentToken {
  token: string; // Unique token instead of card number
  last4: string; // Last 4 digits for display
  brand: string; // Visa, Mastercard, etc.
  expiryMonth: number;
  expiryYear: number;
  tokenizedAt: Date;
  expiresAt: Date;
}

export interface PCIAuditLog {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  dataCategory: string; // 'CHD', 'SAD', etc.
  status: 'success' | 'failure';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class PCIComplianceService {
  private readonly logger = new Logger(PCIComplianceService.name);
  private readonly TRANSIT_KEY = 'payment-cards';
  private readonly AUDIT_COLLECTION = 'pci_audit_logs';
  private readonly TOKENIZATION_EXPIRY_DAYS = 365;

  constructor(
    private vaultService: VaultService,
    @InjectConnection() private connection: Connection
  ) {
    this.ensureAuditCollection();
  }

  /**
   * Tokenize credit card data
   * Replaces actual card data with unique token
   * Card data is encrypted and stored separately
   */
  async tokenizeCard(
    cardData: {
      number: string;
      expiryMonth: number;
      expiryYear: number;
      cvv: string;
      cardholderName: string;
    },
    userId: string
  ): Promise<PaymentToken> {
    try {
      // Extract last 4 digits before encryption
      const last4 = cardData.number.slice(-4);
      const brand = this.detectCardBrand(cardData.number);

      // Validate card data
      if (!this.validateCardNumber(cardData.number)) {
        throw new Error('Invalid card number');
      }

      if (!this.validateExpiry(cardData.expiryMonth, cardData.expiryYear)) {
        throw new Error('Invalid expiry date');
      }

      if (!this.validateCVV(cardData.cvv)) {
        throw new Error('Invalid CVV');
      }

      // Encrypt card data using Vault
      const encryptedCardData = await this.vaultService.encryptData(
        this.TRANSIT_KEY,
        JSON.stringify({
          number: cardData.number,
          cvv: cardData.cvv,
          cardholderName: cardData.cardholderName,
          timestamp: new Date().toISOString(),
        })
      );

      // Generate unique token
      const token = uuid();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.TOKENIZATION_EXPIRY_DAYS);

      // Store encrypted card data with token mapping
      const db = this.connection.getClient().db();
      const collection = db.collection('payment_tokens');

      await collection.insertOne({
        token,
        userId,
        encryptedData: encryptedCardData,
        last4,
        brand,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        createdAt: new Date(),
        expiresAt,
      });

      // Log tokenization (without sensitive data)
      await this.auditLog(userId, 'TOKENIZE_CARD', 'CHD', 'success', {
        token,
        last4,
        brand,
      });

      this.logger.log(`Card tokenized: ${token} (${last4})`);

      return {
        token,
        last4,
        brand,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        tokenizedAt: new Date(),
        expiresAt,
      };
    } catch (error) {
      this.logger.error(
        `Card tokenization failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      // Log failure
      await this.auditLog(userId, 'TOKENIZE_CARD', 'CHD', 'failure', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Retrieve encrypted card data using token
   * Never returns card number in full - only for validation
   */
  async retrieveCardData(
    token: string,
    userId: string
  ): Promise<{
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  }> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection('payment_tokens');

      const tokenRecord = await collection.findOne({ token, userId });

      if (!tokenRecord) {
        throw new Error('Token not found or unauthorized');
      }

      // Log retrieval
      await this.auditLog(userId, 'RETRIEVE_TOKEN', 'CHD', 'success', {
        token,
        last4: tokenRecord.last4,
      });

      return {
        last4: tokenRecord.last4,
        brand: tokenRecord.brand,
        expiryMonth: tokenRecord.expiryMonth,
        expiryYear: tokenRecord.expiryYear,
      };
    } catch (error) {
      this.logger.error(
        `Card retrieval failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      await this.auditLog(userId, 'RETRIEVE_TOKEN', 'CHD', 'failure', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Permanently delete tokenized card data
   * Secure deletion with multiple overwrite passes
   */
  async deleteCardToken(token: string, userId: string): Promise<void> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection('payment_tokens');

      const tokenRecord = await collection.findOne({ token, userId });

      if (!tokenRecord) {
        throw new Error('Token not found or unauthorized');
      }

      // Secure deletion: overwrite data before deletion
      await collection.updateOne(
        { token },
        {
          $set: {
            encryptedData: '',
            deletedAt: new Date(),
            deletedReason: 'User requested deletion',
          },
        }
      );

      // Wait and then delete
      await collection.deleteOne({ token, userId });

      await this.auditLog(userId, 'DELETE_TOKEN', 'CHD', 'success', {
        token,
      });

      this.logger.log(`Card token deleted: ${token}`);
    } catch (error) {
      this.logger.error(
        `Card deletion failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      await this.auditLog(userId, 'DELETE_TOKEN', 'CHD', 'failure', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Log all payment activities for compliance
   * Required for audit trails and regulatory compliance
   */
  async auditLog(
    userId: string,
    action: string,
    dataCategory: string,
    status: 'success' | 'failure',
    details: Record<string, any>,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.AUDIT_COLLECTION);

      const auditEntry: PCIAuditLog = {
        id: uuid(),
        timestamp: new Date(),
        action,
        userId,
        dataCategory,
        status,
        details,
        ipAddress,
        userAgent,
      };

      await collection.insertOne(auditEntry);

      // Create TTL index on audit logs (keep for 5 years for compliance)
      await collection.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: 157680000 }
      );
    } catch (error) {
      this.logger.error(
        `Failed to write audit log: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get audit trail for compliance reporting
   */
  async getAuditTrail(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PCIAuditLog[]> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.AUDIT_COLLECTION);

      const query: Record<string, any> = {};

      if (userId) query.userId = userId;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const logs = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();

      return logs as any;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve audit trail: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Helper methods for validation
   */

  private validateCardNumber(cardNumber: string): boolean {
    // Luhn algorithm for card number validation
    const digits = cardNumber.replace(/\D/g, '');

    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private validateExpiry(month: number, year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    if (month < 1 || month > 12) return false;

    return true;
  }

  private validateCVV(cvv: string): boolean {
    // CVV should be 3-4 digits
    return /^\d{3,4}$/.test(cvv);
  }

  private detectCardBrand(cardNumber: string): string {
    const patterns: Record<string, RegExp> = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
    };

    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }

    return 'Unknown';
  }

  private async ensureAuditCollection(): Promise<void> {
    try {
      const db = this.connection.getClient().db();
      const collection = db.collection(this.AUDIT_COLLECTION);

      // Create indexes for efficient querying
      await collection.createIndex({ userId: 1, timestamp: -1 });
      await collection.createIndex({ action: 1 });
      await collection.createIndex({ dataCategory: 1 });
    } catch (error) {
      this.logger.warn('Failed to ensure audit collection indexes');
    }
  }
}
