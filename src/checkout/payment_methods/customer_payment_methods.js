import { CustomerPaymentMethod } from "./customer_payment_methods/customer_payment_method";

/**
 * Given a shop payment method type, return the appropriate payment method
 * class to instantiate.
 *
 * @param customerPaymentMethod
 * @returns {CustomerPaymentMethod}
 */
const getCustomerPaymentMethodClass = (customerPaymentMethod) => {
  return CustomerPaymentMethod;
};

/**
 * Given a set of payment method options and a shop payment method type, return
 * an instantiated ShopPaymentMethod class.
 *
 * @param $
 * @param options
 * @param customerPaymentMethod
 * @returns {CustomerPaymentMethod}
 */
export const createCustomerPaymentMethod = ($, options, customerPaymentMethod) => {
  const customerPaymentMethodClass = getCustomerPaymentMethodClass(customerPaymentMethod);
  return new customerPaymentMethodClass($, options, customerPaymentMethod);
};
