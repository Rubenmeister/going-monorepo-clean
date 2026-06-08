import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { ok, err } from 'neverthrow';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  OAuthLoginUseCase,
  ITokenManager,
} from '@going-monorepo-clean/domains-user-core';
import { AuditLogService } from '@going-monorepo-clean/domains-audit-application';
import { AccountLockoutService } from '../application/account-lockout.service';
import { OauthStateService } from '../infrastructure/oauth/oauth-state.service';
import { UserModelSchema } from '../infrastructure/user.schema';
import { LoyaltyPointsService } from '../application/loyalty-points.service';
import { MfaService } from '../application/mfa.service';

/**
 * Auth Controller Integration Tests
 * Tests token refresh, logout, and authentication flows
 */
describe('AuthController (Integration)', () => {
  let controller: AuthController;
  let mockTokenManager: any;
  let mockRegisterUseCase: any;
  let mockLoginUseCase: any;

  beforeEach(async () => {
    // Mock TokenManager
    mockTokenManager = {
      createTokenPair: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokens: jest.fn(),
      revokeAccessToken: jest.fn(),
    };

    mockRegisterUseCase = { execute: jest.fn() };
    mockLoginUseCase = { execute: jest.fn() };

    // Stub genérico para las dependencias colaboradoras que el controller
    // recibió en refactors posteriores; los tests de refresh/logout no las
    // ejercitan, pero Nest exige que estén resueltas.
    const stub = () => ({}) as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // El token real es la CLASE (no el string).
        { provide: RegisterUserUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUserUseCase, useValue: mockLoginUseCase },
        { provide: OAuthLoginUseCase, useValue: { execute: jest.fn() } },
        // ITokenManager es un Symbol.
        { provide: ITokenManager, useValue: mockTokenManager },
        { provide: AuditLogService, useValue: { recordFailure: jest.fn(), recordSuccess: jest.fn() } },
        {
          provide: AccountLockoutService,
          useValue: {
            isAccountLocked: jest.fn(),
            getLockoutExpiration: jest.fn(),
            recordFailedAttempt: jest.fn(),
            recordSuccessfulLogin: jest.fn(),
          },
        },
        { provide: OauthStateService, useValue: { validateReturnTo: jest.fn(), verify: jest.fn() } },
        {
          provide: getModelToken(UserModelSchema.name),
          useValue: {
            // getCurrentUser enriquece con notificationPreferences vía
            // findOne().select().lean(); el mock devuelve null (→ {}).
            findOne: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
              }),
            }),
          },
        },
        { provide: LoyaltyPointsService, useValue: { award: jest.fn(), getBalance: jest.fn(), redeem: jest.fn() } },
        { provide: MfaService, useValue: { verifyChallenge: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const newAccessToken = 'new-access-token';

      mockTokenManager.refreshAccessToken.mockResolvedValue(
        ok({
          accessToken: newAccessToken,
          expiresIn: 900,
        }),
      );

      // Act
      const result = await controller.refreshToken({ refreshToken });

      // Assert
      expect(result).toEqual({
        accessToken: newAccessToken,
        expiresIn: 900,
      });
      expect(mockTokenManager.refreshAccessToken).toHaveBeenCalledWith(
        refreshToken,
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      // Arrange
      const refreshToken = 'expired-token';

      mockTokenManager.refreshAccessToken.mockResolvedValue(
        err(new Error('Refresh token expired')),
      );

      // Act & Assert
      await expect(
        controller.refreshToken({ refreshToken }),
      ).rejects.toThrow('Refresh token expired');
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      // Arrange
      const refreshToken = 'revoked-token';

      mockTokenManager.refreshAccessToken.mockResolvedValue(
        err(new Error('Refresh token revoked')),
      );

      // Act & Assert
      await expect(
        controller.refreshToken({ refreshToken }),
      ).rejects.toThrow('Refresh token revoked');
    });

    it('should throw BadRequestException if refresh token is missing', async () => {
      // Act & Assert
      await expect(
        controller.refreshToken({ refreshToken: '' }),
      ).rejects.toThrow('Refresh token is required');
    });
  });

  describe('POST /auth/logout', () => {
    it('should revoke all refresh tokens on logout', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const accessToken = 'access-token-123';

      mockTokenManager.revokeAllRefreshTokens.mockResolvedValue(ok(2));
      mockTokenManager.revokeAccessToken.mockResolvedValue(ok(undefined));

      // Act
      const result = await controller.logout(userId, accessToken);

      // Assert
      expect(result).toEqual({
        message: 'Logout successful',
        tokensRevoked: 2,
      });
      expect(mockTokenManager.revokeAllRefreshTokens).toHaveBeenCalledWith(
        userId,
        'logout',
      );
      expect(mockTokenManager.revokeAccessToken).toHaveBeenCalledWith(
        accessToken,
        userId,
        'logout',
      );
    });

    it('should revoke specific refresh token', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const accessToken = 'access-token-123';
      const refreshToken = 'refresh-token-456';

      mockTokenManager.revokeRefreshToken.mockResolvedValue(ok(undefined));
      mockTokenManager.revokeAccessToken.mockResolvedValue(ok(undefined));

      // Act
      const result = await controller.logout(userId, accessToken, {
        refreshToken,
      });

      // Assert
      expect(result).toEqual({
        message: 'Logout successful',
        tokensRevoked: 1,
      });
      expect(mockTokenManager.revokeRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
    });

    it('should throw UnauthorizedException if user context missing', async () => {
      // Act & Assert
      await expect(
        controller.logout(undefined as any, 'token'),
      ).rejects.toThrow('User context required');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user info', async () => {
      // Arrange
      const userId = 'user-123' as any;
      const email = 'user@example.com';
      const roles = ['user', 'host'];

      // Act
      const result = await controller.getCurrentUser(userId, email, roles);

      // Assert
      expect(result).toEqual({
        userId,
        email,
        roles,
        notificationPreferences: {},
        authenticated: true,
      });
    });
  });
});
