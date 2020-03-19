import { ShopPaymentMethod } from './shop_payment_method';

export class StripeCreditCardShopPaymentMethod extends ShopPaymentMethod {
  beforeSetup() {
    this.$subfields = this.$(
      `[data-subfields-for-payment-method="shop_payment_method_${this.data.id}"]`
    );
  }

  setup() {
    this.stripe = Stripe(this.data.attributes.publishable_api_key);
    this.elements = this.stripe.elements({
      locale: this.options.shop.locale
    });

    this.cardNumber = this.elements.create(
      'cardNumber',
      Object.assign(
        this.getDefaultConfig(),
        this.options.stripe.elements.cardNumber
      )
    );
    this.cardNumber.mount('#stripe-credit-card-card-number');

    this.cardExpiry = this.elements.create(
      'cardExpiry',
      Object.assign(
        this.getDefaultConfig(),
        this.options.stripe.elements.cardExpiry
      )
    );
    this.cardExpiry.mount('#stripe-credit-card-expiration-date');

    this.cardCvc = this.elements.create(
      'cardCvc',
      Object.assign(
        this.getDefaultConfig(),
        this.options.stripe.elements.cardCvc
      )
    );
    this.cardCvc.mount('#stripe-credit-card-cvv');
  }

  getDefaultConfig() {
    return {
      style: this.getElementStyles(),
      classes: this.getElementClasses()
    };
  }

  getElementStyles() {
    return {
      base: {
        color: '#333333',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
        fontSize: '14px'
      }
    };
  }

  getElementClasses() {
    return {};
  }

  validate() {
    return [];
  }

  getAdditionalData() {
    return {
      name: this.$subfields.find('#stripe-credit-card-name').val()
    };
  }

  process(success, error) {
    this.stripe
      .createToken(this.cardNumber, this.getAdditionalData())
      .then(result => {
        if (result.error) {
          error(result.error);
          return;
        }

        success({
          customer_payment_method_id: null,
          payment_nonce: result.token.id,
          payment_method_type: 'credit-card',
          payment_processor: 'stripe'
        });
      });
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.t(
        'payment_methods.shop_payment_methods.stripe.credit_card.title'
      ),
      value: this.getValue(),
      subfields_content: this.options.html_templates
        .stripe_credit_card_subfields_content,
      subfields_class: 'card-fields-container',
      icon: 'generic',
      icon_description: this.t(
        'payment_methods.shop_payment_methods.stripe.credit_card.icon_description'
      )
    };
  }
}
