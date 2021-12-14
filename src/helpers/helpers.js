import { sha256 } from 'js-sha256';

const API_URL = "https://submarine-staging.discolabs.com/api/v1";
const CUSTOMER_ID = "5979150319867";
const SHOP_DOMAIN = "submarine-js.myshopify.com";

// Note: You should *never* expose this value to the browser in a production environment.
// See https://hub.getsubmarine.com/docs/the-submarine-customer-api#authentication for how
// Submarine Customer API signatures should be generated using the secret in a safe way.
const SHOP_API_SECRET = "1YoSfSMxd6LHHSdbGyp8yTBQ";

const calculateSignature = (customerId, timestamp, secret) => {
  const data = `${customerId}:${timestamp}`;
  return sha256.hmac(secret, data);
};

export const generateDevConfig = () => {
  const timestamp = new Date().getTime();

  return {
    apiUrl: API_URL,
    authentication: {
      shop: SHOP_DOMAIN,
      timestamp: timestamp,
      signature: calculateSignature(CUSTOMER_ID, timestamp, SHOP_API_SECRET)
    },
    context: {
      customer_id: CUSTOMER_ID
    }
  }
};
