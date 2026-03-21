/**
 * Vault Configuration Module
 * Integrates with HashiCorp Vault for secrets encryption and management
 * Handles secret rotation, encryption, and compliance requirements
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface VaultConfig {
  address: string;
  token: string;
  namespace?: string;
  tlsCertPath?: string;
  tlsKeyPath?: string;
  tlsCaCertPath?: string;
}

export interface SecretResponse {
  requestId: string;
  leaseId: string;
  renewable: boolean;
  leaseDurationSeconds: number;
  data: Record<string, any>;
  warnings?: string[];
  auth?: {
    clientToken: string;
    accessor: string;
    policies: string[];
    tokenDuration: number;
    renewable: boolean;
  };
}

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private vaultClient: AxiosInstance;
  private config: VaultConfig;
  private tokenRenewInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    this.config = {
      address: this.configService.get('VAULT_ADDR') || 'http://localhost:8200',
      token: this.configService.get('VAULT_TOKEN') || '',
      namespace: this.configService.get('VAULT_NAMESPACE'),
      tlsCertPath: this.configService.get('VAULT_TLS_CERT_PATH'),
      tlsKeyPath: this.configService.get('VAULT_TLS_KEY_PATH'),
      tlsCaCertPath: this.configService.get('VAULT_TLS_CA_CERT_PATH'),
    };

    // Initialize Axios client
    this.vaultClient = axios.create({
      baseURL: this.config.address,
      headers: {
        'X-Vault-Token': this.config.token,
        ...(this.config.namespace && {
          'X-Vault-Namespace': this.config.namespace,
        }),
      },
      timeout: 10000,
    });
  }

  /**
   * Initialize Vault service and setup token renewal
   */
  async onModuleInit() {
    try {
      await this.validateConnection();
      this.setupTokenRenewal();
      this.logger.log('✅ Vault connection established and validated');
    } catch (error) {
      this.logger.error(
        `❌ Failed to initialize Vault: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      if (this.configService.get('NODE_ENV') === 'production') {
        throw error;
      }
    }
  }

  /**
   * Get secret from Vault KV store
   */
  async getSecret(path: string): Promise<Record<string, any>> {
    try {
      const response = await this.vaultClient.get<SecretResponse>(
        `/v1/secret/data/${path}`
      );
      return response.data.data.data;
    } catch (error) {
      this.logger.error(`Failed to retrieve secret ${path}`);
      throw error;
    }
  }

  /**
   * Write secret to Vault
   */
  async writeSecret(path: string, data: Record<string, any>): Promise<void> {
    try {
      await this.vaultClient.post(`/v1/secret/data/${path}`, {
        data,
      });
      this.logger.debug(`Secret written to ${path}`);
    } catch (error) {
      this.logger.error(`Failed to write secret ${path}`);
      throw error;
    }
  }

  /**
   * Delete secret from Vault
   */
  async deleteSecret(path: string): Promise<void> {
    try {
      await this.vaultClient.delete(`/v1/secret/data/${path}`);
      this.logger.debug(`Secret deleted from ${path}`);
    } catch (error) {
      this.logger.error(`Failed to delete secret ${path}`);
      throw error;
    }
  }

  /**
   * Get database credentials with automatic rotation
   */
  async getDatabaseCredentials(
    role: string
  ): Promise<{ username: string; password: string }> {
    try {
      const response = await this.vaultClient.get<SecretResponse>(
        `/v1/database/creds/${role}`
      );
      return {
        username: response.data.data.data.username,
        password: response.data.data.data.password,
      };
    } catch (error) {
      this.logger.error(`Failed to get database credentials for role ${role}`);
      throw error;
    }
  }

  /**
   * Get encryption key for data encryption
   */
  async getEncryptionKey(keyName: string): Promise<string> {
    try {
      const secret = await this.getSecret(`encryption-keys/${keyName}`);
      return secret.key;
    } catch (error) {
      this.logger.error(`Failed to get encryption key ${keyName}`);
      throw error;
    }
  }

  /**
   * Encrypt data using Vault's transit engine
   */
  async encryptData(transitKey: string, plaintext: string): Promise<string> {
    try {
      const encodedData = Buffer.from(plaintext).toString('base64');
      const response = await this.vaultClient.post<any>(
        `/v1/transit/encrypt/${transitKey}`,
        { plaintext: encodedData }
      );
      return response.data.data.ciphertext;
    } catch (error) {
      this.logger.error(`Failed to encrypt data with key ${transitKey}`);
      throw error;
    }
  }

  /**
   * Decrypt data using Vault's transit engine
   */
  async decryptData(transitKey: string, ciphertext: string): Promise<string> {
    try {
      const response = await this.vaultClient.post<any>(
        `/v1/transit/decrypt/${transitKey}`,
        { ciphertext }
      );
      return Buffer.from(response.data.data.plaintext, 'base64').toString();
    } catch (error) {
      this.logger.error(`Failed to decrypt data with key ${transitKey}`);
      throw error;
    }
  }

  /**
   * Generate OTP for MFA
   */
  async generateOTP(otpName: string): Promise<string> {
    try {
      const response = await this.vaultClient.post<any>(
        `/v1/totp/code/${otpName}`,
        {}
      );
      return response.data.data.code;
    } catch (error) {
      this.logger.error(`Failed to generate OTP for ${otpName}`);
      throw error;
    }
  }

  /**
   * Validate OTP
   */
  async validateOTP(otpName: string, code: string): Promise<boolean> {
    try {
      const response = await this.vaultClient.post<any>(
        `/v1/totp/validate/${otpName}`,
        { code }
      );
      return response.data.data.valid === true;
    } catch (error) {
      this.logger.error(`Failed to validate OTP for ${otpName}`);
      return false;
    }
  }

  /**
   * Private helper methods
   */

  private async validateConnection(): Promise<void> {
    try {
      const response = await this.vaultClient.get('/v1/sys/health');
      if (response.status !== 200) {
        throw new Error(
          `Vault health check failed with status ${response.status}`
        );
      }
    } catch (error) {
      throw new Error(
        `Vault connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private setupTokenRenewal(): void {
    // Renew token every 1 hour
    this.tokenRenewInterval = setInterval(async () => {
      try {
        const response = await this.vaultClient.post<SecretResponse>(
          '/v1/auth/token/renew-self',
          {}
        );
        if (response.data.auth?.clientToken) {
          this.vaultClient.defaults.headers['X-Vault-Token'] =
            response.data.auth.clientToken;
          this.logger.debug('Token renewed successfully');
        }
      } catch (error) {
        this.logger.error('Failed to renew Vault token');
      }
    }, 3600000); // 1 hour
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.tokenRenewInterval) {
      clearInterval(this.tokenRenewInterval);
    }
  }
}
