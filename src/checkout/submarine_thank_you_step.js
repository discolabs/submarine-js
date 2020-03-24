import {
  CustardModule,
  STEP_THANK_YOU,
  STEP_ORDER_STATUS
} from '@discolabs/custard-js';

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

  bankTransferTitle() {
    return this.options.submarine.translations.payment_methods
      .shop_payment_methods.submarine.bank_transfer.title;
  }

  iconName() {
    if (this.isShopPaymentMethod()) {
      if (this.isCreditCard()) return 'generic';
      return this.paymentMethodType;
    }

    return this.cardBrand();
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

  cardBrand() {
    return this.paymentMethodData.attributes.payment_data.brand
      .replace(/\s+/g, '-')
      .toLowerCase();
  }
}
