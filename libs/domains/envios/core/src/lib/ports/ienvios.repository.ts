import { es-EC.TextInfo.ToTitleCase(envios) } from '../entities/envios.entity';
export const IEnviosRepository = Symbol('IEnviosRepository');
export interface IEnviosRepository {
  save(item: es-EC.TextInfo.ToTitleCase(envios)): Promise<void>;
  findAll(): Promise<es-EC.TextInfo.ToTitleCase(envios)[]>;
}
