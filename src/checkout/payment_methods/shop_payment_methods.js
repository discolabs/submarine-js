import { ShopPaymentMethod } from "./shop_payment_methods/shop_payment_method";

/**
 * Given a shop payment method type, return the appropriate payment method
 * class to instantiate.
 *
 * @param shopPaymentMethod
 * @returns {ShopPaymentMethod}
 */
const getShopPaymentMethodClass = (shopPaymentMethod) => {
  return ShopPaymentMethod;
};

/**
 * Given a set of payment method options and a shop payment method type, return
 * an instantiated ShopPaymentMethod class.
 *
 * @param options
 * @param shopPaymentMethod
 * @returns {ShopPaymentMethod}
 */
export const createShopPaymentMethod = (options, shopPaymentMethod) => {
  const shopPaymentMethodClass = getShopPaymentMethodClass(shopPaymentMethod);
  return new shopPaymentMethodClass(options, shopPaymentMethod);
};
