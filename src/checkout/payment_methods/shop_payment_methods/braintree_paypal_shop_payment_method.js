import { ShopPaymentMethod } from './shop_payment_method';

export class BraintreePaypalShopPaymentMethod extends ShopPaymentMethod {

  beforeSetup() {
    this.$subfields = this.$(
      `[data-subfields-for-payment-method="shop_payment_method_${this.data.id}"]`
    );
  }

  setup(success, failure) {
    const that = this;

    this.deviceData = null;
    this.paypalButtonReady = false;
    this.billingAgreementNonce = null;

    this.$container = this.$('#braintree-paypal-container');
    this.$message = this.$container.find('.braintree-paypal-message');

    // Start by generating a Braintree client token.
    submarine.api // eslint-disable-line no-undef
      .generatePaymentProcessorClientToken('braintree', client_token => {
        // Then, create a Braintree client instance.
        braintree.client // eslint-disable-line no-undef
          .create({
            authorization: client_token.attributes.token
          })
          .then(clientInstance => {
            that.clientInstance = clientInstance;

            braintree.dataCollector.create({
              client: clientInstance,
              paypal: true
            }).then(dataCollectorInstance => {
              that.deviceData = dataCollectorInstance.deviceData;
            });

            braintree.paypalCheckout.create({
              client: clientInstance
            }).then(paypalCheckoutInstance => {
              that.paypalCheckoutInstance = paypalCheckoutInstance;
              window.paypalCheckoutInstance = paypalCheckoutInstance;

              paypalCheckoutInstance.loadPayPalSDK({
                vault: true
              }, (error) => {
                paypal.Buttons({
                  fundingSource: paypal.FUNDING.PAYPAL,
                  createBillingAgreement: that.createBillingAgreement.bind(that),
                  onApprove: that.onApprove.bind(that),
                  onCancel: that.onCancel.bind(that),
                  onError: that.onError.bind(that)
                }).render('#braintree-paypal-mount').then(() => {
                  that.paypalButtonReady = true;
                  success();
                });
              });
            });
          })
          .catch(error => {
            failure(error);
          });
      })
      .catch(error => {
        failure(error);
      });
  }

  createBillingAgreement() {
    const that = this;

    this.setError();

    return this.paypalCheckoutInstance.createPayment({
      flow: 'vault',
      billingAgreementDescription: that.translations.payment_methods.shop_payment_methods.paypal.paypal_billing_agreement_description,
      enableShippingAddress: true,
      shippingAddressEditable: false,
      shippingAddressOverride: {
        recipientName: that.options.checkout.shipping_address.name,
        line1: that.options.checkout.shipping_address.address1,
        line2: that.options.checkout.shipping_address.address2,
        city: that.options.checkout.shipping_address.city,
        countryCode: that.options.checkout.shipping_address.country_code,
        postalCode: that.options.checkout.shipping_address.zip,
        state: that.options.checkout.shipping_address.province_code,
        phone: that.options.checkout.shipping_address.phone
      }
    });
  }

  onApprove(data, actions) {
    const that = this;

    return this.paypalCheckoutInstance.tokenizePayment(data, (error, payload) => {
      if (error) {
        that.setError(this.translations.payment_methods.shop_payment_methods.paypal_error_unknown);
        return;
      }

      that.setSuccess();
      that.billingAgreementNonce = payload.nonce;
    });
  }

  onCancel(data) {
    this.billingAgreementNonce = null;
  }

  onError(error) {
    this.billingAgreementNonce = null;
    this.setError(this.translations.payment_methods.shop_payment_methods.paypal_error_unknown);
  }

  validate() {
    if (!this.paypalButtonReady) {
      return [this.setError(this.translations.payment_methods.shop_payment_methods.paypal_error_not_ready)];
    }

    if (!this.billingAgreementNonce) {
      return [this.setError(this.translations.payment_methods.shop_payment_methods.paypal_error_not_approved)];
    }

    return [];
  }

  setError(message) {
    this.$container.removeClass('braintree-paypal--has-success');
    this.$container.toggleClass('braintree-paypal--has-error', !!message);
    this.$message.text(message || this.translations.payment_methods.shop_payment_methods.paypal.paypal_instructions);
    return message;
  }

  setSuccess() {
    this.$container.removeClass('braintree-paypal--has-error');
    this.$container.addClass('braintree-paypal--has-success');
    this.$message.text(this.translations.payment_methods.shop_payment_methods.paypal_success);
  }

  process(success, error) {
    const that = this;

    setTimeout(() => {
      if (!that.billingAgreementNonce) {
        error(this.options.translations.paypal_error_not_approved);
        return;
      } else {
        success({
          shop_payment_method_id: this.data.id,
          customer_payment_method_id: null,
          payment_nonce: that.billingAgreementNonce,
          payment_method_type: 'paypal',
          payment_processor: 'braintree',
          additional_data: {
            deviceData: that.deviceData
          }
        });
      }
      });
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: 'Paypal',
      value: this.getValue(),
      subfields_content: this.options.html_templates.braintree_paypal_subfields_content,
      icon: 'icons_paypal'
    };
  }

}
