import { ConnectorConfig, DataConnect, QueryRef, QueryPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Booking_Key {
  id: UUIDString;
  __typename?: 'Booking_Key';
}

export interface GetAllRidesData {
  rides: ({
    id: UUIDString;
    driver: {
      displayName: string;
    };
      departureCity: string;
      destinationCity: string;
      departureDateTime: TimestampString;
      availableSeats: number;
      pricePerSeat: number;
  } & Ride_Key)[];
}

export interface Message_Key {
  id: UUIDString;
  __typename?: 'Message_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface Ride_Key {
  id: UUIDString;
  __typename?: 'Ride_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface GetAllRidesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllRidesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetAllRidesData, undefined>;
  operationName: string;
}
export const getAllRidesRef: GetAllRidesRef;

export function getAllRides(): QueryPromise<GetAllRidesData, undefined>;
export function getAllRides(dc: DataConnect): QueryPromise<GetAllRidesData, undefined>;

