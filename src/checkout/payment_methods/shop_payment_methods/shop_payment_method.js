import SubmarinePaymentMethod from "../submarine_payment_method";

export class ShopPaymentMethod extends SubmarinePaymentMethod {

  getRenderContext() {
    return {
      id: this.data.id,
      title: this.data.attributes.payment_method_type
    }
  }

  getRenderTemplate() {
    return 'shop_payment_method';
  }

}
