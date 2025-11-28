import { Result, ok, err } from 'neverthrow';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
  User
} from '@going-monorepo-clean/domains-user-core';
import { LoginUserDto } from '../dto/login-user.dto';

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService
  ) {}

  async execute(dto: LoginUserDto): Promise<Result<{ user: User; token: string }, Error>> {
    // 1. Buscar usuario por email (Devuelve una "Caja" Result)
    const userResult = await this.userRepository.findByEmail(dto.email);

    // 2. Verificar si la caja trae error (Usuario no encontrado)
    if (userResult.isErr()) {
       return err(new Error('Invalid credentials'));
    }

    // 3. ¡DESEMPAQUETAR! Aquí sacamos el usuario real de la caja
    const user = userResult.value;

    // 4. Verificar password (ahora sí podemos usar user.passwordHash)
    const isPasswordValid = await this.passwordHasher.compare(
      dto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return err(new Error('Invalid credentials'));
    }

    // 5. Generar Token
    const payload = {
      sub: user.id,
      email: user.email,
      // Verificamos si el rol es string o ValueObject para evitar errores
      role: typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].value 
    };

    const token = this.tokenService.sign(payload);

    return ok({ user, token });
  }
}