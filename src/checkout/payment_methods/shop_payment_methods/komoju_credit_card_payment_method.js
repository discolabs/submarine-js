import { ShopPaymentMethod } from './shop_payment_method';

export class KomojuCreditCardShopPaymentMethod extends ShopPaymentMethod {

  process(success) {
    this.handler = Komoju.multipay.configure({
      key: this.data.attributes.publishable_api_key,
      token: token => success({
        customer_payment_method_id: null,
        payment_nonce: token.id,
        payment_method_type: 'credit-card',
        payment_processor: 'komoju'
      })
    });

    this.handler.open({
      amount: Number(this.options.checkout.total_price.replace(/,/g, '')),
      endpoint: "https://komoju.com",
      locale: this.options.shop.locale,
      currency: this.options.shop.currency,
      title: this.options.shop.name,
      methods: ["credit_card"],
      prefillEmail: this.options.customer.email
    });
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.t('payment_methods.shop_payment_methods.komoju.credit_card.title'),
      value: this.getValue(),
      subfields_content: this.options.html_templates.komoju_credit_card_subfields_content,
      subfields_class: '',
      icon: 'generic',
      icon_description: this.t('payment_methods.shop_payment_methods.komoju.credit_card.icon_description'),
      komoju_credit_card_message_js: this.t('payment_methods.shop_payment_methods.komoju.credit_card.komoju_credit_card_message_js'),
      komoju_credit_card_message_no_js: this.t('payment_methods.shop_payment_methods.komoju.credit_card.komoju_credit_card_message_no_js')
    }
  }

}
