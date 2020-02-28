import { ShopPaymentMethod } from './shop_payment_method';

export class SubmarineBankTransferShopPaymentMethod extends ShopPaymentMethod {

  process(success, error) {
    success({
      customer_payment_method_id: null,
      payment_nonce: null,
      payment_method_type: 'bank-transfer',
      payment_processor: 'submarine'
    });
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.t('payment_methods.shop_payment_methods.submarine.bank_transfer.title'),
      value: this.getValue(),
      subfields_content: this.options.html_templates.submarine_bank_transfer_subfields_content,
      subfields_class: '',
      icon: 'generic',
      icon_description: this.t('payment_methods.shop_payment_methods.submarine.bank_transfer.icon_description'),
      submarine_bank_transfer_message_js: this.t('payment_methods.shop_payment_methods.submarine.bank_transfer.submarine_bank_transfer_message_js'),
      submarine_bank_transfer_message_no_js: this.t('payment_methods.shop_payment_methods.submarine.bank_transfer.submarine_bank_transfer_message_no_js'),
    }
  }

}
