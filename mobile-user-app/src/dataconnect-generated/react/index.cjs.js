const { getAllRidesRef, connectorConfig } = require('../index.cjs.js');
const { CallerSdkTypeEnum } = require('firebase/data-connect');
const { useDataConnectQuery, validateReactArgs } = require('@tanstack-query-firebase/react/data-connect');


exports.useGetAllRides = function useGetAllRides(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts } = validateReactArgs(connectorConfig, dcOrOptions, options);
  const ref = getAllRidesRef(dcInstance);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}