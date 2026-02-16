import { Result } from 'neverthrow';
import { Route } from '../entities/route.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IRouteRepository = Symbol('IRouteRepository');

export interface IRouteRepository {
  save(route: Route): Promise<Result<void, Error>>;
  update(route: Route): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Route | null, Error>>;
  findActiveRoutes(): Promise<Result<Route[], Error>>;
  findByOriginCity(city: string): Promise<Result<Route[], Error>>;
}
