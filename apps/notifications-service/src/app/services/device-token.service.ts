import { Injectable, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { PrismaService } from '@going-monorepo-clean/prisma-client';

export interface RegisterDeviceTokenDto {
  userId: string;
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
}

export interface DeviceTokenResult {
  id: string;
  userId: string;
  platform: string;
  createdAt: Date;
}

@Injectable()
export class DeviceTokenService {
  private readonly logger = new Logger(DeviceTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new device token for a user
   * If the token already exists, update it with the new userId (device changed hands)
   */
  async register(dto: RegisterDeviceTokenDto): Promise<Result<DeviceTokenResult, Error>> {
    const { userId, token, platform } = dto;

    try {
      // Upsert - update if token exists, create if not
      const deviceToken = await this.prisma.deviceToken.upsert({
        where: { token },
        update: {
          userId,
          platform,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          token,
          platform,
          isActive: true,
        },
      });

      this.logger.log(`Registered device token for user ${userId} on ${platform}`);

      return ok({
        id: deviceToken.id,
        userId: deviceToken.userId,
        platform: deviceToken.platform,
        createdAt: deviceToken.createdAt,
      });
    } catch (error) {
      this.logger.error(`Failed to register device token: ${(error as Error).message}`);
      return err(error as Error);
    }
  }

  /**
   * Unregister/deactivate a device token
   */
  async unregister(token: string): Promise<Result<void, Error>> {
    try {
      await this.prisma.deviceToken.update({
        where: { token },
        data: { isActive: false },
      });

      this.logger.log(`Unregistered device token: ${token.substring(0, 20)}...`);
      return ok(undefined);
    } catch (error) {
      // Token might not exist, which is fine
      this.logger.warn(`Token not found for unregistration: ${token.substring(0, 20)}...`);
      return ok(undefined);
    }
  }

  /**
   * Get all active device tokens for a user
   */
  async getTokensForUser(userId: string): Promise<DeviceTokenResult[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        platform: true,
        createdAt: true,
      },
    });

    return tokens;
  }

  /**
   * Remove all tokens for a user (e.g., on logout from all devices)
   */
  async removeAllForUser(userId: string): Promise<Result<number, Error>> {
    try {
      const result = await this.prisma.deviceToken.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      this.logger.log(`Deactivated ${result.count} device tokens for user ${userId}`);
      return ok(result.count);
    } catch (error) {
      this.logger.error(`Failed to remove tokens for user ${userId}`);
      return err(error as Error);
    }
  }
}
