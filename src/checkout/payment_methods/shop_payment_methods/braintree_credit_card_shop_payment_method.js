import { ShopPaymentMethod } from './shop_payment_method';

export class BraintreeCreditCardShopPaymentMethod extends ShopPaymentMethod {

  beforeSetup() {
    this.$subfields = this.$(`[data-subfields-for-payment-method="shop_payment_method_${this.data.id}"]`);
  }

  setup(success, failure) {
    const that = this;

    // Start by generating a Braintree client token.
    submarine.api.generatePaymentProcessorClientToken('braintree', (client_token) => {

      // Then, create a Braintree client instance.
      braintree.client.create({
        authorization: client_token.attributes.token
      }).then((clientInstance) => {

        // Next, set up the Hosted Fields instance.
        return braintree.hostedFields.create(that.getHostedFieldsOptions(clientInstance));
      }).then((hostedFieldsInstance) => {

        // Finally, store a reference to the hosted fields instance for later use.
        that.hostedFieldsInstance = hostedFieldsInstance;

        // Flag subfields as loaded, and tweak the height of Braintree iframes
        this.$subfields.addClass('card-fields-container--loaded card-fields-container--transitioned');
        this.$subfields.find('iframe').css({ 'height': '18px' });

        success();
      }).catch((error) => {
        failure(error);
      });
    }).catch((error) => {
      failure(error);
    });
  }

  getHostedFieldsOptions(clientInstance) {
    return {
      client: clientInstance,
      styles: {
        input: {
          'color': '#333333',
          'font-size': '14px',
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
        }
      },
      fields: {
        number: {
          selector: '#braintree-credit-card-card-number',
          placeholder: 'Card number'
        },
        expirationDate: {
          selector: '#braintree-credit-card-expiration-date',
          placeholder: 'Expiration date (MM / YY)'
        },
        cvv: {
          selector: '#braintree-credit-card-cvv',
          placeholder: 'Security code'
        }
      }
    };
  }

  process(callbacks) {
    this.hostedFieldsInstance.tokenize((tokenizeError, payload) => {
      if(!tokenizeError) {
        callbacks.success({
          customer_payment_method_id: null,
          payment_nonce: payload.nonce,
          payment_method_type: 'credit-card',
          payment_processor: 'braintree',
        });
      } else {
        callbacks.error({
          message: null // Braintree's UI will display an appropriate error message.
        });
      }
    });
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: 'Credit card (save for later)',
      subfields_content: this.options.html_templates.braintree_credit_card_subfields_content,
      subfields_class: 'card-fields-container',
      icon: 'generic',
      icon_description: 'Credit card'
    }
  }

}
