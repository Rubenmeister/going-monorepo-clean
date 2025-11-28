import { Tour } from '../entities/tour.entity'; export const ITourRepository = Symbol('ITourRepository'); export interface ITourRepository { save(tour: Tour): Promise<void>; }
