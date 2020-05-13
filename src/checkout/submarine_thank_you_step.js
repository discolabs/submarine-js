import {
  CustardModule,
  STEP_THANK_YOU,
  STEP_ORDER_STATUS
} from '@discolabs/custard-js';
import { CARD_ICON_CLASS_MAPPINGS } from '../constants';

export class SubmarineThankYouStep extends CustardModule {
  id() {
    return 'submarine-thank-you-step';
  }

  steps() {
    return [STEP_THANK_YOU, STEP_ORDER_STATUS];
  }

  selector() {
    return '.main__content';
  }

  setup() {
    this.findPaymentMethodData();
    this.updatePaymentMethodIcon();
    this.updateCardLast4();
  }

  findPaymentMethodData() {
    const paymentMethod = this.options.order.attributes._payment_method;
    const allPaymentMethods = [
      ...this.options.submarine.shop_payment_methods.data,
      ...this.options.submarine.customer_payment_methods.data
    ];
    const [paymentMethodName, paymentMethodId] = paymentMethod.split(
      /_(?=\d+$)/
    );
    this.paymentMethodData = allPaymentMethods.find(
      method =>
        method.type === paymentMethodName &&
        Number(method.id) === Number(paymentMethodId)
    );
    this.paymentMethodType = this.paymentMethodData.attributes.payment_method_type;
  }

  updatePaymentMethodIcon() {
    this.$paymentIcon = this.$element.find('.payment-icon');
    if (this.isBankTransfer()) {
      this.$paymentIcon.replaceWith(`<span>${this.bankTransferTitle()}</span>`);

      return;
    }

    this.$paymentIcon.removeClass('payment-icon--generic');
    this.$paymentIcon.addClass(`payment-icon--${this.iconName()}`);
  }

  updateCardLast4() {
    if (!this.isShopPaymentMethod() && this.isCreditCard()) {
      this.$paymentIcon.after(`<span>${this.cardLast4Detail()}</span>`);
    }
  }

  bankTransferTitle() {
    return this.options.submarine.translations.payment_methods
      .shop_payment_methods.submarine.bank_transfer.title;
  }

  iconName() {
    if (!this.isShopPaymentMethod() && this.isCreditCard())
      return this.cardIcon();
    if (this.isCreditCard()) return 'generic';

    return this.paymentMethodType;
  }

  isShopPaymentMethod() {
    return this.paymentMethodData.type === 'shop_payment_method';
  }

  isCreditCard() {
    return this.paymentMethodType === 'credit-card';
  }

  isBankTransfer() {
    return this.paymentMethodType === 'bank-transfer';
  }

  cardIcon() {
    const brand = this.paymentMethodData.attributes.payment_data.brand
      .match(/[a-zA-Z ]+/)[0]
      .toLowerCase()
      .trim()
      .replace(' ', '-');

    return CARD_ICON_CLASS_MAPPINGS[brand] || brand;
  }

  cardLast4Detail() {
    const { last4 } = this.paymentMethodData.attributes.payment_data;
    const thankYouTranslations = this.options.submarine.translations.thank_you;
    const cardLast4Translation =
      thankYouTranslations && thankYouTranslations.card_last4;

    return cardLast4Translation
      ? cardLast4Translation.replace('{{ last4 }}', last4)
      : `ending with ${last4}`;
  }
}
