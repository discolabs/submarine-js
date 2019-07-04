import SubmarinePaymentMethod from "../submarine_payment_method";

export class ShopPaymentMethod extends SubmarinePaymentMethod {

  getValue() {
    return `shop_payment_method_${this.data.id}`;
  }

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.data.attributes.payment_method_type,
      value: this.getValue()
    }
  }

  getRenderTemplate() {
    return 'shop_payment_method';
  }

}
