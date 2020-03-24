import { ShopPaymentMethod } from './shop_payment_methods/shop_payment_method';
import { BraintreeCreditCardShopPaymentMethod } from './shop_payment_methods/braintree_credit_card_shop_payment_method';
import { BraintreeApplePayShopPaymentMethod } from './shop_payment_methods/braintree_apple_pay_shop_payment_method';
import { CybersourceCreditCardShopPaymentMethod } from './shop_payment_methods/cybersource_credit_card_shop_payment_method';
import { StripeCreditCardShopPaymentMethod } from './shop_payment_methods/stripe_credit_card_shop_payment_method';
import { KomojuCreditCardShopPaymentMethod } from './shop_payment_methods/komoju_credit_card_payment_method';
import { SubmarineBankTransferShopPaymentMethod } from './shop_payment_methods/submarine_bank_transfer_payment_method';

const SHOP_PAYMENT_METHODS = {
  braintree: {
    'credit-card': BraintreeCreditCardShopPaymentMethod,
    'apple-pay': BraintreeApplePayShopPaymentMethod
  },
  cybersource: {
    'credit-card': CybersourceCreditCardShopPaymentMethod
  },
  stripe: {
    'credit-card': StripeCreditCardShopPaymentMethod
  },
  komoju: {
    'credit-card': KomojuCreditCardShopPaymentMethod
  },
  submarine: {
    'bank-transfer': SubmarineBankTransferShopPaymentMethod
  }
};

/**
 * Given a shop payment method type, return the appropriate payment method
 * class to instantiate.
 *
 * @param shopPaymentMethod
 * @returns {ShopPaymentMethod}
 */
const getShopPaymentMethodClass = shopPaymentMethod => {
  if (
    SHOP_PAYMENT_METHODS[shopPaymentMethod.attributes.payment_processor] &&
    SHOP_PAYMENT_METHODS[shopPaymentMethod.attributes.payment_processor][
      shopPaymentMethod.attributes.payment_method_type
    ]
  ) {
    return SHOP_PAYMENT_METHODS[shopPaymentMethod.attributes.payment_processor][
      shopPaymentMethod.attributes.payment_method_type
    ];
  }
  return ShopPaymentMethod;
};

/**
 * Given a set of payment method options and a shop payment method type, return
 * an instantiated ShopPaymentMethod class.
 *
 * @param $
 * @param options
 * @param translations
 * @param shopPaymentMethod
 * @returns {ShopPaymentMethod}
 */
export const createShopPaymentMethod = (
  $,
  options,
  translations,
  shopPaymentMethod
) => {
  const ShopPaymentMethodClass = getShopPaymentMethodClass(shopPaymentMethod);
  return new ShopPaymentMethodClass({
    $,
    options,
    translations,
    data: shopPaymentMethod
  });
};
