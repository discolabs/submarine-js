import SubmarinePaymentMethod from './submarine_payment_method';

export class CustomerPaymentMethod extends SubmarinePaymentMethod {

  getRenderContext() {
    let title = null;
    let icon = null;
    let icon_description = null;

    if(this.data.attributes.payment_data.last4) {
      title = `Saved card ending in ${this.data.attributes.payment_data.last4}`;
      icon = this.data.attributes.payment_data.brand.toLowerCase();
      icon_description = this.data.attributes.payment_data.brand;
    } else if(this.data.attributes.payment_data.email) {
      title = `Saved Paypal account (${this.data.attributes.payment_data.email})`;
      icon = 'paypal';
      icon_description = 'Paypal';
    }

    return {
      id: this.data.id,
      title: title,
      icon: icon,
      icon_description: icon_description
    }
  }

  getRenderTemplate() {
    return 'customer_payment_method';
  }

  process(callbacks) {
    callbacks.success({
      customer_payment_method_id: this.data.id,
      payment_nonce: null,
      payment_method_type: null,
      payment_processor: null,
    });
  }

}
