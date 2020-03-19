import { CustomerPaymentMethod } from './customer_payment_methods/customer_payment_method';

/**
 * Given a shop payment method type, return the appropriate payment method
 * class to instantiate.
 *
 * @param customerPaymentMethod
 * @returns {CustomerPaymentMethod}
 */
const getCustomerPaymentMethodClass = () => CustomerPaymentMethod;

/**
 * Given a set of payment method options and a shop payment method type, return
 * an instantiated ShopPaymentMethod class.
 *
 * @param $
 * @param options
 * @param translations
 * @param customerPaymentMethod
 * @returns {CustomerPaymentMethod}
 */
export const createCustomerPaymentMethod = (
  $,
  options,
  translations,
  customerPaymentMethod
) => {
  const customerPaymentMethodClass = getCustomerPaymentMethodClass(
    customerPaymentMethod
  );
  return new customerPaymentMethodClass(
    $,
    options,
    translations,
    customerPaymentMethod
  );
};
