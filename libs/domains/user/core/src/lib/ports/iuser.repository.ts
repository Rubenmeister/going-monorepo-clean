import { Result } from 'neverthrow';
import { User } from '../entities/user.entity';
import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  save(user: User): Promise<Result<void, Error>>;
  update(user: User): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<User | null, Error>>;
  findByEmail(email: string): Promise<Result<User | null, Error>>;
  findByVerificationToken(token: string): Promise<Result<User | null, Error>>;
  findAll(opts?: {
    limit?: number;
    skip?: number;
    role?: string;
    status?: string;
  }): Promise<Result<User[], Error>>;
  countAll(opts?: {
    role?: string;
    status?: string;
  }): Promise<Result<number, Error>>;
  updateStatus(id: UUID, status: string): Promise<Result<void, Error>>;
}
