import { CustardModule, STEP_PAYMENT_METHOD } from "@discolabs/custard-js";

import { Submarine } from "../submarine";
import { createShopPaymentMethod } from "./payment_methods/shop_payment_methods";
import { createCustomerPaymentMethod } from "./payment_methods/customer_payment_methods";

const SHOPIFY_GATEWAY_INPUT_SELECTOR = '[name="checkout[payment_gateway]"]';
const SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR = '[name="checkout[attributes][_payment_method]"]';
const SUBMARINE_PAYMENT_METHOD_LABEL_SELECTOR = '[data-select-payment-method] label';
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

    // Sort Shopify gateways and payment methods if so defined.
    this.sortGatewaysAndPaymentMethods();

    // Get references to the Submarine payment method inputs.
    this.$submarinePaymentMethodInputs = this.$element.find(SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR);
    this.$submarinePaymentMethodSubfieldsElements = this.$element.find(SUBMARINE_SUBFIELDS_ELEMENT_SELECTOR);

    // Set up event listeners.
    this.$element.on('change', SHOPIFY_GATEWAY_INPUT_SELECTOR, this.onShopifyGatewayChange.bind(this));
    this.$element.on('change', SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR, this.onSubmarinePaymentMethodChange.bind(this));
    this.$element.on('click', SUBMARINE_PAYMENT_METHOD_LABEL_SELECTOR, this.onSubmarinePaymentMethodLabelClick.bind(this));
    this.$form.on('submit', this.onFormSubmit.bind(this));

    // Start the (asynchronous) loading of each payment method.
    this.loadPaymentMethods();

    // If Submarine is the only payment gateway, select the first payment gateway option
    this.$firstPaymentGatewayOption = this.$element.find('[data-select-payment-method]').first().find('label');

    if (this.submarineIsOnlyPaymentGateway()) {
      this.$firstPaymentGatewayOption.click();
    }
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
      return createCustomerPaymentMethod(this.$, this.options, this.options.submarine.translations, customer_payment_method);
    });
  }

  getShopPaymentMethods() {
    return this.options.submarine.shop_payment_methods.data.map((shop_payment_method) => {
      return createShopPaymentMethod(this.$, this.options, this.options.submarine.translations, shop_payment_method);
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
        this.$(submarinePaymentMethodInput).prop('checked', false);
      });
    }

    // Ensure Submarine subfields elements are hidden/shown as appropriate.
    this.toggleSubmarineSubfieldsElements();
  }

  onSubmarinePaymentMethodChange() {
    const $selectedSubmarinePaymentMethodInput = this.$element.find(`${SUBMARINE_PAYMENT_METHOD_INPUT_SELECTOR}:checked`);
    const $selectedSubmarinePaymentMethodElement = $selectedSubmarinePaymentMethodInput.closest('[data-select-payment-method]');
    const $selectedShopifyGatewayElement = this.$element.find(`${SHOPIFY_GATEWAY_INPUT_SELECTOR}`).closest('[data-select-gateway]');

    this.selectedSubmarinePaymentMethod = $selectedSubmarinePaymentMethodElement.attr('data-select-payment-method');

    // If Shopify payment gateways have been disabled and Submarine is the only payment gateway,
    // be able to check if Submarine is the selected payment gateway
    if (this.submarineIsOnlyPaymentGateway()) {
      this.selectedShopifyGatewayId = $selectedShopifyGatewayElement.attr('data-select-gateway');
    }

    // If a Submarine payment method was selected, ensure the Shopify Submarine gateway is selected under the hood.
    if(this.selectedSubmarinePaymentMethod !== undefined) {
      this.$submarineGatewayLabel.click();
    }

    // Ensure Submarine subfields elements are hidden/shown as appropriate.
    this.toggleSubmarineSubfieldsElements();
  }

  onSubmarinePaymentMethodLabelClick(e) {
    const $label = this.$(e.target);
    this.$(`#${$label.attr('for')}`).click();
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

  submarineIsOnlyPaymentGateway() {
    return this.$element.find(`${SHOPIFY_GATEWAY_INPUT_SELECTOR}`).attr('type') === 'hidden';
  }

  sortGatewaysAndPaymentMethods() {
    if(!this.options.submarine.payment_method_sort_order.length) { return; }
    const $sortableContainer = this.$element.find('[data-select-gateway],[data-subfields-for-gateway],[data-select-payment-method],[data-subfields-for-payment-method]').parent();
    let $sortableElements = $sortableContainer.children();
    $sortableElements.detach();
    $sortableElements = $sortableElements.sort((a, b) => {
      const aSortIndex = this.getSortableElementSortIndex(a);
      const bSortIndex = this.getSortableElementSortIndex(b);
      console.log(a, aSortIndex, b, bSortIndex);
      if(aSortIndex < bSortIndex) { return -1; }
      if(aSortIndex > bSortIndex) { return 1; }
      return 0;
    });
    $sortableContainer.html($sortableElements);
  }

  getSortableElementSortIndex(sortableElement) {
    const $sortableElement = this.$(sortableElement);
    const sortKey = $sortableElement.attr('data-select-gateway') || $sortableElement.attr('data-subfields-for-gateway') || $sortableElement.attr('data-select-payment-method') || $sortableElement.attr('data-subfields-for-payment-method');
    const sortIndex = this.options.submarine.payment_method_sort_order.indexOf(sortKey);
    return (sortIndex === -1) ? 999 : sortIndex;
  }

  onFormSubmit(e) {
    // If we've flagged the form as okay to submit, submit as normal.
    if(this.$form.attr('data-form-submarine-submit') === 'ok') {
      return true;
    }

    // Find the currently selected payment method.
    const selectedPaymentMethod = this.paymentMethods.find((paymentMethod) => {
      return this.selectedSubmarinePaymentMethod === paymentMethod.getValue();
    });

    // If there isn't a currently selected payment method, submit as normal.
    if(!selectedPaymentMethod) {
      return true;
    }

    e.preventDefault();
    this.startLoading();

    // Validate the payment method. If invalid, bail out.
    const validationErrors = selectedPaymentMethod.validate();
    if(validationErrors.length) {
      this.stopLoading();
      return;
    }

    // Perform processing.
    selectedPaymentMethod.process(
      this.onPaymentMethodProcessingSuccess.bind(this),
      this.onPaymentMethodProcessingError.bind(this),
      this.getAdditionalData()
    );
  }

  onPaymentMethodProcessingSuccess(payment_method_data) {
    payment_method_data.checkout_id = this.options.checkout.id;
    payment_method_data.customer_id = this.options.customer && this.options.customer.id;
    this.submarine.api.createPreliminaryPaymentMethod({ preliminary_payment_method: payment_method_data }, (result) => {
      if(result.success) {
        this.$form.attr('data-form-submarine-submit', 'ok');
        this.$form.submit();
      }
    });
  }

  onPaymentMethodProcessingError(error) {
    this.stopLoading();
    alert(error.message);
  }

  getAdditionalData() {
    return Object.assign(this.options.checkout, {
      billing_address: this.getBillingAddress()
    });
  }

  getBillingAddress() {
    const formData = this.getPaymentFormData();

    // If there's not a different billing address, return the shipping address.
    if(formData['checkout[different_billing_address]'] !== 'true') {
      return this.options.checkout.shipping_address;
    }

    // If there is a different billing address, return it in the expected format.
    return {
      address1: formData['checkout[billing_address][address1]'],
      address2: formData['checkout[billing_address][address2]'],
      city: formData['checkout[billing_address][city]'],
      company: formData['checkout[billing_address][company]'],
      country: formData['checkout[billing_address][country]'],
      country_code: formData['checkout[billing_address][country_code]'],
      first_name: formData['checkout[billing_address][first_name]'],
      last_name: formData['checkout[billing_address][last_name]'],
      province: formData['checkout[billing_address][province]'],
      province_code: formData['checkout[billing_address][province_code]'],
      zip: formData['checkout[billing_address][zip]'],
    };
  }

  getPaymentFormData() {
    return this.$form.serializeArray().reduce((formData, input) => {
      formData[input.name] = input.value;
      return formData;
    }, {});
  }

  startLoading() {
    this.$submitButton.addClass('btn--loading').prop('disabled', true);
  }

  stopLoading() {
    this.$submitButton.removeClass('btn--loading').prop('disabled', false);
  }

}
