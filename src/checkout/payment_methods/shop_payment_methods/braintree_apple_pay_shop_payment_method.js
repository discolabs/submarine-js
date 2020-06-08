import { ShopPaymentMethod } from './shop_payment_method';

export class BraintreeApplePayShopPaymentMethod extends ShopPaymentMethod {
  shouldLoad() {
    return (
      window.ApplePaySession &&
      ApplePaySession.supportsVersion(3) && // eslint-disable-line no-undef
      ApplePaySession.canMakePayments() // eslint-disable-line no-undef
    );
  }

  setup(success, failure) {
    const that = this;
    that.errors = [];

    // Start by generating a Braintree client token.
    submarine.api // eslint-disable-line no-undef
      .generatePaymentProcessorClientToken('braintree', client_token => {
        // Then, create a Braintree client instance.
        braintree.client // eslint-disable-line no-undef
          .create({
            authorization: client_token.attributes.token
          })
          .then(clientInstance =>
            // Next, set up the Apple Pay instance.
            // eslint-disable-next-line no-undef
            braintree.applePay.create({ client: clientInstance })
          )
          .then(applePayInstance => {
            // Finally, store a reference to the Apple Pay instance for later use.

            that.applePayInstance = applePayInstance;

            // eslint-disable-next-line no-undef
            return ApplePaySession.canMakePaymentsWithActiveCard(
              applePayInstance.merchantIdentifier
            ).then(canMakePaymentsWithActiveCard => {
              if (canMakePaymentsWithActiveCard) {
                that.applePayInstance = applePayInstance;
                success();
              } else {
                const error = 'No active card was found.';
                that.errors = [...that.errors, error];
                failure(error);
              }
            });
          })
          .catch(error => {
            that.errors = [...that.errors, error];
            failure(error);
          });
      })
      .catch(error => {
        that.errors = [...that.errors, error];
        failure(error);
      });
  }

  validate() {
    return this.errors;
  }

  process(success, error) {
    const that = this;

    const paymentRequest = that.applePayInstance.createPaymentRequest({
      total: {
        label: that.options.shop.name,
        amount: that.options.checkout.total_price
      }
    });

    // eslint-disable-next-line no-undef
    const session = new ApplePaySession(3, paymentRequest);

    session.onvalidatemerchant = event => {
      that.applePayInstance
        .performValidation({
          validationURL: event.validationURL,
          displayName: that.options.shop.name
        })
        .then(merchantSession =>
          session.completeMerchantValidation(merchantSession)
        )
        .catch(validationError => {
          // You should show an error to the user, e.g. 'Apple Pay failed to load.'
          console.error('Error validating merchant:', validationError);
          session.abort();
        });
    };

    session.onpaymentauthorized = event => {
      that.applePayInstance
        .tokenize({ token: event.payment.token })
        .then(payload => {
          // eslint-disable-next-line no-undef
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          success({
            shop_payment_method_id: this.data.id,
            customer_payment_method_id: null,
            payment_nonce: payload.nonce,
            payment_method_type: 'apple-pay',
            payment_processor: 'braintree'
          });
        })
        .catch(tokenizeError => {
          error({
            message: tokenizeError
          });
          console.error('Error tokenizing Apple Pay:', tokenizeError);
          // eslint-disable-next-line no-undef
          session.completePayment(ApplePaySession.STATUS_FAILURE);
        });
    };

    session.begin();
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.t(
        'payment_methods.shop_payment_methods.braintree.apple_pay.title'
      ),
      value: this.getValue(),
      subfields_content: this.options.html_templates
        .braintree_apple_pay_subfields_content,
      subfields_class: 'card-fields-container',
      icon: 'generic',
      icon_description: this.t(
        'payment_methods.shop_payment_methods.braintree.apple_pay.icon_description'
      )
    };
  }
}
