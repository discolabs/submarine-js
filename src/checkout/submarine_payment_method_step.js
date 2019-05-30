import { CustardModule, STEP_PAYMENT_METHOD } from "@discolabs/custard-js";

import { Submarine } from "../submarine";
import { CustomerPaymentMethod } from "./payment_methods/customer_payment_method";

const SHOPIFY_PAYMENT_METHOD_INPUT_SELECTOR = '[name="checkout[payment_gateway]"]';
const SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR = '[name="checkout[attributes][_payment_method]"]';

export class SubmarinePaymentMethodStep extends CustardModule {

  id() {
    return 'submarine-payment-method-step';
  }

  steps() {
    return STEP_PAYMENT_METHOD;
  }

  selector() {
    return '[data-payment-method]';
  }

  setup() {
    this.$form = this.$element.closest('[data-payment-form]');
    this.$submitButton = this.$form.find('button[type="submit"]');

    this.$submarineGateway = this.$element.find(`[data-select-gateway="${this.options.submarine.submarine_gateway_id}"]`);
    this.$submarineGatewayLabel = this.$submarineGateway.find(`label[for="checkout_payment_gateway_${this.options.submarine.submarine_gateway_id}"]`);
    this.$submarineGatewayInput = this.$submarineGateway.find(`[name="checkout[payment_gateway]"]`);
    this.$submarineGatewaySubfields = this.$element.find(`[data-subfields-for-gateway="${this.options.submarine.submarine_gateway_id}"]`);

    // If the Submarine Gateway isn't present on the page, we have naught to do.
    if(!this.$submarineGateway.length) {
      return;
    }

    // Ensure we have a Submarine instance configured.
    this.setupSubmarine();

    // Get a list of configured Submarine payment methods.
    // This includes saved customer payment methods, and also shop payment methods.
    this.paymentMethods = this.getPaymentMethods();
    this.selectedPaymentMethod = this.paymentMethods[0];

    // Render Submarine payment method options.
    this.$submarineGateway.before(this.renderPaymentMethods());

    // Hide the Submarine payment method selector element, and remove the Submarine subfields element.
    this.$submarineGateway.hide();
    this.$submarineGatewaySubfields.remove();

    // Get references to
    // this.$shopifyPaymentMethodInputs = this.$element.find(SHOPIFY_PAYMENT_METHOD_INPUT_SELECTOR);
    this.$submarinePaymentMethodInputs = this.$element.find(SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR);

    // Set up event listeners.
    this.$element.on('change', SHOPIFY_PAYMENT_METHOD_INPUT_SELECTOR, this.onShopifyPaymentMethodChange.bind(this));
    this.$element.on('change', SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR, this.onSubmarinePaymentMethodChange.bind(this));
    this.$form.on('submit', this.onFormSubmit.bind(this));

    // Perform setup for each gateway.
    this.paymentMethods.forEach((paymentMethod) => {
      paymentMethod.setup();
    });

    this.onShopifyPaymentMethodChange();
    this.onSubmarinePaymentMethodChange();
  }

  setupSubmarine() {
    window.submarine = window.submarine || new Submarine({
      api_url: this.options.submarine.api_url, authentication: { shop: this.options.shop.permanent_domain },
      context: {}
    });
    this.submarine = window.submarine;
  }

  getPaymentMethods() {
    return [...this.getCustomerPaymentMethods(), ...this.getShopPaymentMethods()];
  }

  getCustomerPaymentMethods() {
    return this.options.submarine.customer_payment_methods.data.map((customer_payment_method) => {
      return new CustomerPaymentMethod(this.options, customer_payment_method);
    });
  }

  getShopPaymentMethods() {
    return this.options.submarine.shop_payment_methods.data.map((shop_payment_method) => {
      return ShopPaymentMethod(shop_payment_method, this.options);
    });
  }

  renderPaymentMethods() {
    return this.paymentMethods.reduce((html, payment_method, index) => {
      return html + payment_method.render(this.options.html_templates, index);
    }, '');
  }

  onShopifyPaymentMethodChange() {
    const $selectedShopifyPaymentMethodInput = this.$element.find(`${SHOPIFY_PAYMENT_METHOD_INPUT_SELECTOR}:checked`);
    const $selectedShopifyPaymentMethodElement = $selectedShopifyPaymentMethodInput.closest('[data-select-gateway]');
    const selectedShopifyPaymentGatewayId = $selectedShopifyPaymentMethodElement.attr('data-select-gateway');

    // If a non-Submarine payment method was selected, ensure Submarine payment methods are unselected.
    if(selectedShopifyPaymentGatewayId !== this.options.submarine.submarine_gateway_id) {
      this.$submarinePaymentMethodInputs.each((index, submarinePaymentMethodInput) => {
        $(submarinePaymentMethodInput).prop('checked', false);
      });
    }
  }

  onSubmarinePaymentMethodChange() {
    const $selectedSubmarinePaymentMethodInput = this.$element.find(`${SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR}:checked`);
    const $selectedSubmarinePaymentMethodElement = $selectedSubmarinePaymentMethodInput.closest('[data-select-payment-method]');

    // If a Submarine payment method was selected, ensure the Shopify Submarine gateway is selected under the hood.
    if($selectedSubmarinePaymentMethodInput.length) {
      this.$submarineGatewayLabel.click();
    }

    // Ensure the appropriate subfield element is rendered for the selected method.
    this.$element.find('[data-subfields-for-payment-method]').each((index, subfields) => {
      const $subfields = this.$(subfields);
      const isSubfieldElementForSelectedSubmarinePaymentMethod = $selectedSubmarinePaymentMethodInput.length && ($selectedSubmarinePaymentMethodElement.attr('data-select-payment-method') === $subfields.attr('data-subfields-for-payment-method'));
      $subfields.toggle(isSubfieldElementForSelectedSubmarinePaymentMethod);
    });
  }

  onFormSubmit(e) {
    if(this.$form.attr('data-form-submit') === 'ok') {
      return true;
    }

    e.preventDefault();
    this.startLoading();

    // Validate the payment method. If invalid, bail out.
    const validationErrors = this.selectedPaymentMethod.validate();
    if(validationErrors.length) {
      this.stopLoading();
      return;
    }

    // Perform processing.
    this.selectedPaymentMethod.process({
      success: this.onPaymentMethodProcessingSuccess.bind(this),
      error: this.onPaymentMethodProcessingError.bind(this)
    });
  }

  onPaymentMethodProcessingSuccess(payment_method_data) {
    payment_method_data.checkout_id = this.options.checkout.id;
    this.submarine.api.createPreliminaryPaymentMethod({ preliminary_payment_method: payment_method_data }, (result) => {
      if(result.success) {
        this.$form.attr('data-form-submit', 'ok');
        this.$form.submit();
      }
    });
  }

  onPaymentMethodProcessingError(error) {
    this.stopLoading();
    alert(error.message);
  }

  startLoading() {
    this.$submitButton.addClass('btn--loading').prop('disabled', true);
  }

  stopLoading() {
    this.$submitButton.removeClass('btn--loading').prop('disabled', false);
  }

}
