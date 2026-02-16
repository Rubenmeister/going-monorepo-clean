import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ok, err } from 'neverthrow';
import { LoginUserUseCase } from '@going-monorepo-clean/domains-user-application';
import {
  User,
  Role,
  IUserRepository,
  IPasswordHasher,
  ITokenService,
} from '@going-monorepo-clean/domains-user-core';

const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};

const mockPasswordHasher = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockTokenService = {
  generateAuthToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
};

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        { provide: IUserRepository, useValue: mockUserRepository },
        { provide: IPasswordHasher, useValue: mockPasswordHasher },
        { provide: ITokenService, useValue: mockTokenService },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
  });

  const createActiveUser = () => {
    const user = User.create({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      roles: [Role.create('user')._unsafeUnwrap()],
    })._unsafeUnwrap();
    user.verifyAccount(); // activate
    return user;
  };

  const dto = { email: 'test@example.com', password: 'MiP@ssw0rd!' };

  it('should login successfully with valid credentials', async () => {
    const user = createActiveUser();
    mockUserRepository.findByEmail.mockResolvedValue(ok(user));
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockTokenService.generateAuthToken.mockReturnValue('jwt-token');
    mockTokenService.generateRefreshToken.mockReturnValue('refresh-token');

    const result = await useCase.execute(dto);

    expect(result.token).toBe('jwt-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.firstName).toBe('Test');
    expect(result.user.roles).toEqual(['user']);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should throw UnauthorizedException when user not found', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(ok(null));

    await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
    await expect(useCase.execute(dto)).rejects.toThrow('Invalid credentials');
  });

  it('should throw UnauthorizedException when account is not active', async () => {
    const user = User.create({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      roles: [Role.create('user')._unsafeUnwrap()],
    })._unsafeUnwrap();
    // NOT calling verifyAccount() - status remains 'pending_verification'

    mockUserRepository.findByEmail.mockResolvedValue(ok(user));

    await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
    await expect(useCase.execute(dto)).rejects.toThrow('Account is not active');
  });

  it('should throw UnauthorizedException when password is wrong', async () => {
    const user = createActiveUser();
    mockUserRepository.findByEmail.mockResolvedValue(ok(user));
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedException);
    await expect(useCase.execute(dto)).rejects.toThrow('Invalid credentials');
  });

  it('should throw InternalServerErrorException when repository fails', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(err(new Error('DB connection lost')));

    await expect(useCase.execute(dto)).rejects.toThrow(InternalServerErrorException);
  });
});
