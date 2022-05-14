import { sha256 } from 'js-sha256';
import { Submarine } from './src/submarine';

// Define a customer, shop and API secret for use in development only.
//
// Note: You should *never* expose these values, especially the API secret, to the browser
// in a production environment.
//
// See https://hub.getsubmarine.com/docs/the-submarine-customer-api#authentication for how
// Submarine Customer API signatures should be generated using the secret in a safe way.
const DEV_ENVIRONMENT = 'staging';
const DEV_CUSTOMER_ID = '6211133636859';
const DEV_SHOP_DOMAIN = 'submarine-js.myshopify.com';
const DEV_API_SECRET = '1YoSfSMxd6LHHSdbGyp8yTBQ';

// Calculate an API signature for the given customer, timestamp and API secret.
const calculateSignature = (customerId, timestamp, secret) => {
  const data = `${customerId}:${timestamp}`;
  return sha256.hmac(secret, data);
};

// Generate a Submarine configuration object for use in API client development.
//
// See https://hub.getsubmarine.com/docs/the-submarine-customer-api#authentication for how
// this configuration object should generally be generated within a Shopify theme.
const generateDevConfiguration = () => {
  const timestamp = new Date().getTime();

  return {
    authentication: {
      customer_id: DEV_CUSTOMER_ID,
      shop: DEV_SHOP_DOMAIN,
      signature: calculateSignature(DEV_CUSTOMER_ID, timestamp, DEV_API_SECRET),
      timestamp: timestamp
    },
    environment: DEV_ENVIRONMENT
  }
};

// Perform initialisation of Submarine for development purposes.
const initialise = () => {

  // check we are in a browser context
  if(!window || !document) { return; }

  // generate a valid configuration for development purposes
  const submarineConfig = generateDevConfiguration();

  // create a global submarine object
  window.submarine = new Submarine(submarineConfig);

};

initialise();