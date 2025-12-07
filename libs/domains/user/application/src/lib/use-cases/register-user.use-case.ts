import {
  User,
  IUserRepository,
  IPasswordHasher,
  RoleType,
} from '@going-monorepo-clean/domains-user-core'; // Using @going-monorepo-clean/domains-user-core alias
import { Result, ok, err } from 'neverthrow';

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  role?: RoleType;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher
  ) {}

  async execute(dto: RegisterUserDto): Promise<Result<User, Error>> {
    // 1. Check if user already exists
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser.isOk() && existingUser.value) {
      return err(new Error('User already exists'));
    }

    // 2. Hash password
    const hashedPassword = await this.hasher.hash(dto.password);

    // 3. Create domain entity
    const userOrError = User.create({
      email: dto.email,
      passwordHash: hashedPassword,
      name: dto.name,
      role: dto.role,
    });

    if (userOrError.isErr()) {
      return err(userOrError.error);
    }

    const user = userOrError.value;

    // 4. Save to repository
    const saveResult = await this.userRepo.save(user);

    if (saveResult.isErr()) {
      return err(saveResult.error);
    }

    return ok(user);
  }
}