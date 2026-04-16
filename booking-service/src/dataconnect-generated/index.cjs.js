const { queryRef, executeQuery, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'going-monorepo-clean',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const getAllRidesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAllRides');
}
getAllRidesRef.operationName = 'GetAllRides';
exports.getAllRidesRef = getAllRidesRef;

exports.getAllRides = function getAllRides(dc) {
  return executeQuery(getAllRidesRef(dc));
};
