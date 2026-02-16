import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { RefreshTokenUseCase } from '@going-monorepo-clean/domains-user-application';
import {
  User,
  Role,
  IUserRepository,
  ITokenService,
} from '@going-monorepo-clean/domains-user-core';

const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};

const mockTokenService = {
  generateAuthToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
};

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: IUserRepository, useValue: mockUserRepository },
        { provide: ITokenService, useValue: mockTokenService },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
  });

  const createActiveUser = () => {
    const user = User.create({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      roles: [Role.create('user')._unsafeUnwrap()],
    })._unsafeUnwrap();
    user.verifyAccount();
    return user;
  };

  it('should refresh tokens successfully', async () => {
    const user = createActiveUser();
    mockTokenService.verifyRefreshToken.mockReturnValue({ userId: 'user-id-123' });
    mockUserRepository.findById.mockResolvedValue(ok(user));
    mockTokenService.generateAuthToken.mockReturnValue('new-jwt-token');
    mockTokenService.generateRefreshToken.mockReturnValue('new-refresh-token');

    const result = await useCase.execute({ refreshToken: 'valid-refresh-token' });

    expect(result.token).toBe('new-jwt-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id-123');
  });

  it('should throw UnauthorizedException when refresh token is invalid', async () => {
    mockTokenService.verifyRefreshToken.mockReturnValue(null);

    await expect(
      useCase.execute({ refreshToken: 'invalid-token' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      useCase.execute({ refreshToken: 'invalid-token' }),
    ).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw UnauthorizedException when user not found', async () => {
    mockTokenService.verifyRefreshToken.mockReturnValue({ userId: 'deleted-user' });
    mockUserRepository.findById.mockResolvedValue(ok(null));

    await expect(
      useCase.execute({ refreshToken: 'valid-token' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      useCase.execute({ refreshToken: 'valid-token' }),
    ).rejects.toThrow('User not found');
  });

  it('should throw UnauthorizedException when account is inactive', async () => {
    const inactiveUser = User.create({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      roles: [Role.create('user')._unsafeUnwrap()],
    })._unsafeUnwrap(); // status = 'pending_verification'

    mockTokenService.verifyRefreshToken.mockReturnValue({ userId: 'user-id' });
    mockUserRepository.findById.mockResolvedValue(ok(inactiveUser));

    await expect(
      useCase.execute({ refreshToken: 'valid-token' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      useCase.execute({ refreshToken: 'valid-token' }),
    ).rejects.toThrow('Account is not active');
  });

  it('should throw InternalServerErrorException when repository fails', async () => {
    mockTokenService.verifyRefreshToken.mockReturnValue({ userId: 'user-id' });
    mockUserRepository.findById.mockResolvedValue(err(new Error('DB error')));

    await expect(
      useCase.execute({ refreshToken: 'valid-token' }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
