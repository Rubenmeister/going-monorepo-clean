import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { AccountLockoutService } from '@going-monorepo-clean/shared-domain';

const mockRegisterUseCase = { execute: jest.fn() };
const mockLoginUseCase = { execute: jest.fn() };
const mockRefreshUseCase = { execute: jest.fn() };

describe('AuthController', () => {
  let controller: AuthController;
  let lockoutService: AccountLockoutService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUserUseCase, useValue: mockLoginUseCase },
        { provide: RefreshTokenUseCase, useValue: mockRefreshUseCase },
        AccountLockoutService,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    lockoutService = module.get<AccountLockoutService>(AccountLockoutService);
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      mockRegisterUseCase.execute.mockResolvedValue({ id: 'new-user-id' });

      const result = await controller.register({
        email: 'new@example.com',
        password: 'MiP@ssw0rd!',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'] as any,
      });

      expect(result).toEqual({ id: 'new-user-id' });
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'MiP@ssw0rd!' };

    it('should login successfully', async () => {
      const loginResponse = {
        token: 'jwt',
        refreshToken: 'refresh',
        user: { id: '1', email: 'test@example.com', firstName: 'Test', roles: ['user'] },
      };
      mockLoginUseCase.execute.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(loginResponse);
    });

    it('should reset lockout attempts on successful login', async () => {
      const resetSpy = jest.spyOn(lockoutService, 'resetAttempts');
      mockLoginUseCase.execute.mockResolvedValue({ token: 'jwt', refreshToken: 'r' });

      await controller.login(loginDto);

      expect(resetSpy).toHaveBeenCalledWith('test@example.com');
    });

    it('should record failed attempt on UnauthorizedException', async () => {
      const recordSpy = jest.spyOn(lockoutService, 'recordFailedAttempt');
      mockLoginUseCase.execute.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(recordSpy).toHaveBeenCalledWith('test@example.com');
    });

    it('should block login when account is locked', async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        lockoutService.recordFailedAttempt('test@example.com');
      }

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Account temporarily locked');
      expect(mockLoginUseCase.execute).not.toHaveBeenCalled();
    });

    it('should not record failed attempt for non-auth errors', async () => {
      const recordSpy = jest.spyOn(lockoutService, 'recordFailedAttempt');
      mockLoginUseCase.execute.mockRejectedValue(new Error('Some other error'));

      await expect(controller.login(loginDto)).rejects.toThrow();
      expect(recordSpy).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      mockRefreshUseCase.execute.mockResolvedValue({
        token: 'new-jwt',
        refreshToken: 'new-refresh',
      });

      const result = await controller.refresh({ refreshToken: 'old-refresh' });

      expect(result).toEqual({ token: 'new-jwt', refreshToken: 'new-refresh' });
    });
  });
});
