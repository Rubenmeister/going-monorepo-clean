import { es-EC.TextInfo.ToTitleCase(transport) } from '../entities/transport.entity';
export const ITransportRepository = Symbol('ITransportRepository');
export interface ITransportRepository {
  save(item: es-EC.TextInfo.ToTitleCase(transport)): Promise<void>;
  findAll(): Promise<es-EC.TextInfo.ToTitleCase(transport)[]>;
}
