import { Result, ok, err } from 'neverthrow';
import {
  User,
  IUserRepository,
  IPasswordHasher,
  RegisterUserDto,
  RoleType
} from '@going-monorepo-clean/domains-user-core';
// Importamos la implementación concreta del Value Object para crearlo
// Asegúrate de que la ruta sea correcta hacia tu Role VO en el Core
// Si Role no se exporta desde el index del core, ajusta esta línea:
import { Role } from '../../../../core/src/lib/value-objects/role.vo'; 

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(dto: RegisterUserDto): Promise<Result<User, Error>> {
    // 1. Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      return err(new Error('User already exists'));
    }

    // 2. Hashear contraseña
    const passwordHash = await this.passwordHasher.hash(dto.password);

    // 3. Crear los Roles (Value Objects)
    // Asumimos que el DTO trae un string o un enum, lo convertimos a VO
    const roleResult = Role.create(RoleType.USER); // Por defecto asignamos USER
    if (roleResult.isErr()) {
        return err(roleResult.error);
    }

    // 4. Crear entidad User
    const userResult = User.create({
      email: dto.email,
      passwordHash: passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      roles: [roleResult.value], 
    });

    if (userResult.isErr()) {
      return err(userResult.error);
    }

    const user = userResult.value;

    // 5. Guardar en repositorio
    await this.userRepository.save(user);

    return ok(user);
  }
}