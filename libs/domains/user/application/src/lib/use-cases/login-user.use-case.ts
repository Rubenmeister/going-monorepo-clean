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
    // 1. Obtenemos el RESULTADO (la caja)
    const userResult = await this.userRepository.findByEmail(dto.email);

    // 2. Verificamos si hubo error (Caja vacía / Error)
    if (userResult.isErr()) {
       return err(new Error('Invalid credentials'));
    }

    // 3. ¡DESEMPAQUETAMOS! Sacamos el usuario real de la caja
    const user = userResult.value;

    // 4. Ahora sí podemos acceder a las propiedades del usuario
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
      role: typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0].value 
    };

    const token = this.tokenService.sign(payload);

    return ok({ user, token });
  }
}