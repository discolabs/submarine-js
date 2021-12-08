import { RadioWrapperIcon } from "./radio-wrapper-icon";

export const RadioWrapper = ({ gatewayId }) => {
  return (
    <div class="radio-wrapper content-box__row" data-gateway-group="offsite" data-gateway-name="offsite" data-select-gateway={gatewayId} data-submit-i18n-key="complete_order">
      <input value={gatewayId} autocomplete="off" size="30" type="hidden" name="checkout[payment_gateway]" />

        <div class="radio__label  radio__label--inactive">
          <h3 class="radio__label__primary content-box__emphasis">
            Credit card
          </h3>
          <div class="radio__label__accessory">
            <h3 class="visually-hidden">
              Pay with:
            </h3>

            <ul role="list" data-brand-icons-for-gateway={gatewayId}>
              <RadioWrapperIcon icon="visa" label="Visa" />
              <RadioWrapperIcon icon="master" label="Mastercard" />
              <RadioWrapperIcon icon="american-express" label="American Express" />
            </ul>
          </div>
        </div>

        <div id={`payment_gateway_${gatewayId}_description`} class="visually-hidden" aria-live="polite" data-detected="Detected card brand: {brand}" />
    </div>
  );
};
