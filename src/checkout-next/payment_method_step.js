import { CustardModule, STEP_PAYMENT_METHOD } from '@discolabs/custard-js';
import { initialiseGateways } from "./helpers/gateways";

export class SubmarinePaymentMethodStep extends CustardModule {
  id() {
    return 'submarine-payment-method-step';
  }

  steps() {
    return [STEP_PAYMENT_METHOD];
  }

  selector() {
    return '[data-payment-method]';
  }

  setup() {
    this.$form = this.$element.closest('[data-payment-form]');
    this.$submitButton = this.$form.find('button[type="submit"]');

    this.gateways = initialiseGateways(
      document.querySelectorAll('[data-select-gateway]')
    );
  }
}
