import { es-EC.TextInfo.ToTitleCase(experiencias) } from '../entities/experiencias.entity';
export const IExperienciasRepository = Symbol('IExperienciasRepository');
export interface IExperienciasRepository {
  save(item: es-EC.TextInfo.ToTitleCase(experiencias)): Promise<void>;
  findAll(): Promise<es-EC.TextInfo.ToTitleCase(experiencias)[]>;
}
