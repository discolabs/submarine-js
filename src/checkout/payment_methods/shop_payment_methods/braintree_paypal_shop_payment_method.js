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
    const shippingAddress = that.options.checkout ? that.options.checkout.shipping_address : null;

    this.setError();

    const createPaymentOptions = {
      flow: 'vault',
      billingAgreementDescription: that.t(
        'payment_methods.shop_payment_methods.paypal.billing_agreement_description'
      ),
      enableShippingAddress: false,
      shippingAddressEditable: false
    };

    if (shippingAddress) {
      createPaymentOptions.enableShippingAddress = true;
      createPaymentOptions.shippingAddressOverride = {
        recipientName: shippingAddress.name,
        line1: shippingAddress.address1,
        line2: shippingAddress.address2,
        city: shippingAddress.city,
        countryCode: shippingAddress.country_code,
        postalCode: shippingAddress.zip,
        state: shippingAddress.province_code,
        phone: shippingAddress.phone
      };
    }

    return this.paypalCheckoutInstance.createPayment(createPaymentOptions);
  }

  onApprove(data, actions) {
    const that = this;

    return this.paypalCheckoutInstance.tokenizePayment(data, (error, payload) => {
      if (error) {
        that.setError(this.t('payment_methods.shop_payment_methods.paypal.error_unknown'));
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
    this.setError(
      this.t('payment_methods.shop_payment_methods.paypal.error_unknown')
    );
  }

  validate() {
    if (!this.paypalButtonReady) {
      return [
        this.setError(
          this.t('payment_methods.shop_payment_methods.paypal.error_not_ready')
        )
      ];
    }

    if (!this.billingAgreementNonce) {
      return [
        this.setError(
          this.t(
            'payment_methods.shop_payment_methods.paypal.error_not_approved'
          )
        )
      ];
    }

    return [];
  }

  setError(message) {
    this.$container.removeClass('braintree-paypal--has-success');
    this.$container.toggleClass('braintree-paypal--has-error', !!message);
    this.$message.text(
      message ||
        this.t('payment_methods.shop_payment_methods.paypal.instructions')
    );
    return message;
  }

  setSuccess() {
    this.$container.removeClass('braintree-paypal--has-error');
    this.$container.addClass('braintree-paypal--has-success');
    this.$message.text(
      this.t('payment_methods.shop_payment_methods.paypal.success')
    );
  }

  process(success, error) {
    const that = this;

    setTimeout(() => {
      if (!that.billingAgreementNonce) {
        error(
          this.t(
            'payment_methods.shop_payment_methods.paypal.error_not_approved'
          )
        );
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
      title: this.t('payment_methods.shop_payment_methods.paypal.title'),
      value: this.getValue(),
      subfields_content: this.options.html_templates.braintree_paypal_subfields_content,
      icon: 'icons_paypal'
    };
  }

  getRenderTemplate() {
    if (this.options.html_templates.shop_payment_method_braintree_paypal) {
      return 'shop_payment_method_braintree_paypal';
    }

    return 'shop_payment_method';
  }
}
