import { ShopPaymentMethod } from './shop_payment_method';

export class BraintreeCreditCardShopPaymentMethod extends ShopPaymentMethod {
  beforeSetup() {
    this.$subfields = this.$(
      `[data-subfields-for-payment-method="shop_payment_method_${this.data.id}"]`
    );
  }

  setup(success, failure) {
    const that = this;

    // Start by generating a Braintree client token.
    submarine.api // eslint-disable-line no-undef
      .generatePaymentProcessorClientToken('braintree', client_token => {
        // Then, create a Braintree client instance.
        braintree.client // eslint-disable-line no-undef
          .create({
            authorization: client_token.attributes.token
          })
          .then(clientInstance =>
            // Next, set up the Hosted Fields instance.
            // eslint-disable-next-line no-undef
            braintree.hostedFields.create(
              that.getHostedFieldsOptions(clientInstance)
            )
          )
          .then(hostedFieldsInstance => {
            // Finally, store a reference to the hosted fields instance for later use.
            that.hostedFieldsInstance = hostedFieldsInstance;

            // Flag subfields as loaded, and tweak the height of Braintree iframes
            this.$subfields.addClass(
              'card-fields-container--loaded card-fields-container--transitioned'
            );
            this.$subfields.find('iframe').css({ height: '18px' });

            success();
          })
          .catch(error => {
            failure(error);
          });
      })
      .catch(error => {
        failure(error);
      });
  }

  getHostedFieldsOptions(clientInstance) {
    return {
      client: clientInstance,
      styles: {
        input: {
          color: '#333333',
          margin: '-1px 0 0 0',
          'font-size': '14px',
          'font-family':
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif'
        }
      },
      fields: {
        number: {
          selector: '#braintree-credit-card-card-number',
          placeholder: this.t('checkout.credit_card.number_placeholder')
        },
        expirationDate: {
          selector: '#braintree-credit-card-expiration-date',
          placeholder: this.t(
            'checkout.credit_card.expiration_date_placeholder'
          )
        },
        cvv: {
          selector: '#braintree-credit-card-cvv',
          placeholder: this.t('checkout.credit_card.cvv_placeholder')
        }
      }
    };
  }

  validate() {
    const state = this.hostedFieldsInstance.getState();
    const errors = [];
    Object.keys(state.fields).forEach(key => {
      if (!state.fields[key].isValid) {
        errors.push(key);
      }
    });
    return errors;
  }

  process(success, error) {
    this.hostedFieldsInstance.tokenize((tokenizeError, payload) => {
      if (!tokenizeError) {
        success({
          customer_payment_method_id: null,
          payment_nonce: payload.nonce,
          payment_method_type: 'credit-card',
          payment_processor: 'braintree'
        });
      } else {
        error({
          message: null // Braintree's UI will display an appropriate error message.
        });
      }
    });
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.t(
        'payment_methods.shop_payment_methods.braintree.credit_card.title'
      ),
      value: this.getValue(),
      subfields_content: this.options.html_templates
        .braintree_credit_card_subfields_content,
      subfields_class: 'card-fields-container',
      icon: 'generic',
      icon_description: this.t(
        'payment_methods.shop_payment_methods.braintree.credit_card.icon_description'
      )
    };
  }
}
