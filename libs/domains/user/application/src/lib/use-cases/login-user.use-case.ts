import { Inject, Injectable, InternalServerErrorException, UnauthorizedException, Logger, TooManyRequestsException } from '@nestjs/common';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  ITokenManager,
} from '@going-monorepo-clean/domains-user-core';
import { LoginUserDto } from '../dto/login-user.dto';
import { AccountLockoutService } from '../../../infrastructure/services/account-lockout.service';

// DTO de respuesta
export type LoginResponseDto = {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    roles: string[];
  };
};

/**
 * Login User Use Case
 * Authenticates user with email/password and returns token pair
 *
 * Integrates:
 * - Account lockout (track failed attempts)
 * - Token creation (access + refresh tokens)
 * - Role-based permissions
 *
 * Flow:
 * 1. Check if account is locked (5 failed attempts)
 * 2. Find user by email
 * 3. Verify password
 * 4. Create token pair (access + refresh)
 * 5. Reset failed attempts on success
 * 6. Record failed attempt on error
 */
@Injectable()
export class LoginUserUseCase {
  private readonly logger = new Logger(LoginUserUseCase.name);

  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    @Inject(IPasswordHasher)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(ITokenService)
    private readonly tokenService: ITokenService,
    @Inject('ITokenManager')
    private readonly tokenManager: ITokenManager,
    private readonly accountLockout: AccountLockoutService,
  ) {}

  async execute(dto: LoginUserDto): Promise<LoginResponseDto> {
    try {
      // 1. Check if account is locked (failed attempts)
      const isLockedResult = await this.accountLockout.isAccountLocked(dto.email as any);
      if (isLockedResult.isErr()) {
        this.logger.error(`Error checking account lock: ${isLockedResult.error.message}`);
        throw new InternalServerErrorException('Authentication service error');
      }

      if (isLockedResult.value) {
        const ttlResult = await this.accountLockout.getRemainingLockoutTime(dto.email as any);
        const ttl = ttlResult.isOk() ? ttlResult.value : 900;

        this.logger.warn(
          `Login attempt for locked account: ${dto.email}. Locked for ${ttl} more seconds.`,
        );

        throw new TooManyRequestsException(
          `Account is locked. Try again in ${Math.ceil(ttl / 60)} minutes.`,
        );
      }

      // 2. Find user by email
      const userResult = await this.userRepo.findByEmail(dto.email);
      if (userResult.isErr()) {
        throw new InternalServerErrorException(userResult.error.message);
      }

      const user = userResult.value;
      if (!user) {
        // Record failed attempt for non-existent user
        await this.recordFailedAttempt(dto.email);
        this.logger.warn(`Login attempt for non-existent user: ${dto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // 3. Verify account is active
      if (user.status !== 'active') {
        this.logger.warn(`Login attempt for inactive account: ${user.id}`);
        throw new UnauthorizedException('Account is not active');
      }

      // 4. Verify password
      const isPasswordValid = await user.checkPassword(dto.password, this.passwordHasher);
      if (!isPasswordValid) {
        // Record failed attempt
        await this.recordFailedAttempt(user.id);
        this.logger.warn(`Invalid password attempt for user: ${user.id}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // 5. Reset failed attempts counter (successful login)
      const resetResult = await this.accountLockout.resetFailedAttempts(user.id);
      if (resetResult.isErr()) {
        this.logger.warn(`Failed to reset attempts counter: ${resetResult.error.message}`);
        // Don't fail login on this error
      }

      // 6. Create token pair (access + refresh)
      const roles = user.roles.map(r => r.toPrimitives());

      const tokenPairResult = await this.tokenManager.createTokenPair(
        user.id,
        user.email,
        roles,
      );

      if (tokenPairResult.isErr()) {
        this.logger.error(
          `Failed to create token pair: ${tokenPairResult.error.message}`,
        );
        throw new InternalServerErrorException('Failed to create authentication tokens');
      }

      const tokenPair = tokenPairResult.value;

      this.logger.log(
        `User logged in successfully: ${user.id} (${user.email})`,
      );

      // 7. Return token pair + user info
      return {
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          roles: roles,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException ||
          error instanceof TooManyRequestsException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error during login: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Record a failed login attempt
   * May lock account if threshold is exceeded
   */
  private async recordFailedAttempt(userId: string): Promise<void> {
    const result = await this.accountLockout.recordFailedAttempt(userId as any);

    if (result.isErr()) {
      this.logger.warn(
        `Failed to record attempt: ${result.error.message}`,
      );
      return;
    }

    const { attempts, isLocked } = result.value;

    if (isLocked) {
      this.logger.warn(
        `Account locked after ${attempts} failed attempts: ${userId}`,
      );
    } else {
      this.logger.debug(
        `Failed attempt recorded: ${attempts}/5 for user ${userId}`,
      );
    }
  }
}