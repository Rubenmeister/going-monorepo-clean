import { queryRef, executeQuery, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'going-monorepo-clean',
  location: 'us-central1'
};

export const getAllRidesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAllRides');
}
getAllRidesRef.operationName = 'GetAllRides';

export function getAllRides(dc) {
  return executeQuery(getAllRidesRef(dc));
}

