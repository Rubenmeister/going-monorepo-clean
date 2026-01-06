import { Transport } from '../entities/transport.entity';

export const ITransportRepository = Symbol('ITransportRepository');

export interface ITransportRepository {
  save(item: Transport): Promise<void>;
  findAll(): Promise<Transport[]>;
  findById(id: string): Promise<Transport | null>;
  search(query: string): Promise<Transport[]>;
}
