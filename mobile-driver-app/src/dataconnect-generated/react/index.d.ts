import { GetAllRidesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetAllRides(options?: useDataConnectQueryOptions<GetAllRidesData>): UseDataConnectQueryResult<GetAllRidesData, undefined>;
export function useGetAllRides(dc: DataConnect, options?: useDataConnectQueryOptions<GetAllRidesData>): UseDataConnectQueryResult<GetAllRidesData, undefined>;
