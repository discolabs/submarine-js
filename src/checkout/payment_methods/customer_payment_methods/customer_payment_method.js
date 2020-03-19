import SubmarinePaymentMethod from '../submarine_payment_method';

export class CustomerPaymentMethod extends SubmarinePaymentMethod {
  getValue() {
    return `customer_payment_method_${this.data.id}`;
  }

  getRenderContext() {
    if (this.isCreditCard()) return this.creditCardRenderContext();
    if (this.isPaypal()) return this.paypalRenderContext();
    if (this.isBankTransfer()) return this.bankTransferRenderContext();

    return {
      id: this.data.id,
      title: null,
      value: this.getValue(),
      icon: null,
      icon_description: null
    };
  }

  getRenderTemplate() {
    return 'customer_payment_method';
  }

  process(success) {
    success({
      customer_payment_method_id: this.data.id,
      payment_nonce: null,
      payment_method_type: null,
      payment_processor: null
    });
  }

  isCreditCard() {
    return !!this.data.attributes.payment_data.last4;
  }

  isPaypal() {
    return !!this.data.attributes.payment_data.email;
  }

  isBankTransfer() {
    return this.data.attributes.payment_method_type === 'bank-transfer';
  }

  paypalRenderContext() {
    const title = this.t(
      'payment_methods.customer_payment_methods.paypal.title'
    ).replace('{{ email }}', this.data.attributes.payment_data.email);

    return {
      id: this.data.id,
      title,
      value: this.getValue(),
      icon: 'paypal',
      icon_description: 'Paypal'
    };
  }

  creditCardRenderContext() {
    const title = this.t(
      'payment_methods.customer_payment_methods.credit_card.title'
    ).replace('{{ last4 }}', this.data.attributes.payment_data.last4);

    return {
      id: this.data.id,
      title,
      value: this.getValue(),
      icon: this.data.attributes.payment_data.brand.toLowerCase(),
      icon_description: this.data.attributes.payment_data.brand
    };
  }

  bankTransferRenderContext() {
    return {
      id: this.data.id,
      title: this.t(
        'payment_methods.customer_payment_methods.bank_transfer.title'
      ),
      value: this.getValue(),
      icon: '',
      icon_description: ''
    };
  }
}
