import { CustardModule, STEP_PAYMENT_METHOD } from "@discolabs/custard-js";

import { Submarine } from "../submarine";
import { createShopPaymentMethod } from "./payment_methods/shop_payment_methods";
import { createCustomerPaymentMethod } from "./payment_methods/customer_payment_methods";

const SHOPIFY_GATEWAY_INPUT_SELECTOR = '[name="checkout[payment_gateway]"]';
const SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR = '[name="checkout[attributes][_payment_method]"]';
const SUBMARINE_SUBFIELDS_ELEMENT_SELECTOR = '[data-subfields-for-payment-method]';

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
    this.$submarineGatewaySubfields = this.$element.find(`[data-subfields-for-gateway="${this.options.submarine.submarine_gateway_id}"]`);

    // If the Submarine Gateway isn't present on the page, we have naught to do.
    if(!this.$submarineGateway.length) {
      return;
    }

    // Define variables to store selected gateway and Submarine payment method.
    this.selectedShopifyGatewayId = null;
    this.selectedSubmarinePaymentMethod = null;

    // Ensure we have a Submarine instance configured.
    this.setupSubmarine();

    // Get a list of configured Submarine payment methods.
    // This includes saved customer payment methods, and also shop payment methods.
    this.paymentMethods = this.getPaymentMethods();

    // Render Submarine payment method options.
    this.$submarineGateway.before(this.renderPaymentMethods());

    // Hide the Submarine payment method selector element, and remove the Submarine subfields element.
    this.$submarineGateway.hide();
    this.$submarineGatewaySubfields.remove();

    // Get references to the Submarine payment method inputs.
    this.$submarinePaymentMethodInputs = this.$element.find(SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR);
    this.$submarinePaymentMethodSubfieldsElements = this.$element.find(SUBMARINE_SUBFIELDS_ELEMENT_SELECTOR);

    // Set up event listeners.
    this.$element.on('change', SHOPIFY_GATEWAY_INPUT_SELECTOR, this.onShopifyGatewayChange.bind(this));
    this.$element.on('change', SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR, this.onSubmarinePaymentMethodChange.bind(this));
    this.$form.on('submit', this.onFormSubmit.bind(this));

    // Start the (asynchronous) loading of each payment method.
    this.loadPaymentMethods();
  }

  setupSubmarine() {
    window.submarine = window.submarine || new Submarine({
      api_url: this.options.submarine.api_url, authentication: { shop: this.options.shop.permanent_domain },
      context: {}
    });
    this.submarine = window.submarine;
  }

  loadPaymentMethods() {
    Promise.all(this.paymentMethods.map((paymentMethod) => {
      return paymentMethod.load();
    }))
    .then(this.paymentMethodsSetupSuccess.bind(this))
    .catch(this.paymentMethodsSetupFailure.bind(this))
    .finally(this.paymentMethodsSetupComplete.bind(this))
  }

  paymentMethodsSetupSuccess(result) {
    console.log('Successfully loaded Submarine payment methods.', result);
  }

  paymentMethodsSetupFailure(result) {
    console.error('Could not load Submarine payment methods.', result);
  }

  paymentMethodsSetupComplete(result) {
    this.onShopifyGatewayChange();
    this.onSubmarinePaymentMethodChange();
  }

  getPaymentMethods() {
    return [...this.getCustomerPaymentMethods(), ...this.getShopPaymentMethods()];
  }

  getCustomerPaymentMethods() {
    return this.options.submarine.customer_payment_methods.data.map((customer_payment_method) => {
      return createCustomerPaymentMethod(this.$, this.options, customer_payment_method);
    });
  }

  getShopPaymentMethods() {
    return this.options.submarine.shop_payment_methods.data.map((shop_payment_method) => {
      return createShopPaymentMethod(this.$, this.options, shop_payment_method);
    });
  }

  renderPaymentMethods() {
    return this.paymentMethods.reduce((html, payment_method, index) => {
      return html + payment_method.render(this.options.html_templates, index);
    }, '');
  }

  onShopifyGatewayChange() {
    const $selectedShopifyGatewayInput = this.$element.find(`${SHOPIFY_GATEWAY_INPUT_SELECTOR}:checked`);
    const $selectedShopifyGatewayElement = $selectedShopifyGatewayInput.closest('[data-select-gateway]');
    this.selectedShopifyGatewayId = $selectedShopifyGatewayElement.attr('data-select-gateway');

    // If the gateway that was selected isn't Submarine, ensure that Submarine payment methods are unselected.
    if(!this.submarineGatewayIsSelected()) {
      this.selectedSubmarinePaymentMethod = null;
      this.$submarinePaymentMethodInputs.each((index, submarinePaymentMethodInput) => {
        $(submarinePaymentMethodInput).prop('checked', false);
      });
    }

    // Ensure Submarine subfields elements are hidden/shown as appropriate.
    this.toggleSubmarineSubfieldsElements();
  }

  onSubmarinePaymentMethodChange() {
    const $selectedSubmarinePaymentMethodInput = this.$element.find(`${SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR}:checked`);
    const $selectedSubmarinePaymentMethodElement = $selectedSubmarinePaymentMethodInput.closest('[data-select-payment-method]');
    this.selectedSubmarinePaymentMethod = $selectedSubmarinePaymentMethodElement.attr('data-select-payment-method');

    // If a Submarine payment method was selected, ensure the Shopify Submarine gateway is selected under the hood.
    if(this.selectedSubmarinePaymentMethod !== undefined) {
      this.$submarineGatewayLabel.click();
    }

    // Ensure Submarine subfields elements are hidden/shown as appropriate.
    this.toggleSubmarineSubfieldsElements();
  }

  toggleSubmarineSubfieldsElements() {
    this.$submarinePaymentMethodSubfieldsElements.each((index, subfieldsElement) => {
      const $subfieldsElement = this.$(subfieldsElement);
      const isSubfieldsElementForSelectedSubmarinePaymentMethod = this.submarineGatewayIsSelected() &&  ($subfieldsElement.attr('data-subfields-for-payment-method') === this.selectedSubmarinePaymentMethod);
      $subfieldsElement.toggle(isSubfieldsElementForSelectedSubmarinePaymentMethod);
    });
  }

  submarineGatewayIsSelected() {
    return this.selectedShopifyGatewayId === this.options.submarine.submarine_gateway_id;
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
