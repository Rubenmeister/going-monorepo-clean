import { Route } from '../entities/route.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';
export declare const I_ROUTE_REPOSITORY: unique symbol;
export interface IRouteRepository {
    save(route: Route): Promise<Route>;
    findById(id: UUID): Promise<Route | null>;
    findAllActive(): Promise<Route[]>;
}
