import payform from 'payform';
import { ShopPaymentMethod } from './shop_payment_method';

const CYBERSOURCE_CARD_TYPE_MAPPINGS = {
  visa: '001',
  mastercard: '002',
  amex: '003',
  discover: '004',
  dinersclub: '005',
  jcb: '007',
  maestro: '024',
  visaelectron: '033',
  dankort: '034',
  unionpay: '062',
  forbrugsforeningen: null
};

const PUBLIC_KEY_ENCRYPTION_TYPE_NONE = 'none';
// const PUBLIC_KEY_ENCRYPTION_TYPE_RSAOAEP = 'rsaoaep';
const PUBLIC_KEY_ENCRYPTION_TYPE_RSAOAEP256 = 'rsaoaep256';

const KEY_TYPE_RSA = 'RSA';

const MAXIMUM_FUTURE_EXPIRY_IN_YEARS = 15;

export class CybersourceCreditCardShopPaymentMethod extends ShopPaymentMethod {
  beforeSetup() {
    this.$subfields = this.$(
      `[data-subfields-for-payment-method="shop_payment_method_${this.data.id}"]`
    );
    this.$cardNumber = this.$subfields.find('#cybersource-credit-card-number');
    this.$cardName = this.$subfields.find('#cybersource-credit-card-name');
    this.$cardExpiry = this.$subfields.find('#cybersource-credit-card-expiry');
    this.$cardCvv = this.$subfields.find('#cybersource-credit-card-cvv');
  }

  setup(success, failure) {
    const that = this;

    // Register an event listener to clear validation errors.
    this.$subfields.on('input', this.onInputChange.bind(this));

    // Start by generating a Cybersource client token and storing it for later use.
    submarine.api // eslint-disable-line no-undef
      .generatePaymentProcessorClientToken('cybersource', client_token => {
        that.client_token = client_token;

        // Set up Payform formatters on inputs.
        payform.cardNumberInput(that.$cardNumber[0]);
        payform.expiryInput(that.$cardExpiry[0]);
        payform.cvcInput(that.$cardCvv[0]);

        success();
      })
      .catch(error => {
        failure(error);
      });
  }

  getState() {
    const number = this.$cardNumber.val();
    const name = this.$cardName.val();
    const expiry = payform.parseCardExpiry(this.$cardExpiry.val());
    const cvv = this.$cardCvv.val();
    const cardType = payform.parseCardType(number);
    const cybersourceCardType = cardType
      ? CYBERSOURCE_CARD_TYPE_MAPPINGS[cardType]
      : null;

    return {
      number: {
        value: number,
        valid:
          payform.validateCardNumber(number) && this.isValidCardType(cardType)
      },
      name: {
        value: name,
        valid: !!name.length
      },
      expiry: {
        value: expiry,
        valid: this.isValidExpiry(expiry.month, expiry.year)
      },
      cvv: {
        value: cvv,
        valid: payform.validateCardCVC(cvv, cardType)
      },
      cardType: {
        value: cardType,
        valid: !!cardType
      },
      cybersourceCardType: {
        value: cybersourceCardType,
        valid: !!cybersourceCardType
      }
    };
  }

  validate() {
    const state = this.getState();
    const errors = [];
    Object.keys(state).forEach(key => {
      if (!state[key].valid) {
        errors.push(key);
      }
    });
    this.displayValidationErrors(state, errors);
    return errors;
  }

  isValidCardType(cardType) {
    return (
      !!cardType &&
      ['visa', 'mastercard', 'amex', 'discover'].indexOf(cardType) !== -1
    );
  }

  isValidExpiry(month, year) {
    if (!payform.validateCardExpiry(month, year)) {
      return false;
    }

    // Payform does not enforce any maximum future expiry, so we add our own here.
    const currentYear = new Date().getFullYear();
    return year < currentYear + MAXIMUM_FUTURE_EXPIRY_IN_YEARS;
  }

  displayValidationErrors(state, errors) {
    this.$cardNumber
      .closest('.field')
      .toggleClass('field--error field--submarine-error', !state.number.valid);
    this.$cardName
      .closest('.field')
      .toggleClass('field--error field--submarine-error', !state.name.valid);
    this.$cardExpiry
      .closest('.field')
      .toggleClass('field--error field--submarine-error', !state.expiry.valid);
    this.$cardCvv
      .closest('.field')
      .toggleClass('field--error field--submarine-error', !state.cvv.valid);

    if (errors.length) {
      this.$subfields
        .find('.field--error input')
        .first()
        .focus();
    }
  }

  onInputChange(e) {
    this.$(e.target)
      .closest('.field')
      .toggleClass('field--error field--submarine-error', false);
  }

  process(success, error) {
    const state = this.getState();

    const expiryMonthAsString = (state.expiry.value.month || '').toString();
    const expiryYearAsString = (state.expiry.value.year || '').toString();

    const flexOptions = {
      kid: this.client_token.attributes.token,
      keystore: this.client_token.attributes.data.jwk,
      cardInfo: {
        cardNumber: state.number.value,
        cardType: state.cybersourceCardType.value,
        cardExpirationMonth:
          (expiryMonthAsString.length === 1 ? '0' : '') + expiryMonthAsString,
        cardExpirationYear: expiryYearAsString
      },
      encryptionType: this.getPublicKeyEncryptionType(this.client_token),
      production: this.options.submarine.environment === 'production'
    };

    // eslint-disable-next-line no-undef
    flex.createToken(flexOptions, response => {
      if (!response.error) {
        success({
          customer_payment_method_id: null,
          payment_nonce: response.token,
          payment_method_type: 'credit-card',
          payment_processor: 'cybersource',
          additional_data: {
            last4: state.number.value.substring(state.number.value.length - 4),
            exp_year: state.expiry.value.year,
            exp_month: state.expiry.value.month,
            card_type: state.cardType.value,
            security_code: state.cvv.value
          }
        });
      } else {
        error({
          message: response
        });
      }
    });
  }

  /**
   * Given a client token, return the type of encryption used for the public
   * key. Note that this function currently cannot distinguish between RSAOAEP
   * and RSAOAEP256 encryption types, as there's no specific attribute that's
   * return that lets us determine this.
   *
   * @param client_token
   * @returns {string}
   */
  getPublicKeyEncryptionType(client_token) {
    if (
      client_token.attributes.data.jwk &&
      client_token.attributes.data.jwk.kty === KEY_TYPE_RSA
    ) {
      return PUBLIC_KEY_ENCRYPTION_TYPE_RSAOAEP256;
    }

    return PUBLIC_KEY_ENCRYPTION_TYPE_NONE;
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.t(
        'payment_methods.shop_payment_methods.cybersource.credit_card.title'
      ),
      value: this.getValue(),
      subfields_content: this.options.html_templates
        .cybersource_credit_card_subfields_content,
      subfields_class: 'card-fields-container',
      icon: 'generic',
      icon_description: this.t(
        'payment_methods.shop_payment_methods.cybersource.credit_card.icon_description'
      )
    };
  }
}
