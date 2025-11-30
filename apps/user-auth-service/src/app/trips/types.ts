export enum ServiceType {
  PRIVATE_RIDE = 'PRIVATE_RIDE',
  SHARED_SUV = 'SHARED_SUV',
  SHARED_VAN = 'SHARED_VAN'
}
export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  BOARDING = 'BOARDING',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
export enum PassengerType {
  HUMAN = 'HUMAN',
  PACKAGE = 'PACKAGE'
}
export enum PackageSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE'
}
export interface PackageDetails {
  size: PackageSize;
  description: string;
  receiverName: string;
  receiverPhone: string;
  deliveryInstructions?: string;
  isFragile: boolean;
}
