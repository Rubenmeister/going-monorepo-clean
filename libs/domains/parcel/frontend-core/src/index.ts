export * from './lib/domains-parcel-frontend-core';
export { Parcel, I_PARCEL_REPOSITORY } from '@going-monorepo-clean/domains-parcel-core';
export type { IParcelRepository, ParcelProps, ParcelStatus } from '@going-monorepo-clean/domains-parcel-core';

// We define CreateParcelData here as it might be frontend-specific
export interface CreateParcelData {
  userId: string;
  origin: any;
  destination: any;
  description: string;
  price: any;
}
