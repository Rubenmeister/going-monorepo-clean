import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result } from 'neverthrow';
export type RouteStatus = 'active' | 'inactive' | 'maintenance';
export interface RouteProps {
    id: UUID;
    name: string;
    description: string;
    basePrice: number;
    capacity: number;
    status: RouteStatus;
}
export declare class Route {
    readonly id: UUID;
    readonly status: RouteStatus;
    private constructor();
    static create(props: Omit<RouteProps, 'id' | 'status'>): Result<Route, Error>;
}
