
const initialiseGateway = gatewayElement => {

};

export const initialiseGateways = gatewayElements => {
  return gatewayElements.map(gatewayElement =>
    initialiseGateway(gatewayElement)
  );
};
