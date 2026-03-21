/**
 * Multi-Factor Authentication (MFA) Service
 * Provides Time-based One-Time Password (TOTP) support for enhanced security
 * Implements RFC 6238 for TOTP generation and validation
 * Critical for PCI DSS compliance and regulatory requirements
 */

import { Injectable, Logger } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerification {
  isValid: boolean;
  remainingAttempts?: number;
}

@Injectable()
export class MFAService {
  private readonly logger = new Logger(MFAService.name);
  private readonly APP_NAME = 'Going Platform';
  private readonly WINDOW = 2; // Accept tokens from ±2 time windows

  /**
   * Generate MFA setup (secret + QR code)
   * Returns secret and QR code for scanning with authenticator app
   */
  async generateMFASetup(userId: string, email: string): Promise<MFASetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.APP_NAME} (${email})`,
        issuer: this.APP_NAME,
        length: 32, // 256-bit secret (strong)
      });

      // Generate QR code for scanning
      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes (10 codes of 8 characters each)
      const backupCodes = this.generateBackupCodes(10);

      this.logger.log(`MFA setup generated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate MFA setup: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Verify TOTP token
   * Validates 6-digit codes from authenticator apps
   */
  verifyTOTP(secret: string, token: string): boolean {
    try {
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.WINDOW, // Accept ±2 time windows (60-90 seconds drift)
      });

      if (isValid) {
        this.logger.debug('TOTP verification successful');
      } else {
        this.logger.warn('TOTP verification failed - invalid token');
      }

      return isValid;
    } catch (error) {
      this.logger.error(
        `TOTP verification error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  /**
   * Verify backup code
   * Single-use backup codes for account recovery
   */
  verifyBackupCode(storedBackupCodes: string[], code: string): boolean {
    const trimmedCode = code.replace(/\s/g, '').toUpperCase();

    if (storedBackupCodes.includes(trimmedCode)) {
      this.logger.log('Backup code verified successfully');
      return true;
    }

    this.logger.warn('Backup code verification failed');
    return false;
  }

  /**
   * Mark backup code as used (remove from list)
   */
  markBackupCodeAsUsed(backupCodes: string[], code: string): string[] {
    const trimmedCode = code.replace(/\s/g, '').toUpperCase();
    return backupCodes.filter((c) => c !== trimmedCode);
  }

  /**
   * Generate new TOTP token for testing/debugging
   * Only use in development mode
   */
  generateTOTPToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  }

  /**
   * Generate backup codes for recovery
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = this.generateRandomCode(8);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate random code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}
