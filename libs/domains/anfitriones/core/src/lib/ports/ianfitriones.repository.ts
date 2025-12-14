import { Result } from 'neverthrow';
import { Host } from '../entities/anfitriones.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const I_HOST_REPOSITORY = Symbol('IHostRepository');

export interface IHostRepository {
  save(host: Host): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Host | null, Error>>;
  findByUserId(userId: UUID): Promise<Result<Host | null, Error>>;
  findAll(): Promise<Result<Host[], Error>>;
  update(host: Host): Promise<Result<void, Error>>;
}
