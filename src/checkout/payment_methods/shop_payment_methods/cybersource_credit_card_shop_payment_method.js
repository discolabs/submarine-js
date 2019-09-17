import { ShopPaymentMethod } from './shop_payment_method';

import payform from "payform";

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
  forbrugsforeningen: null,
};

export class CybersourceCreditCardShopPaymentMethod extends ShopPaymentMethod {

  beforeSetup() {
    this.$subfields = this.$(`[data-subfields-for-payment-method="shop_payment_method_${this.data.id}"]`);
    this.$cardNumber = this.$subfields.find('#cybersource-credit-card-number');
    this.$cardExpiry = this.$subfields.find('#cybersource-credit-card-expiry');
    this.$cardCvv = this.$subfields.find('#cybersource-credit-card-cvv');
  }

  setup(success, failure) {
    const that = this;

    // Start by generating a Cybersource client token and storing it for later use.
    submarine.api.generatePaymentProcessorClientToken('cybersource', (client_token) => {
      that.client_token = client_token;

      // Set up Payform formatters on inputs.
      payform.cardNumberInput(that.$cardNumber[0]);
      payform.expiryInput(that.$cardExpiry[0]);
      payform.cvcInput(that.$cardCvv[0]);

      success();
    }).catch((error) => {
      failure(error);
    });
  }

  getState() {
    const number = this.$cardNumber.val();
    const expiry = payform.parseCardExpiry(this.$cardExpiry.val());
    const cvv = this.$cardCvv.val();
    const cardType = payform.parseCardType(number);
    const cybersourceCardType = cardType ? CYBERSOURCE_CARD_TYPE_MAPPINGS[cardType] : null;

    return {
      number: {
        value: number,
        valid: payform.validateCardNumber(number)
      },
      expiry: {
        value: expiry,
        valid: payform.validateCardExpiry(expiry.month, expiry.year)
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
    let errors = [];
    Object.keys(state).forEach((key) => {
      if(!state[key].valid) {
        errors.push(key);
      }
    });
    return errors;
  }

  process(success, error, additionalData) {
    const state = this.getState();

    const flexOptions = {
      kid: this.client_token.attributes.token,
      keystore: this.client_token.attributes.data.jwk,
      cardInfo: {
        cardNumber: state.number.value,
        cardType: state.cybersourceCardType.value,
        expiryMonth: state.expiry.value.month,
        expiryYear: state.expiry.value.year
      },
      encryptionType: 'rsaoaep256'
    };

    flex.createToken(flexOptions, (response) => {
      if(!response.error) {
        success({
          customer_payment_method_id: null,
          payment_nonce: response.token,
          payment_method_type: 'credit-card',
          payment_processor: 'cybersource',
          additional_data: {
            last4: state.number.value.substring(state.number.value.length - 4),
            exp_year: state.expiry.value.year,
            exp_month: state.expiry.value.month
          }
        });
      } else {
        error({
          message: response
        });
      }
    });
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.t('payment_methods.shop_payment_methods.cybersource.credit_card.title'),
      value: this.getValue(),
      subfields_content: this.options.html_templates.cybersource_credit_card_subfields_content,
      subfields_class: 'card-fields-container',
      icon: 'generic',
      icon_description: this.t('payment_methods.shop_payment_methods.cybersource.credit_card.icon_description')
    }
  }

}
