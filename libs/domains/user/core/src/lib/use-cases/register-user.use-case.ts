import { Inject, Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import {
  User,
  Role,
  IUserRepository,
  IPasswordHasher,
} from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope
import { RegisterUserDto } from '../dto/register-user.dto';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    @Inject(IPasswordHasher)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ id: string }> {
    const existingUserResult = await this.userRepo.findByEmail(dto.email);
    if (existingUserResult.isErr()) {
      throw new InternalServerErrorException(existingUserResult.error.message);
    }
    if (existingUserResult.value) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const roleVOs = dto.roles.map((r) => Role.create(r)._unsafeUnwrap());

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