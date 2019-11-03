import { CustardModule, STEP_THANK_YOU, STEP_ORDER_STATUS } from "@discolabs/custard-js";

export class SubmarineThankYouStep extends CustardModule {

  id() {
    return "submarine-thank-you-step";
  }

  steps() {
    return [STEP_THANK_YOU, STEP_ORDER_STATUS];
  }

  selector() {
    return ".main__content";
  }

  setup() {
    this.updatePaymentMethodIcon();
  }

  updatePaymentMethodIcon() {
    this.paymentIcon = this.$element.find(".payment-icon");
    this.paymentIcon.removeClass("payment-icon--generic");
    this.paymentIcon.addClass(`payment-icon--${this.iconName()}`);
  }

  iconName() {
    const paymentMethod = this.options.order.attributes._payment_method;
    const allPaymentMethods = [
      ...this.options.submarine.shop_payment_methods.data,
      ...this.options.submarine.customer_payment_methods.data
    ];
    const [paymentMethodName, paymentMethodId] = paymentMethod.split(/_(?=\d+$)/);
    const paymentMethodData = allPaymentMethods.find(paymentMethod => {
      return paymentMethod["type"] === paymentMethodName && Number(paymentMethod["id"]) === Number(paymentMethodId);
    });

    if (paymentMethodData["type"] === "shop_payment_method") {
      const paymentMethodType = paymentMethodData.attributes.payment_method_type;
      if (paymentMethodType === "credit-card") return "generic";
      return paymentMethodType;
    } else {
      return paymentMethodData.attributes.payment_data.brand.replace(/\s+/g, "-").toLowerCase();
    }
  }

}
