import { Result } from 'neverthrow';
import { User } from '../entities/user.entity';

export const I_USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  save(user: User): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<User | null, Error>>;
  findByEmail(email: string): Promise<Result<User | null, Error>>;
}