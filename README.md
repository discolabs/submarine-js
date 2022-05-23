# Submarine.js
Submarine.js is a Javascript library that targets the browser.

It's designed to make it easy for developers to integrate Shopify Plus stores with [Submarine](https://hub.getsubmarine.com), a platform for designing bespoke tokenised payment experiences like subscriptions, presales, and one-click upsells.
The platform (and this repository) is built and maintained by [Disco Labs](https://www.discolabs.com), a Shopify Plus partner agency.

## Usage
Depending on how you're building your Shopify theme, you can integrate Submarine.js in a couple of different ways.

The first (and simplest) is to import the client library on the pages you want to interact with Submarine via a `<script>` tag, for example:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@discolabs/submarine-js@0.4.0-beta.1/dist/submarine.js"></script>
```

Alternatively, if you're using your own build process for your theme via Webpacker or similar, you can add Submarine.js as a dependency to your project and import it:

```shell
npm install @discolabs/submarine-js
```

or

```shell
yarn add @discolabs/submarine-js
```

and then:

```js
// assuming you're using ES modules
import { Submarine } from 'submarine-js';
```

### Initialisation
The Submarine.js library provides a `Submarine` class, which should be initialised with environmental context so that API calls can successfully be made:

```js
const submarine = new Submarine({
  environment: "staging",
  authentication: {
    customer_id: "6211133636859",
    shop: "submarine-js.myshopify.com",
    timestamp: "1653301600549",
    signature: "a59e4eeba497d629170ffabfee90aee9ceaa9ca8d7f3fe5e155bb082160d2ac7"
  }
});
```

The `environment` initialisation option tells the client which API endpoint to make requests against.

The `authentication` initialisation options provides information about the context the client's being initialised in, specifically the authentication information for the currently logged in customer - see "Authentication" below.

### Authentication
Because the Submarine Customer API is returning sensitive customer information (a list of their stored payment methods, saved subscriptions, and the contents of those subscriptions), authentication in required to retrieve or update any customer information.

Requests to the API are authenticated by providing three parameters in the querystring of all HTTP requests (whether `GET` or `POST` requests):

* `shop` - the Shopify domain of the current store, eg `example.myshopify.com`;
* `timestamp` - a UNIX timestamp of when the request was generated;
* `signature` - a SHA256 HMAC signature generated from the ID of the logged in customer, the timestamp value, and a secret key made available to your theme via a shop-level metafield `shop.metafields.submarine.customer_api_secret`.

For Shopify themes, these values should be generated within your Liquid templates and passed during initialisation. For other clients, such as mobile apps, these values should be generated within your application code before making calls.

Here's an example of how you can initialised the Submarine client library within a Liquid template in your Shopify theme:

```liquid
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@discolabs/submarine-js@0.4.0-beta.1/dist/submarine.js"></script>

{% assign api_timestamp = 'now' | date: '%s' %}
{% assign api_data = customer.id | append: ':' | append: api_timestamp %}
{% assign api_signature = api_data | hmac_sha256: shop.metafields.submarine.customer_api_secret %}

<script>
  window.submarine = new Submarine({
    environment: "production",
    authentication: {
      customer_id: "{{ customer.id }}",
      shop: "{{ shop.permanent_domain }}",
      timestamp: "{{ api_timestamp }}",
      signature: "{{ api_signature }}"
    }
  });
</script>
```

### Making API Calls
Once you have an initialised client, making API calls is pretty simple:

```js
const submarine = new Submarine({ ...config });

submarine.api.getSubscriptions((subscriptions, errors) => {
  if(errors) {
    // handle errors here
    return;
  }
  
  // handle success here
  console.log(subscriptions);
});
```

All API calls take a `callback` function argument with a `(result, errors)` signature.
Your callback function should check for the presence of `errors`, handle it as needed, and otherwise process the `result`.

## Reference
This section describes each of the API methods available via the client, their method signature, and an example usage.
Full details of all request/response parameters are available on the [Submarine Hub](https://hub.getsubmarine.com/reference).

### Payment methods

#### Get payment methods
Get a list of payment methods for the currently authenticated customer.

```js
submarine.api.getPaymentMethods((paymentMethods, errors) => {
  // paymentMethods is an array of stored payment methods
});
```

#### Create a payment method
Create a new payment method for the currently authenticated customer.

```js
submarine.api.createPaymentMethod({
  payment_token: "abc123",
  payment_method_type: "credit-card",
  payment_processor: "stripe",
  status: "active"
}, (createdPaymentMethod, errors) => {
  // createdPaymentMethod is the newly stored payment method
});
```

Learn more about the attributes used to create a new payment method [here](https://hub.getsubmarine.com/docs/payment-method-endpoints#post-create-new-payment-method).

#### Get a payment method
Get the specified payment method for the currently authenticated customer.

```js
submarine.api.getPaymentMethod(1750, (paymentMethod, errors) => {
  // paymentMethod is the specified stored payment method
});
```

#### Update a payment method
Update the specified payment method for the currently authenticated customer.

```js
submarine.api.updatePaymentMethod(1750, {
    default: false,
    status: "disabled"
  },
  (paymentMethod, errors) => {
    // paymentMethod is the updated payment method
  }
);
```

#### Remove a payment method
Remove the specified payment method for the currently authenticated customer.

```js
submarine.api.removePaymentMethod(1750,
  (paymentMethod, errors) => {
    // paymentMethod is the removed payment method
  }
);
```

### Subscriptions

#### Get subscriptions
Get a list of subscriptions for the currently authenticated customer.

```js
submarine.api.getSubscriptions((subscriptions, errors) => {
  // subscriptions is an array of subscriptions
});
```

#### Bulk update subscriptions
Update multiple subscriptions at once for the currently authenticated customer.

```js
submarine.api.bulkUpdateSubscriptions([1212, 1245], {
    payment_method_id: 345
  },
  (results, errors) => {
    // results is an object with two array attributes, `successes` and `failures`
  }
);
```

#### Get a subscription
Get a specific subscription for the currently authenticated customer.

```js
submarine.api.getSubscription(1212, (subscription, errors) => {
  // subscription is the specified subscription
});
```

#### Update a subscription
Update the specified subscription for the currently authenticated customer.

```js
submarine.api.updateSubscription(1212, {
    status: "paused"
  },
  (subscription, errors) => {
    // subscription is the updated subscription
  }
);
```

Learn more about the attributes used to update subscriptions [here](https://hub.getsubmarine.com/docs/building-subscription-management-into-your-customer-account-pages).

#### Duplicate a subscription
Duplicate the specified subscription for the currently authenticated customer.

```js
submarine.api.duplicateSubscription(1212,
  (subscription, errors) => {
    // subscription is the newly duplicated subscription
  }
);
```

### Upsells

#### Create an upsell
Create an upsell for the specified order.

```js
submarine.api.createUpsell(394573949234, {
    variant_id: 2384723942,
    quantity: 2,
    notify_customer: false   
  },
  (subscription, errors) => {
    // subscription is the newly duplicated subscription
  }
);
```

### Other

#### Generate a payment processor client token
Generate a client token for the specified payment processor.

```js
submarine.api.generatePaymentProcessorClientToken('braintree',
  (clientToken, errors) => {
    // clientToken is a client-side token
  }
);
```

## Development
Dependencies for this project are listed in the `package.json`.
Before you start developing, ensure you have [NPM](https://www.npmjs.com) and [Yarn](https://yarnpkg.com) installed, then:

```shell
git clone https://github.com/discolabs/submarine-js.git
cd submarine-js
yarn
``` 

The library uses [Vite](https://vitejs.dev) to provide a streamlined development experience with hot module reloading, alongside distribution building.

Running `yarn dev` from the command line will spin up a local development page that can be accessed from the browser.
This page also generates a set of development credentials that can be used to make real requests against the Submarine API from the browser.

## Licence
The Submarine JavaScript API Client is an open-sourced software licensed under the [MIT license](LICENSE.md).