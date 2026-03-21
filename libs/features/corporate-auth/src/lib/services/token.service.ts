import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService } from '../../interfaces/corporate-auth.service';

/**
 * Token Service
 * Manages JWT token generation and verification
 */
@Injectable()
export class TokenService implements ITokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private jwtService: JwtService) {}

  /**
   * Generate JWT token
   */
  generateToken(payload: any, expiresIn: string = '1h'): string {
    try {
      return this.jwtService.sign(payload, { expiresIn });
    } catch (error) {
      this.logger.error(`Failed to generate token:`, error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error(`Token verification failed:`, error);
      throw error;
    }
  }

  /**
   * Decode JWT token without verification
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      this.logger.error(`Token decode failed:`, error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): string {
    try {
      const payload = { userId, type: 'refresh' };
      return this.jwtService.sign(payload, { expiresIn: '7d' });
    } catch (error) {
      this.logger.error(`Failed to generate refresh token:`, error);
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): any {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      this.logger.error(`Refresh token verification failed:`, error);
      throw error;
    }
  }

  /**
   * Generate access token pair
   */
  generateTokenPair(
    userId: string,
    companyId: string,
    role: string
  ): { accessToken: string; refreshToken: string } {
    try {
      const accessToken = this.generateToken(
        { userId, companyId, role, type: 'access' },
        '1h'
      );
      const refreshToken = this.generateRefreshToken(userId);

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`Failed to generate token pair:`, error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string): { accessToken: string } {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      const newAccessToken = this.generateToken(
        { userId: payload.userId, type: 'access' },
        '1h'
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.error(`Token refresh failed:`, error);
      throw error;
    }
  }
}
