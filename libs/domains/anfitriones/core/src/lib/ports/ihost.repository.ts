import { Result } from 'neverthrow';
import { Host } from '../entities/host.entity';

export const I_HOST_REPOSITORY = Symbol('IHostRepository');

export interface IHostRepository {
  save(host: Host): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Host | null, Error>>;
  findByUserId(userId: string): Promise<Result<Host | null, Error>>;
  update(host: Host): Promise<Result<void, Error>>;
}
