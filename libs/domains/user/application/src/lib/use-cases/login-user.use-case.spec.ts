import { LoginUserUseCase } from './login-user.use-case';
import { LoginUserDto } from '../dto/login-user.dto';
import { User, IUserRepository, IPasswordHasher, ITokenService } from '@going-monorepo-clean/domains-user-core';
import { ok, err } from 'neverthrow';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenService: jest.Mocked<ITokenService>;

  const validEmail = 'test@example.com';
  const validPassword = 'Password123!';
  const hashedPassword = '$2b$10$hashedpassword';

  // Create mock user with correct format (roles as array)
  const mockUser = User.fromPrimitives({
    id: 'user-123',
    email: validEmail,
    passwordHash: hashedPassword,
    firstName: 'Test',
    lastName: 'User',
    phone: '+593999999999',
    roles: ['USER'], // Array format as expected
    status: 'active',
    createdAt: new Date(),
    verificationToken: null,
  });

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByVerificationToken: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as jest.Mocked<IPasswordHasher>;

    mockTokenService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as jest.Mocked<ITokenService>;

    useCase = new LoginUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService
    );
  });

  describe('execute', () => {
    it('should return token and user when credentials are valid', async () => {
      // Arrange
      const dto: LoginUserDto = { email: validEmail, password: validPassword };
      mockUserRepository.findByEmail.mockResolvedValue(ok(mockUser));
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.sign.mockReturnValue('valid-jwt-token');

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.token).toBe('valid-jwt-token');
        expect(result.value.user.email).toBe(validEmail);
      }
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validEmail);
      expect(mockPasswordHasher.compare).toHaveBeenCalledWith(validPassword, hashedPassword);
    });

    it('should return error when user is not found', async () => {
      // Arrange
      const dto: LoginUserDto = { email: 'unknown@example.com', password: validPassword };
      mockUserRepository.findByEmail.mockResolvedValue(err(new Error('User not found')));

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid credentials');
      }
    });

    it('should return error when password is incorrect', async () => {
      // Arrange
      const dto: LoginUserDto = { email: validEmail, password: 'wrong-password' };
      mockUserRepository.findByEmail.mockResolvedValue(ok(mockUser));
      mockPasswordHasher.compare.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid credentials');
      }
      expect(mockTokenService.sign).not.toHaveBeenCalled();
    });

    it('should generate token with correct payload', async () => {
      // Arrange
      const dto: LoginUserDto = { email: validEmail, password: validPassword };
      mockUserRepository.findByEmail.mockResolvedValue(ok(mockUser));
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.sign.mockReturnValue('jwt-token');

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockTokenService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-123',
          email: validEmail,
        })
      );
    });
  });
});
