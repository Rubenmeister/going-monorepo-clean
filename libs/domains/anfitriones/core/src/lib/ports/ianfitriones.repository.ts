import { es-EC.TextInfo.ToTitleCase(anfitriones) } from '../entities/anfitriones.entity';
export const IAnfitrionesRepository = Symbol('IAnfitrionesRepository');
export interface IAnfitrionesRepository {
  save(item: es-EC.TextInfo.ToTitleCase(anfitriones)): Promise<void>;
  findAll(): Promise<es-EC.TextInfo.ToTitleCase(anfitriones)[]>;
}
