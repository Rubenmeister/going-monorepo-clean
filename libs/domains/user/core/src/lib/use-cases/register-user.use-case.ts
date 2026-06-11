import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Role, sanitizeSelfServiceRoles } from '../value-objects/role.vo';
import { IUserRepository } from '../ports/iuser.repository';
import { IPasswordHasher } from '../ports/ipassword-hasher';
import { RegisterUserDto } from '../dto/register-user.dto';

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    @Inject(IPasswordHasher)
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ id: string }> {
    // Normalizar email siempre antes de cualquier operación
    dto.email = dto.email.toLowerCase().trim();

    const existingUserResult = await this.userRepo.findByEmail(dto.email);
    if (existingUserResult.isErr()) {
      throw new InternalServerErrorException(existingUserResult.error.message);
    }
    if (existingUserResult.value) {
      throw new ConflictException('Email already in use');
    }

    // SEGURIDAD (privilege escalation): el registro público NUNCA puede
    // auto-asignar roles elevados (admin/operator/corporate). Filtramos a los
    // roles auto-asignables; si se pidió uno elevado se descarta y se cae a
    // 'user'. La creación de admins va SOLO por flujos protegidos
    // (bootstrap-admin con token o panel admin con guard). Esto vale aunque
    // la validación del DTO se omita o cambie: es la última línea de defensa.
    const { roles: safeRoles, rejected } = sanitizeSelfServiceRoles(dto.roles);
    if (rejected.length > 0) {
      this.logger.warn(
        `Registro de ${dto.email}: roles no auto-asignables descartados [${rejected.join(
          ', '
        )}]; se asigna [${safeRoles.join(', ')}].`
      );
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const roleVOs = safeRoles.map((r) => Role.create(r)._unsafeUnwrap());

    const userResult = User.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      roles: roleVOs,
    });

    if (userResult.isErr()) {
      throw new InternalServerErrorException(userResult.error.message);
    }
    const user = userResult.value;

    const saveResult = await this.userRepo.save(user);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: user.id };
  }
}
